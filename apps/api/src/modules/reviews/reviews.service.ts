import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../common/errors/index.js';
import type { CreateReviewInput } from '@homehelp/shared';

export async function createReview(userId: string, input: CreateReviewInput) {
  const { bookingId, bookingType, rating, punctualityRating, qualityRating, hygieneRating, behaviorRating, comment } = input;

  // Find the booking and determine roles
  let booking: any;
  let householdUserId: string;
  let helperUserId: string;

  if (bookingType === 'monthly') {
    booking = await prisma.monthlyBooking.findUnique({
      where: { id: bookingId },
      include: { household: true, helper: true },
    });
    if (!booking) throw new NotFoundError('Monthly booking not found');
    householdUserId = booking.household.userId;
    helperUserId = booking.helper.userId;
  } else {
    booking = await prisma.dailyBooking.findUnique({
      where: { id: bookingId },
      include: { household: true, helper: true },
    });
    if (!booking) throw new NotFoundError('Daily booking not found');
    householdUserId = booking.household.userId;
    helperUserId = booking.helper.userId;
  }

  // Determine reviewer and reviewee
  let revieweeId: string;
  if (userId === householdUserId) {
    revieweeId = helperUserId;
  } else if (userId === helperUserId) {
    revieweeId = householdUserId;
  } else {
    throw new BadRequestError('You are not part of this booking');
  }

  // Check for duplicate review
  const existing = await prisma.review.findFirst({
    where: {
      reviewerId: userId,
      ...(bookingType === 'monthly' ? { monthlyBookingId: bookingId } : { dailyBookingId: bookingId }),
    },
  });
  if (existing) throw new BadRequestError('You have already reviewed this booking');

  const review = await prisma.review.create({
    data: {
      ...(bookingType === 'monthly' ? { monthlyBookingId: bookingId } : { dailyBookingId: bookingId }),
      bookingType,
      reviewerId: userId,
      revieweeId,
      rating,
      punctualityRating,
      qualityRating,
      hygieneRating,
      behaviorRating,
      comment,
    },
  });

  // Update helper average rating if the reviewee is the helper
  if (revieweeId === helperUserId) {
    const helperProfile = await prisma.helperProfile.findUnique({
      where: { userId: helperUserId },
    });
    if (helperProfile) {
      const currentTotal = Number(helperProfile.avgRating ?? 0) * (helperProfile.totalRatings ?? 0);
      const newTotalRatings = (helperProfile.totalRatings ?? 0) + 1;
      const newAvgRating = (currentTotal + rating) / newTotalRatings;

      await prisma.helperProfile.update({
        where: { id: helperProfile.id },
        data: {
          avgRating: Math.round(newAvgRating * 100) / 100,
          totalRatings: newTotalRatings,
        },
      });
    }
  }

  return review;
}

export async function getHelperReviews(helperId: string, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const helperProfile = await prisma.helperProfile.findUnique({
    where: { id: helperId },
  });
  if (!helperProfile) throw new NotFoundError('Helper not found');

  const where = {
    revieweeId: helperProfile.userId,
    isVisible: true,
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        reviewer: { select: { id: true, fullName: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews,
    avgRating: helperProfile.avgRating,
    totalRatings: helperProfile.totalRatings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function flagReview(reviewId: string, userId: string, reason: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError('Review not found');

  return prisma.review.update({
    where: { id: reviewId },
    data: {
      flagged: true,
      flaggedReason: reason,
    },
  });
}
