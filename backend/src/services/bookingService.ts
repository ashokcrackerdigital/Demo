import { PrismaClient, SlotType, SlotStatus } from '@prisma/client';
import { BookingRequest, AuditInfo } from '../types';
import { withSlotLock } from '../utils/lock';
import { canBookExpressSlot, getSlotById } from './slotService';

const prisma = new PrismaClient();

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

