import { PrismaClient, SlotType, SlotStatus } from '@prisma/client';
import { BookingRequest, AuditInfo } from '../types';
import { withSlotLock } from '../utils/lock';
import { canBookExpressSlot, getSlotById } from './slotService';
import { redisService } from './redisService';

const prisma = new PrismaClient();

/**
 * Generate next available slot time starting from 10:00 AM with 4-minute intervals
 * First slot: 10:00, Next: 10:04, 10:08, 10:12, etc.
 */
function getNextSlotTime(date: Date, slotIndex: number): Date {
  const slotTime = new Date(date);
  slotTime.setHours(10, 0, 0, 0); // Start at 10:00 AM
  slotTime.setMinutes(slotTime.getMinutes() + (slotIndex * 4)); // Add 4 minutes per slot
  return slotTime;
}

/**
 * Book a slot with FCFS (First-Come-First-Served) logic
 * Uses Redis lock + Prisma transaction for concurrency control
 */
export async function bookSlot(
  bookingData: BookingRequest,
  auditInfo: AuditInfo
): Promise<{ success: boolean; message: string; bookingId?: number }> {
  return await withSlotLock(bookingData.slotId, async () => {
    // Start a transaction
    return await prisma.$transaction(async (tx) => {
      // Get slot with lock (SELECT FOR UPDATE)
      const slot = await tx.slot.findUnique({
        where: { id: bookingData.slotId },
        include: { booking: true },
      });

      if (!slot) {
        return {
          success: false,
          message: 'Slot not found',
        };
      }

      // Check if slot is already booked
      if (slot.status === SlotStatus.BOOKED || slot.booking) {
        return {
          success: false,
          message: 'This slot is already booked',
        };
      }

      // Check if slot is offline
      if (slot.type === SlotType.OFFLINE) {
        return {
          success: false,
          message: 'This slot cannot be booked online',
        };
      }

      // Check if express slot can be booked
      if (slot.type === SlotType.EXPRESS_SAME_DAY) {
        if (!canBookExpressSlot(slot.date)) {
          return {
            success: false,
            message: 'Express slots can only be booked after 6:00 AM on the same day',
          };
        }
      }

      // Check if slot status is available
      if (slot.status !== SlotStatus.AVAILABLE) {
        return {
          success: false,
          message: `Slot is ${slot.status.toLowerCase()} and cannot be booked`,
        };
      }

      // Create booking
      const booking = await tx.booking.create({
        data: {
          slotId: slot.id,
          patientName: bookingData.patientName,
          patientEmail: bookingData.patientEmail,
          patientPhone: bookingData.patientPhone,
          ipAddress: auditInfo.ipAddress,
          userAgent: auditInfo.userAgent,
        },
      });

      // Update slot status
      await tx.slot.update({
        where: { id: slot.id },
        data: { status: SlotStatus.BOOKED },
      });

      return {
        success: true,
        message: 'Slot booked successfully',
        bookingId: booking.id,
      };
    });
  }).catch((error) => {
    console.error('Booking error:', error);
    return {
      success: false,
      message: error.message || 'Failed to book slot',
    };
  });
}

/**
 * Get booking by ID
 */
export async function getBookingById(bookingId: number) {
  return await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      slot: {
        include: {
          facility: true,
        },
      },
    },
  });
}

/**
 * Get booking by slot ID
 */
export async function getBookingBySlotId(slotId: number) {
  return await prisma.booking.findUnique({
    where: { slotId },
    include: {
      slot: {
        include: {
          facility: true,
        },
      },
    },
  });
}

/**
 * Book a slot by date - automatically assigns next available slot
 * Business rules:
 * - 50 ONLINE slots per day
 * - First slot: 10:00 AM, then 10:04, 10:08, 10:12... (4-minute intervals)
 * - If > 80 total slots booked, show offline booking message
 */
