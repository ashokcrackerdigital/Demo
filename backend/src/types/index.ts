import { Slot, Booking, SlotType, SlotStatus } from "@prisma/client";

export { SlotType, SlotStatus };

// Booking request from client
export interface BookingRequest {
  slotId: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
}

// Admin override request
export interface SlotOverrideRequest {
  slotId: number;
  status: SlotStatus;
}

// Use Prisma types – they include createdAt, updatedAt automatically
export type SlotWithBooking = Slot & {
  booking: Booking | null;
};

export interface AuditInfo {
  ipAddress?: string;
  userAgent?: string;
}
