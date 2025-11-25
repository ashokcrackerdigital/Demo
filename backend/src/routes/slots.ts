import { Router, Request, Response } from 'express';
import { getSlotsForDate, getSlotTypeMessage } from '../services/slotService';
import { dateQuerySchema } from '../utils/validation';
import { AppError } from '../middleware/errorHandler';
import { SlotType, SlotStatus } from '@prisma/client';

const router = Router();

/**
 * GET /api/slots?date=YYYY-MM-DD
 * Get available slots for a specific date
 */
router.get('/', async (req: Request, res: Response, next) => {
  try {
    // Validate query parameters
    const query = dateQuerySchema.parse(req.query);
    const date = new Date(query.date + 'T00:00:00.000Z');

    // Validate date
    if (isNaN(date.getTime())) {
      throw new AppError('Invalid date format', 400);
    }

    // Get slots for the date
    const slots = await getSlotsForDate(date);

    // Group slots by type and check availability
    const onlineSlots = slots.filter(s => s.type === SlotType.ONLINE);
    const expressSlots = slots.filter(s => s.type === SlotType.EXPRESS_SAME_DAY);
    const offlineSlots = slots.filter(s => s.type === SlotType.OFFLINE);

    const onlineAvailable = onlineSlots.filter(s => s.status === SlotStatus.AVAILABLE && !s.booking);
    const expressAvailable = expressSlots.filter(s => s.status === SlotStatus.AVAILABLE && !s.booking);
    const offlineAvailable = offlineSlots.filter(s => s.status === SlotStatus.AVAILABLE && !s.booking);

    // Format response
    const response = slots.map(slot => ({
      id: slot.id,
      date: slot.date.toISOString().split('T')[0],
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      type: slot.type,
      status: slot.status,
      isBooked: !!slot.booking,
      message: getSlotTypeMessage(slot.type, slot.date, slot.status),
      booking: slot.booking ? {
        patientName: slot.booking.patientName,
        createdAt: slot.booking.createdAt.toISOString(),
      } : null,
    }));

    // Add availability summary
    const summary = {
      date: query.date,
      total: slots.length,
      online: {
        total: onlineSlots.length,
        available: onlineAvailable.length,
        booked: onlineSlots.length - onlineAvailable.length,
        allBooked: onlineAvailable.length === 0 && onlineSlots.length > 0,
      },
      express: {
        total: expressSlots.length,
        available: expressAvailable.length,
        booked: expressSlots.length - expressAvailable.length,
        allBooked: expressAvailable.length === 0 && expressSlots.length > 0,
      },
      offline: {
        total: offlineSlots.length,
        available: offlineAvailable.length,
      },
    };

    res.json({
      slots: response,
      summary,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

