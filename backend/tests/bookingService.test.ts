import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, SlotType, SlotStatus } from '@prisma/client';
import { bookSlot } from '../src/services/bookingService';
import { BookingRequest, AuditInfo } from '../src/types';

const prisma = new PrismaClient();

describe('Booking Service', () => {
  let testSlotId: number;
  let testFacilityId: number;

  beforeAll(async () => {
    // Create a test facility
    const facility = await prisma.facility.upsert({
      where: { id: 999 },
      update: {},
      create: {
        id: 999,
        name: 'Test Facility',
        address: 'Test Address',
        startHour: 10,
        endHour: 17,
        slotsPerHour: 10,
      },
    });
    testFacilityId = facility.id;

    // Create a test slot
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startTime = new Date(today);
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(6);

    const slot = await prisma.slot.create({
      data: {
        facilityId: testFacilityId,
        date: today,
        startTime,
        endTime,
        type: SlotType.ONLINE,
        status: SlotStatus.AVAILABLE,
      },
    });
    testSlotId = slot.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.slot.deleteMany({
      where: { facilityId: testFacilityId },
    });
    await prisma.facility.delete({
      where: { id: testFacilityId },
    });
    await prisma.$disconnect();
  });

  describe('bookSlot', () => {
    it('should fail to book offline slot', async () => {
      // Create an offline slot
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startTime = new Date(today);
      startTime.setHours(10, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(6);

      const offlineSlot = await prisma.slot.create({
        data: {
          facilityId: testFacilityId,
          date: today,
          startTime,
          endTime,
          type: SlotType.OFFLINE,
          status: SlotStatus.AVAILABLE,
        },
      });

      const bookingData: BookingRequest = {
        slotId: offlineSlot.id,
        patientName: 'Test Patient',
        patientEmail: 'test@example.com',
        patientPhone: '+1234567890',
      };

      const auditInfo: AuditInfo = {
        ipAddress: '127.0.0.1',
        userAgent: 'test',
      };

      const result = await bookSlot(bookingData, auditInfo);

      expect(result.success).toBe(false);
      expect(result.message).toContain('cannot be booked online');

      // Clean up
      await prisma.slot.delete({ where: { id: offlineSlot.id } });
    });

    it('should successfully book an available online slot', async () => {
      const bookingData: BookingRequest = {
        slotId: testSlotId,
        patientName: 'Test Patient',
        patientEmail: 'test@example.com',
        patientPhone: '+1234567890',
      };

      const auditInfo: AuditInfo = {
        ipAddress: '127.0.0.1',
        userAgent: 'test',
      };

      const result = await bookSlot(bookingData, auditInfo);

      expect(result.success).toBe(true);
      expect(result.bookingId).toBeDefined();

      // Clean up booking
      if (result.bookingId) {
        await prisma.booking.delete({ where: { id: result.bookingId } });
        await prisma.slot.update({
          where: { id: testSlotId },
          data: { status: SlotStatus.AVAILABLE },
        });
      }
    });

    it('should fail to book already booked slot', async () => {
      // Book the slot first
      const bookingData1: BookingRequest = {
        slotId: testSlotId,
        patientName: 'Test Patient 1',
        patientEmail: 'test1@example.com',
        patientPhone: '+1234567890',
      };

      const auditInfo: AuditInfo = {
        ipAddress: '127.0.0.1',
        userAgent: 'test',
      };

      const result1 = await bookSlot(bookingData1, auditInfo);
      expect(result1.success).toBe(true);

      // Try to book again
      const bookingData2: BookingRequest = {
        slotId: testSlotId,
        patientName: 'Test Patient 2',
        patientEmail: 'test2@example.com',
        patientPhone: '+1234567891',
      };

      const result2 = await bookSlot(bookingData2, auditInfo);
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('already booked');

      // Clean up
      if (result1.bookingId) {
        await prisma.booking.delete({ where: { id: result1.bookingId } });
        await prisma.slot.update({
          where: { id: testSlotId },
          data: { status: SlotStatus.AVAILABLE },
        });
      }
    });
  });
});

