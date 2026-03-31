import { z } from 'zod';

export const createLeaveSchema = z.object({
  bookingId: z.string().uuid(),
  leaveDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
  reason: z.string().optional(),
  message: z.string().optional(),
  replacementNeeded: z.boolean().optional(),
});

export const approveLeaveSchema = z.object({
  status: z.enum(['approved', 'declined']),
});

export const createReplacementSchema = z.object({
  originalBookingId: z.string().uuid(),
  reason: z.enum(['helper_leave', 'helper_no_show', 'helper_ended', 'quality_issue']),
  urgency: z.enum(['standard', 'priority']).optional(),
  replacementDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
  visitDetails: z.record(z.unknown()),
});

export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
export type ApproveLeaveInput = z.infer<typeof approveLeaveSchema>;
export type CreateReplacementInput = z.infer<typeof createReplacementSchema>;
