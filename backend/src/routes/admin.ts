// import { Router, Request, Response } from 'express';
// import { getAllSlots, overrideSlotStatus } from '../services/slotService';
// import { slotOverrideSchema } from '../utils/validation';
// import { AppError } from '../middleware/errorHandler';
// import { SlotType, SlotStatus } from '@prisma/client';

// const router = Router();

// /**
//  * GET /api/admin/slots
//  * Get all slots with booking information (admin only)
//  */
// router.get('/slots', async (req: Request, res: Response, next) => {
//   try {
//     const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 1000;
//     const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
//     const date = req.query.date as string | undefined;
//     const type = req.query.type as SlotType | undefined;
//     const status = req.query.status as SlotStatus | undefined;

//     let slots = await getAllSlots(limit, offset);

//     // First, filter to show only booked slots (slots with bookings)
//     slots = slots.filter(s => s.booking !== null);

//     // Filter by date if provided
//     if (typeof date === "string" && date.length > 0) {
//       const filterDateStr = String(date).split("T")[0];
    
//       slots = slots.filter((s) => {
//         // date field safe conversion
//         const slotDate = s.date instanceof Date ? s.date : new Date(s.date);
//         const slotDateStr = slotDate.toISOString().split("T")[0];
    
//         // startTime safe conversion
//         const startTime = s.startTime instanceof Date ? s.startTime : new Date(s.startTime);
//         const startTimeDateStr = startTime.toISOString().split("T")[0];
    
//         return slotDateStr === filterDateStr || startTimeDateStr === filterDateStr;
//       });
//     }
    

//     // Filter by type if provided
//     if (type) {
//       slots = slots.filter(s => s.type === type);
//     }

//     // Filter by status if provided
//     if (status) {
//       slots = slots.filter(s => s.status === status);
//     }

//     // Format response
//     const response = slots.map(slot => ({
//       id: slot.id,
//       facilityId: slot.facilityId,
//       date: slot.date.toISOString().split('T')[0],
//       startTime: slot.startTime.toISOString(),
//       endTime: slot.endTime.toISOString(),
//       type: slot.type,
//       status: slot.status,
//       booking: slot.booking ? {
//         id: slot.booking.id,
//         patientName: slot.booking.patientName,
//         patientEmail: slot.booking.patientEmail,
//         patientPhone: slot.booking.patientPhone,
//         createdAt: slot.booking.createdAt.toISOString(),
//       } : null,
//       createdAt: slot.createdAt.toISOString(),
//       updatedAt: slot.updatedAt.toISOString(),
//     }));

//     res.json({
//       slots: response,
//       count: response.length,
//       limit,
//       offset,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// /**
//  * POST /api/admin/slot/override
//  * Override slot status (admin only)
//  */
// router.post('/slot/override', async (req: Request, res: Response, next) => {
//   try {
//     // Validate request body
//     const overrideData = slotOverrideSchema.parse(req.body);

//     // Override slot status
//     const slot = await overrideSlotStatus(overrideData.slotId, overrideData.status);

//     res.json({
//       success: true,
//       message: 'Slot status updated successfully',
//       slot: {
//         id: slot.id,
//         status: slot.status,
//         date: slot.date.toISOString().split('T')[0],
//         startTime: slot.startTime.toISOString(),
//         endTime: slot.endTime.toISOString(),
//         type: slot.type,
//         booking: slot.booking,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// export default router;




import { Router, Request, Response } from 'express';
import { getAllSlots, overrideSlotStatus } from '../services/slotService';
import { slotOverrideSchema } from '../utils/validation';
import { SlotType, SlotStatus } from '@prisma/client';

const router = Router();

/**
 * GET /api/admin/slots
 */
router.get('/slots', async (req: Request, res: Response, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 1000;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const rawDate = req.query.date;
    const date =
      typeof rawDate === "string" && rawDate.includes("T")
        ? rawDate.split("T")[0]
        : typeof rawDate === "string"
        ? rawDate
        : undefined;

    const type = req.query.type as SlotType | undefined;
    const status = req.query.status as SlotStatus | undefined;

    // Always typed slot list
    let slots = await getAllSlots(limit, offset);

    // Filter to booked slots only
    slots = slots.filter(s => s.booking !== null);

    // Filter by date safely
    if (date) {
      slots = slots.filter(s => {
        const slotDateStr = s.date.toISOString().split("T")[0];
        const startTimeStr = s.startTime.toISOString().split("T")[0];
        return slotDateStr === date || startTimeStr === date;
      });
    }

    if (type) slots = slots.filter(s => s.type === type);
    if (status) slots = slots.filter(s => s.status === status);

    const response = slots.map(slot => ({
      id: slot.id,
      facilityId: slot.facilityId,
      date: slot.date.toISOString().split("T")[0],
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      type: slot.type,
      status: slot.status,
      booking: slot.booking
        ? {
            id: slot.booking.id,
            patientName: slot.booking.patientName,
            patientEmail: slot.booking.patientEmail,
            patientPhone: slot.booking.patientPhone,
            createdAt: slot.booking.createdAt.toISOString(),
          }
        : null,
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
 */
router.post('/slot/override', async (req: Request, res: Response, next) => {
  try {
    const overrideData = slotOverrideSchema.parse(req.body);

    const slot = await overrideSlotStatus(overrideData.slotId, overrideData.status);

    res.json({
      success: true,
      message: 'Slot status updated successfully',
      slot: {
        id: slot.id,
        status: slot.status,
        date: slot.date.toISOString().split("T")[0],
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
