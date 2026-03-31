import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors/index.js';
import type { CreateDailyBookingInput } from '@homehelp/shared';

export async function createDailyBooking(userId: string, input: CreateDailyBookingInput) {
  const household = await prisma.householdProfile.findUnique({ where: { userId } });
  if (!household) throw new NotFoundError('Household profile not found');

  const helper = await prisma.helperProfile.findUnique({
    where: { id: input.helperId },
    include: { cookPricingProfile: true },
  });
  if (!helper) throw new NotFoundError('Helper not found');
  if (!helper.availableForDaily) throw new BadRequestError('Helper is not available for daily bookings');

  const perVisitRate = helper.cookPricingProfile?.perVisitRate;
  if (!perVisitRate) throw new BadRequestError('Helper has no per-visit rate configured');

  const totalVisits = input.visits.length;
  const totalAmount = perVisitRate * totalVisits;
  const commissionPct = 15;
  const platformCommissionAmt = Math.round(totalAmount * commissionPct / 100);
  const helperPayout = totalAmount - platformCommissionAmt;

  return prisma.dailyBooking.create({
    data: {
      householdId: household.id,
      helperId: helper.id,
      bookingDate: new Date(input.bookingDate),
      visits: input.visits,
      perVisitRate,
      totalVisits,
      totalAmount,
      platformCommissionPct: commissionPct,
      platformCommissionAmt,
      helperPayout,
      status: 'pending',
    },
    include: {
      household: { include: { user: { select: { fullName: true } } } },
      helper: { include: { user: { select: { fullName: true } } } },
    },
  });
}

export async function getDailyBooking(bookingId: string, userId: string) {
  const booking = await prisma.dailyBooking.findUnique({
    where: { id: bookingId },
    include: {
      household: { include: { user: { select: { fullName: true, phone: true } } } },
      helper: { include: { user: { select: { fullName: true, phone: true } } } },
    },
  });

  if (!booking) throw new NotFoundError('Booking not found');

  const household = await prisma.householdProfile.findUnique({ where: { userId } });
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });

  if (household?.id !== booking.householdId && helper?.id !== booking.helperId) {
    throw new ForbiddenError('You do not have access to this booking');
  }

  return booking;
}

export async function acceptDailyBooking(bookingId: string, userId: string) {
  const booking = await prisma.dailyBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking not found');
  if (booking.status !== 'pending') throw new BadRequestError('Booking is not pending');

  const helper = await prisma.helperProfile.findUnique({ where: { userId } });
  if (!helper || helper.id !== booking.helperId) {
    throw new ForbiddenError('Only the assigned helper can accept');
  }

  return prisma.dailyBooking.update({
    where: { id: bookingId },
    data: { status: 'confirmed' },
  });
}

export async function cancelDailyBooking(bookingId: string, userId: string, reason?: string) {
  const booking = await prisma.dailyBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking not found');

  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new BadRequestError('Cannot cancel a booking that is in progress or completed');
  }

  const household = await prisma.householdProfile.findUnique({ where: { userId } });
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });

  let cancelledBy: string;
  if (household?.id === booking.householdId) cancelledBy = 'household';
  else if (helper?.id === booking.helperId) cancelledBy = 'helper';
  else throw new ForbiddenError('You do not have access to this booking');

  // Cancellation fee: 50% if household cancels < 2hr before and status is confirmed
  let cancellationFee = 0;
  if (cancelledBy === 'household' && booking.status === 'confirmed') {
    const bookingDateTime = new Date(booking.bookingDate);
    const hoursUntil = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 2) {
      cancellationFee = Math.round(booking.totalAmount * 0.5);
    }
  }

  return prisma.dailyBooking.update({
    where: { id: bookingId },
    data: {
      status: 'cancelled',
      cancellationBy: cancelledBy,
      cancellationReason: reason,
      cancellationFee,
    },
  });
}

export async function getUpcomingDailyBookings(userId: string) {
  const household = await prisma.householdProfile.findUnique({ where: { userId } });
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });

  const where: any = {
    bookingDate: { gte: new Date() },
    status: { in: ['pending', 'confirmed'] },
  };
  if (household) where.householdId = household.id;
  else if (helper) where.helperId = helper.id;
  else throw new NotFoundError('Profile not found');

  return prisma.dailyBooking.findMany({
    where,
    include: {
      household: { include: { user: { select: { fullName: true } } } },
      helper: { include: { user: { select: { fullName: true } } } },
    },
    orderBy: { bookingDate: 'asc' },
  });
}
