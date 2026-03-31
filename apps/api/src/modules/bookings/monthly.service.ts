import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors/index.js';
import { calculateCookPrice } from '../search/price.utils.js';
import type { CreateMonthlyBookingInput, NegotiateInput, RespondNegotiationInput } from '@homehelp/shared';

// Valid state transitions
const STATE_TRANSITIONS: Record<string, string[]> = {
  pending: ['trial', 'cancelled'],
  trial: ['active', 'cancelled'],
  active: ['paused', 'ended'],
  paused: ['active', 'ended'],
};

function assertTransition(current: string, next: string) {
  if (!STATE_TRANSITIONS[current]?.includes(next)) {
    throw new BadRequestError(`Cannot transition from "${current}" to "${next}"`);
  }
}

function getSelectedDays(scheduleType: string, selectedDays?: number[]): number[] {
  if (scheduleType === 'everyday') return [0, 1, 2, 3, 4, 5, 6];
  if (scheduleType === 'weekdays') return [0, 1, 2, 3, 4];
  return selectedDays ?? [];
}

export async function createMonthlyBooking(userId: string, input: CreateMonthlyBookingInput) {
  const household = await prisma.householdProfile.findUnique({ where: { userId } });
  if (!household) throw new NotFoundError('Household profile not found');

  const helper = await prisma.helperProfile.findUnique({
    where: { id: input.helperId },
    include: { cookPricingProfile: true },
  });
  if (!helper) throw new NotFoundError('Helper not found');
  if (!helper.availableForMonthly) throw new BadRequestError('Helper is not available for monthly bookings');

  const selectedDays = getSelectedDays(input.scheduleType, input.selectedDays);
  if (selectedDays.length === 0) throw new BadRequestError('No days selected');

  // Calculate listed price
  let cookListedPrice = 0;
  if (helper.cookPricingProfile) {
    cookListedPrice = calculateCookPrice(
      {
        meals: input.mealsPerDay,
        visitsPerDay: input.visitsPerDay,
        familySize: input.familySize,
        includeWeekends: selectedDays.includes(5) || selectedDays.includes(6),
        nonVeg: input.extras?.includes('non_veg') ?? false,
        groceryShopping: input.extras?.includes('grocery_shopping') ?? false,
        days: input.scheduleType === 'custom' ? selectedDays.join(',') : input.scheduleType,
      },
      helper.cookPricingProfile,
    );
  }

  const agreedRate = input.proposedRate ?? cookListedPrice;

  const booking = await prisma.monthlyBooking.create({
    data: {
      householdId: household.id,
      helperId: helper.id,
      scheduleType: input.scheduleType,
      selectedDays,
      visits: input.visits,
      mealsPerDay: input.mealsPerDay,
      visitsPerDay: input.visitsPerDay,
      familySize: input.familySize,
      cuisineTags: input.cuisineTags ?? [],
      extras: input.extras ?? [],
      specialInstructions: input.specialInstructions,
      cookListedPrice,
      agreedMonthlyRate: agreedRate,
      status: 'pending',
    },
    include: { household: true, helper: true },
  });

  // If household proposed a different rate, create initial negotiation round
  if (input.proposedRate && input.proposedRate !== cookListedPrice) {
    await prisma.negotiation.create({
      data: {
        monthlyBookingId: booking.id,
        round: 1,
        initiatedBy: 'household',
        proposedRate: input.proposedRate,
        platformSuggested: { listed: cookListedPrice },
        withinRange: helper.cookPricingProfile?.minAcceptableRate
          ? input.proposedRate >= helper.cookPricingProfile.minAcceptableRate
          : null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hrs
      },
    });
  }

  return booking;
}

export async function getMonthlyBooking(bookingId: string, userId: string) {
  const booking = await prisma.monthlyBooking.findUnique({
    where: { id: bookingId },
    include: {
      household: { include: { user: { select: { fullName: true, phone: true } } } },
      helper: { include: { user: { select: { fullName: true, phone: true } } } },
      negotiations: { orderBy: { round: 'desc' } },
    },
  });

  if (!booking) throw new NotFoundError('Booking not found');

  // Check ownership
  const household = await prisma.householdProfile.findUnique({ where: { userId } });
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });

  if (household?.id !== booking.householdId && helper?.id !== booking.helperId) {
    throw new ForbiddenError('You do not have access to this booking');
  }

  return booking;
}

