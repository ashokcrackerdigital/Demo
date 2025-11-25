export enum SlotType {
  ONLINE = 'ONLINE',
  EXPRESS_SAME_DAY = 'EXPRESS_SAME_DAY',
  OFFLINE = 'OFFLINE',
}

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED',
  OVERRIDDEN = 'OVERRIDDEN',
}

export interface Slot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  type: SlotType;
  status: SlotStatus;
  isBooked: boolean;
  message: string;
  booking: {
    patientName: string;
    createdAt: string;
  } | null;
}

export interface SlotSummary {
  date: string;
  total: number;
  online: {
    total: number;
    available: number;
    booked: number;
    allBooked: boolean;
  };
  express: {
    total: number;
    available: number;
    booked: number;
    allBooked: boolean;
  };
  offline: {
    total: number;
    available: number;
  };
}

export interface SlotsResponse {
  slots: Slot[];
  summary: SlotSummary;
}

export interface BookingRequest {
  slotId: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  bookingId?: number;
}