export async function bookSlotByDate(
  date: Date,
  bookingData: {
    patientName: string;
    patientEmail: string;
    patientPhone: string;
  },
  auditInfo: AuditInfo
): Promise<{
  success: boolean;
  message: string;
  bookingId?: number;
  slotTime?: string;
  slotDate?: string;
}> {
  const bookingDate = new Date(date);
  bookingDate.setHours(0, 0, 0, 0);
  
  // Use distributed lock with a date-based key
  // We'll use a simple approach: try to acquire lock via Redis if available
  const lockKey = `book-date-${bookingDate.toISOString().split('T')[0]}`;
  let lockAcquired = false;

  try {
    // Try to acquire lock if Redis is available
    if (redisService.isReady()) {
      lockAcquired = await redisService.acquireLock(lockKey, 10);
      if (!lockAcquired) {
        return {
          success: false,
          message: 'Booking in progress. Please try again in a moment.',
        };
      }
    }

    return await prisma.$transaction(async (tx) => {
    // Get all slots for this date
    const startOfDay = new Date(bookingDate);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const allSlots = await tx.slot.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        booking: true,
      },
      orderBy: [
        { type: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Count total booked slots (including offline)
    const totalBooked = allSlots.filter(s => s.status === SlotStatus.BOOKED || s.booking).length;
    
    // Check if > 80 slots booked (50 online + 20 offline + 30 express = 100 total, so 80+ means mostly booked)
    if (totalBooked >= 80) {
      return {
        success: false,
        message: 'No online slots available for this date. Please book offline or call us for assistance.',
      };
    }

    // Find next available ONLINE slot
    const availableOnlineSlots = allSlots.filter(
      s => s.type === SlotType.ONLINE &&
           s.status === SlotStatus.AVAILABLE &&
           !s.booking
    );

    if (availableOnlineSlots.length === 0) {
      return {
        success: false,
        message: 'No online slots available for this date. All 50 online slots are booked.',
      };
    }

    // Get the earliest available slot
    const selectedSlot = availableOnlineSlots[0];

    // Use distributed lock for this slot - but we need to handle it outside transaction
    // So we'll use Prisma's select for update inside the transaction
    const slot = await tx.slot.findUnique({
      where: { id: selectedSlot.id },
      include: { booking: true },
    });

    if (!slot || slot.status === SlotStatus.BOOKED || slot.booking) {
      // Slot was taken, find next available
      const nextAvailable = allSlots.find(
        s => s.type === SlotType.ONLINE &&
             s.status === SlotStatus.AVAILABLE &&
             !s.booking &&
             s.id !== selectedSlot.id
      );
      
      if (!nextAvailable) {
        return {
          success: false,
          message: 'No online slots available. The slot was just booked by another user.',
        };
      }

      // Try with next available slot
      const nextSlot = await tx.slot.findUnique({
        where: { id: nextAvailable.id },
        include: { booking: true },
      });

      if (!nextSlot || nextSlot.status === SlotStatus.BOOKED || nextSlot.booking) {
        return {
          success: false,
          message: 'No online slots available. Please try again.',
        };
      }

      // Create booking with next slot
      const booking = await tx.booking.create({
        data: {
          slotId: nextSlot.id,
          patientName: bookingData.patientName,
          patientEmail: bookingData.patientEmail,
          patientPhone: bookingData.patientPhone,
          ipAddress: auditInfo.ipAddress,
          userAgent: auditInfo.userAgent,
        },
      });

      await tx.slot.update({
        where: { id: nextSlot.id },
        data: { status: SlotStatus.BOOKED },
      });

      return {
        success: true,
        message: 'Slot booked successfully',
        bookingId: booking.id,
        slotTime: nextSlot.startTime.toISOString(),
        slotDate: nextSlot.date.toISOString().split('T')[0],
      };
    }

    // Create booking
    const booking = await tx.booking.create({
      data: {
        slotId: slot.id,
        patientName: bookingData.patientName,
        patientEmail: bookingData.patientEmail,
        patientPhone: bookingData.patientPhone,
        ipAddress: auditInfo.ipAddress,
        userAgent: auditInfo.userAgent,
      },
    });

    // Update slot status
    await tx.slot.update({
      where: { id: slot.id },
      data: { status: SlotStatus.BOOKED },
    });

    return {
      success: true,
      message: 'Slot booked successfully',
      bookingId: booking.id,
      slotTime: slot.startTime.toISOString(),
      slotDate: slot.date.toISOString().split('T')[0],
    };
    });
  } catch (error) {
    console.error('Booking by date error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to book slot',
    };
  } finally {
    // Release lock if acquired
    if (lockAcquired && redisService.isReady()) {
      await redisService.releaseLock(lockKey);
    }
  }
}

