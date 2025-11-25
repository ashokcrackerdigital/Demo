import { z } from 'zod';
import { SlotStatus } from '@prisma/client';

export const bookingSchema = z.object({
  slotId: z.number().int().positive(),
  patientName: z.string().min(1).max(255),
  patientEmail: z.string().email().max(255),
  patientPhone: z.string().min(10).max(20),
});

export const slotOverrideSchema = z.object({
  slotId: z.number().int().positive(),
  status: z.nativeEnum(SlotStatus),
});

export const dateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type SlotOverrideInput = z.infer<typeof slotOverrideSchema>;
export type DateQueryInput = z.infer<typeof dateQuerySchema>;

