import { PrismaClient, SlotType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate slots for the next 15 days
 * Business rules:
 * - 50 ONLINE slots per day
 * - 30 EXPRESS_SAME_DAY slots per day
 * - 20 OFFLINE slots per day
 * - Facility hours: 10:00 AM - 5:00 PM
 * - 10 slots per hour
 */
async function main() {
  console.log('🌱 Starting database seed...');

  // Create or get facility
  const facility = await prisma.facility.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Main Healthcare Facility',
      address: '123 Health Street, City, State 12345',
      startHour: 10,
      endHour: 17,
      slotsPerHour: 10,
    },
  });

  console.log(`✅ Facility created/updated: ${facility.name}`);

  // Clear existing slots for the date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 15);

  await prisma.slot.deleteMany({
    where: {
      facilityId: facility.id,
      date: {
        gte: today,
        lte: endDate,
      },
    },
  });

  // Generate slots for next 15 days
  const slots = [];
  const hoursPerDay = 7; // 10 AM to 5 PM (7 hours)
  const slotsPerHour = 10;

  // Distribution per day: Exactly 100 slots
  // 50 ONLINE, 30 EXPRESS_SAME_DAY, 20 OFFLINE
  const onlineCount = 50;
  const expressCount = 30;
  const offlineCount = 20;
  const totalSlotsPerDay = onlineCount + expressCount + offlineCount; // 100 slots

  for (let dayOffset = 0; dayOffset < 15; dayOffset++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + dayOffset);
    currentDate.setHours(0, 0, 0, 0);

    const daySlots: Array<{
      facilityId: number;
      date: Date;
      startTime: Date;
      endTime: Date;
      type: SlotType;
    }> = [];

    // Generate exactly 100 slots per day
    // Distribute them across 7 hours (10 AM - 5 PM)
    // That's approximately 14-15 slots per hour with 6-minute intervals
    const totalMinutes = 7 * 60; // 420 minutes in 7 hours
    const slotInterval = totalMinutes / totalSlotsPerDay; // Approximately 4.2 minutes between slots

    for (let i = 0; i < totalSlotsPerDay; i++) {
      const minutesFromStart = i * slotInterval;
      const hour = 10 + Math.floor(minutesFromStart / 60);
      const minute = Math.floor(minutesFromStart % 60);
      
      // Ensure we stay within facility hours
      if (hour >= 17) break;
      
      const startTime = new Date(currentDate);
      startTime.setHours(hour, minute, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + 6); // 6-minute slots

      daySlots.push({
        facilityId: facility.id,
        date: currentDate,
        startTime,
        endTime,
        type: SlotType.ONLINE, // Will be redistributed
      });
    }

    // Randomly shuffle slots for better distribution
    daySlots.sort(() => Math.random() - 0.5);

    // Assign types: 50 ONLINE, 30 EXPRESS_SAME_DAY, 20 OFFLINE
    daySlots.forEach((slot, index) => {
      if (index < onlineCount) {
        slot.type = SlotType.ONLINE;
      } else if (index < onlineCount + expressCount) {
        slot.type = SlotType.EXPRESS_SAME_DAY;
      } else {
        slot.type = SlotType.OFFLINE;
      }
    });

    slots.push(...daySlots);
  }

  // Insert slots in batches
  console.log(`📅 Generating ${slots.length} slots for next 15 days...`);
  
  const batchSize = 100;
  for (let i = 0; i < slots.length; i += batchSize) {
    const batch = slots.slice(i, i + batchSize);
    await prisma.slot.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`  ✓ Created batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(slots.length / batchSize)}`);
  }

  // Verify slot distribution
  const slotCounts = await prisma.slot.groupBy({
    by: ['type', 'date'],
    where: {
      facilityId: facility.id,
      date: {
        gte: today,
        lte: endDate,
      },
    },
    _count: true,
  });

  console.log('\n📊 Slot distribution summary:');
  const summary: Record<string, Record<string, number>> = {};
  slotCounts.forEach((count) => {
    const dateStr = count.date.toISOString().split('T')[0];
    if (!summary[dateStr]) {
      summary[dateStr] = {};
    }
    summary[dateStr][count.type] = count._count;
  });

  Object.keys(summary).slice(0, 3).forEach((date) => {
    console.log(`  ${date}:`, summary[date]);
  });

  console.log('\n✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