export async function negotiate(bookingId: string, userId: string, input: NegotiateInput) {
  const booking = await prisma.monthlyBooking.findUnique({
    where: { id: bookingId },
    include: { negotiations: { orderBy: { round: 'desc' }, take: 1 } },
  });
  if (!booking) throw new NotFoundError('Booking not found');
  if (booking.status !== 'pending') throw new BadRequestError('Booking is not in pending state');

  // Determine who is negotiating
  const household = await prisma.householdProfile.findUnique({ where: { userId } });
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });

  let initiatedBy: string;
  if (household?.id === booking.householdId) initiatedBy = 'household';
  else if (helper?.id === booking.helperId) initiatedBy = 'helper';
  else throw new ForbiddenError('You do not have access to this booking');

  const lastRound = booking.negotiations[0]?.round ?? 0;

  const negotiation = await prisma.negotiation.create({
    data: {
      monthlyBookingId: bookingId,
      round: lastRound + 1,
      initiatedBy,
      proposedRate: input.proposedRate,
      message: input.message,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  // Update booking with latest proposed rate
  await prisma.monthlyBooking.update({
    where: { id: bookingId },
    data: { agreedMonthlyRate: input.proposedRate },
  });

  return negotiation;
}

export async function acceptBooking(bookingId: string, userId: string) {
  const booking = await prisma.monthlyBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking not found');
  if (booking.status !== 'pending') throw new BadRequestError('Booking is not in pending state');

  // Only helper can accept
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });
  if (!helper || helper.id !== booking.helperId) {
    throw new ForbiddenError('Only the assigned helper can accept');
  }

  // Mark latest negotiation as accepted
  const latestNeg = await prisma.negotiation.findFirst({
    where: { monthlyBookingId: bookingId },
    orderBy: { round: 'desc' },
  });
  if (latestNeg && !latestNeg.response) {
    await prisma.negotiation.update({
      where: { id: latestNeg.id },
      data: { response: 'accepted', respondedAt: new Date() },
    });
  }

  return prisma.monthlyBooking.update({
    where: { id: bookingId },
    data: { status: 'pending' }, // stays pending until trial starts
  });
}

export async function startTrial(bookingId: string, userId: string) {
  const booking = await prisma.monthlyBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking not found');

  assertTransition(booking.status, 'trial');

  const trialStart = new Date();
  const trialEnd = new Date(trialStart.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

  return prisma.monthlyBooking.update({
    where: { id: bookingId },
    data: {
      status: 'trial',
      trialStartDate: trialStart,
      trialEndDate: trialEnd,
    },
  });
}

export async function confirmBooking(bookingId: string, userId: string) {
  const booking = await prisma.monthlyBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking not found');

  // Only household can confirm after trial
  const household = await prisma.householdProfile.findUnique({ where: { userId } });
  if (!household || household.id !== booking.householdId) {
    throw new ForbiddenError('Only the household can confirm after trial');
  }

  assertTransition(booking.status, 'active');

  const startDate = new Date();
  const nextReview = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 3 months

  return prisma.monthlyBooking.update({
    where: { id: bookingId },
    data: {
      status: 'active',
      startDate,
      nextReviewDate: nextReview,
    },
  });
}

export async function pauseBooking(bookingId: string, userId: string, reason?: string) {
  const booking = await prisma.monthlyBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking not found');

  assertTransition(booking.status, 'paused');

  return prisma.monthlyBooking.update({
    where: { id: bookingId },
    data: { status: 'paused', pauseReason: reason },
  });
}

export async function resumeBooking(bookingId: string, userId: string) {
  const booking = await prisma.monthlyBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking not found');

  assertTransition(booking.status, 'active');

  return prisma.monthlyBooking.update({
    where: { id: bookingId },
    data: { status: 'active', pauseReason: null },
  });
}

export async function endBooking(bookingId: string, userId: string, reason?: string) {
  const booking = await prisma.monthlyBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking not found');

  assertTransition(booking.status, 'ended');

  // Determine who ended
  const household = await prisma.householdProfile.findUnique({ where: { userId } });
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });

  let endedBy: string;
  if (household?.id === booking.householdId) endedBy = 'household_ended';
  else if (helper?.id === booking.helperId) endedBy = 'helper_ended';
  else throw new ForbiddenError('You do not have access to this booking');

  return prisma.monthlyBooking.update({
    where: { id: bookingId },
    data: {
      status: 'ended',
      endDate: new Date(),
      endReason: endedBy + (reason ? `: ${reason}` : ''),
    },
  });
}

export async function cancelBooking(bookingId: string, userId: string, reason?: string) {
  const booking = await prisma.monthlyBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking not found');

  if (!['pending', 'trial'].includes(booking.status)) {
    throw new BadRequestError('Can only cancel pending or trial bookings. Use "end" for active bookings.');
  }

  return prisma.monthlyBooking.update({
    where: { id: bookingId },
    data: {
      status: 'cancelled',
      endDate: new Date(),
      endReason: reason,
    },
  });
}

export async function getActiveBookings(userId: string) {
  const household = await prisma.householdProfile.findUnique({ where: { userId } });
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });

  const where: any = { status: { in: ['pending', 'trial', 'active', 'paused'] } };
  if (household) where.householdId = household.id;
  else if (helper) where.helperId = helper.id;
  else throw new NotFoundError('Profile not found');

  return prisma.monthlyBooking.findMany({
    where,
    include: {
      household: { include: { user: { select: { fullName: true } } } },
      helper: { include: { user: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
