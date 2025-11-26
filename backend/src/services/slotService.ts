import { PrismaClient, SlotType, SlotStatus } from '@prisma/client';
import { SlotWithBooking } from '../types';

const prisma = new PrismaClient();

/**
 * Get available slots for a specific date
 */
export async function getSlotsForDate(date: Date): Promise<SlotWithBooking[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const slots = await prisma.slot.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      booking: true, // ← FIXED
    },
    orderBy: [
      { startTime: 'asc' },
      { type: 'asc' },
    ],
  });

  return slots;
}

/**
 * Get a slot by ID with booking info
 */
export async function getSlotById(slotId: number): Promise<SlotWithBooking | null> {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: {
      booking: true, // ← FIXED
    },
  });

  return slot;
}

/**
 * Check if express slot can be booked
 */
export function canBookExpressSlot(slotDate: Date): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const slotDay = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());

  if (slotDay.getTime() !== today.getTime()) return false;

  const sixAM = new Date(today);
  sixAM.setHours(6, 0, 0, 0);

  return now >= sixAM;
}

/**
 * Slot type message for UI
 */
export function getSlotTypeMessage(type: SlotType, date: Date, status: SlotStatus): string {
  if (status === SlotStatus.BOOKED) return 'Booked';
  if (status === SlotStatus.CANCELLED) return 'Cancelled';

  switch (type) {
    case SlotType.ONLINE:
      return 'Available';
    case SlotType.EXPRESS_SAME_DAY:
      return canBookExpressSlot(date)
        ? 'Express (Available)'
        : 'Express (Not yet available)';
    case SlotType.OFFLINE:
      return 'Offline (Not bookable online)';
    default:
      return 'Unknown';
  }
}

/**
 * Admin: Get all slots
 */
export async function getAllSlots(limit: number = 1000, offset: number = 0): Promise<SlotWithBooking[]> {
  const slots = await prisma.slot.findMany({
    take: limit,
    skip: offset,
    include: {
      booking: true, // ← FIXED
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' },
    ],
  });

  return slots;
}

/**
 * Admin: Override slot status
 */
export async function overrideSlotStatus(slotId: number, status: SlotStatus): Promise<SlotWithBooking> {
  const slot = await prisma.slot.update({
    where: { id: slotId },
    data: { status },
    include: {
      booking: true, // ← FIXED
    },
  });

  return slot;
}
