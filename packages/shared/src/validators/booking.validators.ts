import { z } from 'zod';

const visitSchema = z.object({
  visit_num: z.number().int().min(1),
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
});

export const createMonthlyBookingSchema = z.object({
  helperId: z.string().uuid(),
  scheduleType: z.enum(['everyday', 'weekdays', 'custom']),
  selectedDays: z.array(z.number().int().min(0).max(6)).optional(),
  visits: z.array(visitSchema).min(1),
  mealsPerDay: z.number().int().min(1).max(5),
  visitsPerDay: z.number().int().min(1).max(3),
  familySize: z.number().int().min(1).max(20),
  cuisineTags: z.array(z.string()).optional(),
  extras: z.array(z.string()).optional(),
  specialInstructions: z.string().max(500).optional(),
  proposedRate: z.number().int().min(0).optional(),
});

export const negotiateSchema = z.object({
  proposedRate: z.number().int().min(1),
  message: z.string().max(300).optional(),
});

export const respondNegotiationSchema = z.object({
  response: z.enum(['accepted', 'countered', 'declined']),
  counterRate: z.number().int().min(1).optional(),
  counterMessage: z.string().max(300).optional(),
});

export const createDailyBookingSchema = z.object({
  helperId: z.string().uuid(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  visits: z.array(visitSchema).min(1),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(300).optional(),
});

export const pauseBookingSchema = z.object({
  reason: z.string().max(300).optional(),
});

export const endBookingSchema = z.object({
  reason: z.string().max(300).optional(),
});

export type CreateMonthlyBookingInput = z.infer<typeof createMonthlyBookingSchema>;
export type NegotiateInput = z.infer<typeof negotiateSchema>;
export type RespondNegotiationInput = z.infer<typeof respondNegotiationSchema>;
export type CreateDailyBookingInput = z.infer<typeof createDailyBookingSchema>;
