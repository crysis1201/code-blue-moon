import { z } from 'zod';

export const searchHelpersSchema = z.object({
  service_type: z.enum(['cook', 'maid', 'nanny', 'caretaker', 'driver']),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius_km: z.coerce.number().min(1).max(50).default(5),
  meals: z.coerce.number().int().min(1).max(5).optional(),
  visits: z.coerce.number().int().min(1).max(3).optional(),
  days: z.string().optional(), // 'weekdays', 'everyday', or '0,1,2,3,4'
  cuisine: z.string().optional(), // comma-separated: 'south_indian,north_indian'
  family_size: z.coerce.number().int().min(1).max(20).optional(),
  budget_min: z.coerce.number().int().min(0).optional(),
  budget_max: z.coerce.number().int().min(0).optional(),
  sort_by: z.enum(['relevance', 'distance', 'rating', 'price_low', 'price_high']).default('relevance'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const priceEstimateSchema = z.object({
  helper_id: z.string().uuid(),
  meals: z.coerce.number().int().min(1).max(5).default(1),
  visits_per_day: z.coerce.number().int().min(1).max(3).default(1),
  family_size: z.coerce.number().int().min(1).max(20).default(2),
  include_weekends: z.coerce.boolean().default(false),
  non_veg: z.coerce.boolean().default(false),
  grocery_shopping: z.coerce.boolean().default(false),
  days: z.string().optional(), // 'weekdays', 'everyday', or '0,1,2,3,4'
});

export type SearchHelpersInput = z.infer<typeof searchHelpersSchema>;
export type PriceEstimateInput = z.infer<typeof priceEstimateSchema>;
