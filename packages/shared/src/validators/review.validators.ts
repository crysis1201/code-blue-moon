import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  bookingType: z.enum(['monthly', 'daily']),
  rating: z.number().int().min(1).max(5),
  punctualityRating: z.number().int().min(1).max(5).optional(),
  qualityRating: z.number().int().min(1).max(5).optional(),
  hygieneRating: z.number().int().min(1).max(5).optional(),
  behaviorRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(500).optional(),
});

export const flagReviewSchema = z.object({
  reason: z.string().min(1).max(300),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type FlagReviewInput = z.infer<typeof flagReviewSchema>;
