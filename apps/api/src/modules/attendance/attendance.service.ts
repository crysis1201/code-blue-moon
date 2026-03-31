import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors/index.js';
import { haversineDistanceM, GEO_FENCE_RADIUS_M, GRACE_PERIOD_MIN } from './geo.utils.js';
import type { CheckInInput, CheckOutInput, OverrideAttendanceInput } from '@homehelp/shared';

function getBookingFk(bookingId: string, bookingType: string) {
  return bookingType === 'monthly'
    ? { monthlyBookingId: bookingId }
    : { dailyBookingId: bookingId };
}

export async function checkIn(userId: string, input: CheckInInput) {
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });
  if (!helper) throw new NotFoundError('Helper profile not found');

  // Load booking
  const booking = input.bookingType === 'monthly'
    ? await prisma.monthlyBooking.findUnique({ where: { id: input.bookingId }, include: { household: true } })
    : await prisma.dailyBooking.findUnique({ where: { id: input.bookingId }, include: { household: true } });

  if (!booking) throw new NotFoundError('Booking not found');
  if (booking.helperId !== helper.id) throw new ForbiddenError('This booking is not assigned to you');

  const household = booking.household;

  // Calculate distance from household
  const distance = haversineDistanceM(
    input.latitude, input.longitude,
    Number(household.latitude), Number(household.longitude),
  );

  const isWithinFence = distance <= GEO_FENCE_RADIUS_M;
  const checkInMethod = isWithinFence ? 'geo_fence' : 'household_confirm';

  // Determine if late
  const now = new Date();
  const visits = booking.visits as Array<{ visit_num: number; start: string; end: string }>;
  const visit = visits.find((v) => v.visit_num === input.visitNumber);
  let lateByMinutes = 0;

  if (visit) {
    const [h, m] = visit.start.split(':').map(Number);
    const scheduledTime = new Date(now);
    scheduledTime.setHours(h, m, 0, 0);
    const diffMin = (now.getTime() - scheduledTime.getTime()) / 60000;
    if (diffMin > GRACE_PERIOD_MIN) {
      lateByMinutes = Math.round(diffMin);
    }
  }

  const status = lateByMinutes > 0 ? 'late' : 'checked_in';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.attendanceLog.create({
    data: {
      ...getBookingFk(input.bookingId, input.bookingType),
      bookingType: input.bookingType,
      helperId: helper.id,
      householdId: household.id,
      attendanceDate: today,
      visitNumber: input.visitNumber,
      checkInTime: now,
      checkInLat: input.latitude,
      checkInLng: input.longitude,
      checkInDistanceM: Math.round(distance),
      checkInMethod,
      status,
      lateByMinutes,
      markedBy: 'system',
    },
  });

  return {
    ...log,
    isWithinFence,
    needsHouseholdConfirmation: !isWithinFence,
  };
}

export async function checkOut(userId: string, input: CheckOutInput) {
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });
  if (!helper) throw new NotFoundError('Helper profile not found');

  const log = await prisma.attendanceLog.findUnique({ where: { id: input.attendanceId } });
  if (!log) throw new NotFoundError('Attendance log not found');
  if (log.helperId !== helper.id) throw new ForbiddenError('This attendance record is not yours');

  if (!['checked_in', 'late'].includes(log.status)) {
    throw new BadRequestError('Can only check out from checked_in or late status');
  }

  return prisma.attendanceLog.update({
    where: { id: input.attendanceId },
    data: {
      checkOutTime: new Date(),
      checkOutLat: input.latitude,
      checkOutLng: input.longitude,
      checkOutMethod: 'geo_fence',
      status: 'completed',
    },
  });
}

export async function confirmAttendance(userId: string, attendanceId: string, confirmed: boolean) {
  const household = await prisma.householdProfile.findUnique({ where: { userId } });
  if (!household) throw new NotFoundError('Household profile not found');

  const log = await prisma.attendanceLog.findUnique({ where: { id: attendanceId } });
  if (!log) throw new NotFoundError('Attendance log not found');
  if (log.householdId !== household.id) throw new ForbiddenError('This attendance is not for your household');

  if (confirmed) {
    return prisma.attendanceLog.update({
      where: { id: attendanceId },
      data: { checkInMethod: 'household_confirm', markedBy: 'household' },
    });
  } else {
    // Household rejected — revert to absent
    return prisma.attendanceLog.update({
      where: { id: attendanceId },
      data: { status: 'absent', markedBy: 'household', overrideReason: 'Household rejected check-in' },
    });
  }
}

export async function getCalendar(bookingId: string, bookingType: string, userId: string, month?: string) {
  // Parse month or default to current month
  const now = new Date();
  let year = now.getFullYear();
  let monthNum = now.getMonth(); // 0-indexed

  if (month) {
    const [y, m] = month.split('-').map(Number);
    year = y;
    monthNum = m - 1;
  }

  const startDate = new Date(year, monthNum, 1);
  const endDate = new Date(year, monthNum + 1, 0); // last day of month

  const fk = bookingType === 'monthly'
    ? { monthlyBookingId: bookingId }
    : { dailyBookingId: bookingId };

  const logs = await prisma.attendanceLog.findMany({
    where: {
      ...fk,
      attendanceDate: { gte: startDate, lte: endDate },
    },
    orderBy: [{ attendanceDate: 'asc' }, { visitNumber: 'asc' }],
  });

  // Summary
  const summary = {
    totalDays: logs.length,
    present: logs.filter((l) => ['checked_in', 'completed', 'late'].includes(l.status)).length,
    absent: logs.filter((l) => l.status === 'absent').length,
    late: logs.filter((l) => l.status === 'late').length,
    leave: logs.filter((l) => l.status === 'leave').length,
    scheduled: logs.filter((l) => l.status === 'scheduled').length,
  };

  return { month: `${year}-${String(monthNum + 1).padStart(2, '0')}`, logs, summary };
}

export async function overrideAttendance(attendanceId: string, input: OverrideAttendanceInput) {
  const log = await prisma.attendanceLog.findUnique({ where: { id: attendanceId } });
  if (!log) throw new NotFoundError('Attendance log not found');

  return prisma.attendanceLog.update({
    where: { id: attendanceId },
    data: {
      status: input.status,
      markedBy: 'admin',
      overrideReason: input.reason,
    },
  });
}

// Auto-absence detection — called by BullMQ cron job
export async function detectNoShows() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = (today.getDay() + 6) % 7; // Convert Sun=0 to Mon=0

  // Find active monthly bookings scheduled for today that have no check-in
  const overdueBookings = await prisma.monthlyBooking.findMany({
    where: {
      status: 'active',
      selectedDays: { has: dayOfWeek },
    },
    include: { household: true },
  });

  const results = [];

  for (const booking of overdueBookings) {
    // Check if attendance already logged
    const existing = await prisma.attendanceLog.findFirst({
      where: {
        monthlyBookingId: booking.id,
        attendanceDate: today,
        visitNumber: 1,
        status: { in: ['checked_in', 'completed', 'late'] },
      },
    });

    if (!existing) {
      const log = await prisma.attendanceLog.create({
        data: {
          monthlyBookingId: booking.id,
          bookingType: 'monthly',
          helperId: booking.helperId,
          householdId: booking.householdId,
          attendanceDate: today,
          visitNumber: 1,
          status: 'absent',
          markedBy: 'system',
        },
      });
      results.push(log);
    }
  }

  return results;
}
