import { SlotType, SlotStatus } from '@prisma/client';

export { SlotType, SlotStatus };

export interface BookingRequest {
  slotId: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
}

export interface SlotOverrideRequest {
  slotId: number;
  status: SlotStatus;
}

export interface SlotWithBooking {
  id: number;
  facilityId: number;
  date: Date;
  startTime: Date;
  endTime: Date;
  type: SlotType;
  status: SlotStatus;
  booking: {
    id: number;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    createdAt: Date;
  } | null;
}

export interface AuditInfo {
  ipAddress?: string;
  userAgent?: string;
}

