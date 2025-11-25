import { Router, Request, Response } from 'express';
import { getAllSlots, overrideSlotStatus } from '../services/slotService';
import { slotOverrideSchema } from '../utils/validation';
import { AppError } from '../middleware/errorHandler';
import { SlotType, SlotStatus } from '@prisma/client';

const router = Router();

/**
 * GET /api/admin/slots
 * Get all slots with booking information (admin only)
 */
router.get('/slots', async (req: Request, res: Response, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 1000;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const date = req.query.date as string | undefined;
    const type = req.query.type as SlotType | undefined;
    const status = req.query.status as SlotStatus | undefined;

    let slots = await getAllSlots(limit, offset);

    // Filter by date if provided
    if (date) {
      const filterDate = new Date(date + 'T00:00:00.000Z');
      slots = slots.filter(s => {
        const slotDate = new Date(s.date);
        return slotDate.toISOString().split('T')[0] === filterDate.toISOString().split('T')[0];
      });
    }

    // Filter by type if provided
    if (type) {
      slots = slots.filter(s => s.type === type);
    }

    // Filter by status if provided
    if (status) {
      slots = slots.filter(s => s.status === status);
    }

    // Format response
    const response = slots.map(slot => ({
      id: slot.id,
      facilityId: slot.facilityId,
      date: slot.date.toISOString().split('T')[0],
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      type: slot.type,
      status: slot.status,
      booking: slot.booking ? {
        id: slot.booking.id,
        patientName: slot.booking.patientName,
        patientEmail: slot.booking.patientEmail,
        patientPhone: slot.booking.patientPhone,
        createdAt: slot.booking.createdAt.toISOString(),
      } : null,
      createdAt: slot.createdAt.toISOString(),
      updatedAt: slot.updatedAt.toISOString(),
    }));

    res.json({
      slots: response,
      count: response.length,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/slot/override
 * Override slot status (admin only)
 */
router.post('/slot/override', async (req: Request, res: Response, next) => {
  try {
    // Validate request body
    const overrideData = slotOverrideSchema.parse(req.body);

    // Override slot status
    const slot = await overrideSlotStatus(overrideData.slotId, overrideData.status);

    res.json({
      success: true,
      message: 'Slot status updated successfully',
      slot: {
        id: slot.id,
        status: slot.status,
        date: slot.date.toISOString().split('T')[0],
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        type: slot.type,
        booking: slot.booking,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

