import { Router, Request, Response } from 'express';
import { bookSlot, bookSlotByDate } from '../services/bookingService';
import { bookingSchema, bookByDateSchema } from '../utils/validation';
import { AuditInfo } from '../types';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/book
 * Book a slot
 */
router.post('/', async (req: Request, res: Response, next) => {
  try {
    // Validate request body
    const bookingData = bookingSchema.parse(req.body);

    // Get audit information
    const auditInfo: AuditInfo = {
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    };

    // Attempt to book the slot
    const result = await bookSlot(bookingData, auditInfo);

    if (!result.success) {
      return res.status(400).json({
        error: 'Booking Failed',
        message: result.message,
      });
    }

    res.status(201).json({
      success: true,
      message: result.message,
      bookingId: result.bookingId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/book/by-date
 * Book a slot by date - automatically assigns next available slot
 */
router.post('/by-date', async (req: Request, res: Response, next) => {
  try {
    // Validate request body
    const bookingData = bookByDateSchema.parse(req.body);
    const date = new Date(bookingData.date + 'T00:00:00.000Z');

    // Validate date
    if (isNaN(date.getTime())) {
      throw new AppError('Invalid date format', 400);
    }

    // Get audit information
    const auditInfo: AuditInfo = {
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    };

    // Attempt to book the slot
    const result = await bookSlotByDate(date, {
      patientName: bookingData.patientName,
      patientEmail: bookingData.patientEmail,
      patientPhone: bookingData.patientPhone,
    }, auditInfo);

    if (!result.success) {
      return res.status(400).json({
        error: 'Booking Failed',
        message: result.message,
      });
    }

    res.status(201).json({
      success: true,
      message: result.message,
      bookingId: result.bookingId,
      slotTime: result.slotTime,
      slotDate: result.slotDate,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

