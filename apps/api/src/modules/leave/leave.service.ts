import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../common/errors/index.js';
import type { CreateLeaveInput, ApproveLeaveInput, CreateReplacementInput } from '@homehelp/shared';

// ─── Leave ───────────────────────────────────────────────────────────────────

export async function requestLeave(userId: string, input: CreateLeaveInput) {
  const helperProfile = await prisma.helperProfile.findUnique({
    where: { userId },
  });
  if (!helperProfile) throw new NotFoundError('Helper profile not found');

  const booking = await prisma.monthlyBooking.findUnique({
    where: { id: input.bookingId },
  });
  if (!booking) throw new NotFoundError('Booking not found');
  if (booking.helperId !== helperProfile.id) throw new BadRequestError('You are not the helper for this booking');

  const leaveDates = input.leaveDates.map((d) => new Date(d));

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      helperId: helperProfile.id,
      bookingId: input.bookingId,
      leaveDates,
      reason: input.reason,
      message: input.message,
      replacementNeeded: input.replacementNeeded ?? false,
    },
  });

  return leaveRequest;
}

export async function approveLeave(leaveId: string, userId: string, input: ApproveLeaveInput) {
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { booking: { include: { household: true } } },
  });
  if (!leaveRequest) throw new NotFoundError('Leave request not found');
  if (leaveRequest.booking.household.userId !== userId) {
    throw new BadRequestError('Only the household can approve/decline leave');
  }
  if (leaveRequest.status !== 'pending') {
    throw new BadRequestError('Leave request already processed');
  }

  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status: input.status,
      approvedBy: 'household',
    },
  });

  return updated;
}

export async function getLeaveRequests(userId: string, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  // Check if user is helper or household
  const helperProfile = await prisma.helperProfile.findUnique({ where: { userId } });
  const householdProfile = await prisma.householdProfile.findUnique({ where: { userId } });

  let where: any = {};

  if (helperProfile) {
    where.helperId = helperProfile.id;
  } else if (householdProfile) {
    where.booking = { householdId: householdProfile.id };
  } else {
    throw new BadRequestError('No profile found');
  }

  const [requests, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        helper: { include: { user: { select: { id: true, fullName: true } } } },
        booking: { select: { id: true, scheduleType: true } },
      },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return {
    requests,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Replacements ────────────────────────────────────────────────────────────

export async function requestReplacement(userId: string, input: CreateReplacementInput) {
  const householdProfile = await prisma.householdProfile.findUnique({
    where: { userId },
  });
  if (!householdProfile) throw new NotFoundError('Household profile not found');

  const booking = await prisma.monthlyBooking.findUnique({
    where: { id: input.originalBookingId },
    include: { helper: true },
  });
  if (!booking) throw new NotFoundError('Booking not found');
  if (booking.householdId !== householdProfile.id) {
    throw new BadRequestError('You are not the household for this booking');
  }

  const replacementDates = input.replacementDates.map((d) => new Date(d));

  const replacement = await prisma.replacementRequest.create({
    data: {
      originalBookingId: input.originalBookingId,
      householdId: householdProfile.id,
      originalHelperId: booking.helperId,
      reason: input.reason,
      urgency: input.urgency ?? 'standard',
      replacementDates,
      visitDetails: input.visitDetails as any,
    },
  });

  return replacement;
}

export async function findMatches(replacementId: string, userId: string) {
  const replacement = await prisma.replacementRequest.findUnique({
    where: { id: replacementId },
    include: { household: true },
  });
  if (!replacement) throw new NotFoundError('Replacement request not found');
  if (replacement.household.userId !== userId) {
    throw new BadRequestError('Not your replacement request');
  }

  // Find substitute helpers near the household who are available_for_substitute
  const household = await prisma.householdProfile.findUnique({
    where: { id: replacement.householdId },
  });
  if (!household) throw new NotFoundError('Household not found');

  const helpers = await prisma.helperProfile.findMany({
    where: {
      availableForSubstitute: true,
      verificationStatus: 'verified',
      id: { not: replacement.originalHelperId },
    },
    include: {
      user: { select: { id: true, fullName: true, phone: true } },
    },
    take: 20,
  });

  return helpers;
}

export async function assignSubstitute(replacementId: string, substituteHelperId: string) {
  const replacement = await prisma.replacementRequest.findUnique({
    where: { id: replacementId },
  });
  if (!replacement) throw new NotFoundError('Replacement request not found');
  if (replacement.status !== 'open') {
    throw new BadRequestError('Replacement request is not open');
  }

  const updated = await prisma.replacementRequest.update({
    where: { id: replacementId },
    data: {
      substituteHelperId,
      status: 'matched',
      matchedAt: new Date(),
    },
  });

  return updated;
}

export async function getReplacementStatus(replacementId: string, userId: string) {
  const replacement = await prisma.replacementRequest.findUnique({
    where: { id: replacementId },
    include: {
      originalHelper: { include: { user: { select: { id: true, fullName: true } } } },
      substituteHelper: { include: { user: { select: { id: true, fullName: true } } } },
      household: { include: { user: { select: { id: true, fullName: true } } } },
    },
  });
  if (!replacement) throw new NotFoundError('Replacement request not found');

  return replacement;
}
