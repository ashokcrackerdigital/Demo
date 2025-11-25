import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, SlotType, SlotStatus } from '@prisma/client';
import { bookSlot } from '../src/services/bookingService';
import { BookingRequest, AuditInfo } from '../src/types';

const prisma = new PrismaClient();

describe('Concurrency Tests', () => {
  let testSlotId: number;
  let testFacilityId: number;

  beforeAll(async () => {
    // Create a test facility
    const facility = await prisma.facility.upsert({
      where: { id: 998 },
      update: {},
      create: {
        id: 998,
        name: 'Test Facility Concurrency',
        address: 'Test Address',
        startHour: 10,
        endHour: 17,
        slotsPerHour: 10,
      },
    });
    testFacilityId = facility.id;
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

  it('should handle 50 parallel bookings and only allow one to succeed', async () => {
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

    // Create 50 parallel booking attempts
    const promises = Array.from({ length: 50 }, (_, i) => {
      const bookingData: BookingRequest = {
        slotId: testSlotId,
        patientName: `Patient ${i}`,
        patientEmail: `patient${i}@example.com`,
        patientPhone: `+123456789${i}`,
      };

      const auditInfo: AuditInfo = {
        ipAddress: `127.0.0.${i}`,
        userAgent: `test-agent-${i}`,
      };

      return bookSlot(bookingData, auditInfo);
    });

    const results = await Promise.all(promises);

    // Count successful bookings
    const successfulBookings = results.filter((r) => r.success);
    const failedBookings = results.filter((r) => !r.success);

    // Only one booking should succeed
    expect(successfulBookings.length).toBe(1);
    expect(failedBookings.length).toBe(49);

    // Verify only one booking exists in database
    const bookings = await prisma.booking.findMany({
      where: { slotId: testSlotId },
    });

    expect(bookings.length).toBe(1);

    // Clean up
    if (bookings[0]) {
      await prisma.booking.delete({ where: { id: bookings[0].id } });
    }
    await prisma.slot.delete({ where: { id: testSlotId } });
  }, 30000); // 30 second timeout for concurrency test
});

