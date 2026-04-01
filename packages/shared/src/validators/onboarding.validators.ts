import { z } from 'zod';

export const createHouseholdProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  addressLine: z.string().min(5),
  locality: z.string().min(2).max(100),
  city: z.string().min(2).max(50),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  familySize: z.number().int().min(1).max(20).optional(),
  houseType: z.enum(['1bhk', '2bhk', '3bhk', '4bhk+']).optional(),
  dietaryPref: z.enum(['veg', 'non_veg', 'both']).optional(),
});

export const updateHouseholdProfileSchema = createHouseholdProfileSchema.partial();

export const createHelperProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  serviceTypes: z
    .array(z.enum(['cook', 'maid', 'nanny', 'caretaker', 'driver']))
    .min(1, 'At least one service type is required'),
  locality: z.string().min(2).max(100),
  city: z.string().min(2).max(50),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  serviceRadiusKm: z.number().int().min(1).max(50).optional(),
  serviceAreaIds: z.array(z.string().uuid()).min(1, 'Select at least one service area').optional(),
  experienceYears: z.number().int().min(0).max(50).optional(),
  languages: z.array(z.string()).min(1).optional(),
  bio: z.string().max(500).optional(),
  availableForDaily: z.boolean().optional(),
  availableForMonthly: z.boolean().optional(),
  availableForSubstitute: z.boolean().optional(),
});

export const updateHelperProfileSchema = createHelperProfileSchema.partial();

const familySurchargeSchema = z.object({
  min_size: z.number().int().min(1),
  max_size: z.number().int().min(1).nullable(),
  amount: z.number().int().min(0),
});

const customSurchargeSchema = z.object({
  label: z.string().min(1).max(50),
  amount: z.number().int().min(0),
});

export const setCookPricingSchema = z.object({
  baseMonthlyRate: z.number().int().min(1000),
  perExtraMeal: z.number().int().min(0).optional(),
  perExtraVisit: z.number().int().min(0).optional(),
  weekendSurcharge: z.number().int().min(0).optional(),
  nonVegSurcharge: z.number().int().min(0).optional(),
  groceryShoppingAdd: z.number().int().min(0).optional(),
  familySurcharges: z.array(familySurchargeSchema).optional(),
  customSurcharges: z.array(customSurchargeSchema).optional(),
  minAcceptableRate: z.number().int().min(0).optional(),
  perVisitRate: z.number().int().min(0).optional(),
  perVisitMaxMeals: z.number().int().min(1).max(10).optional(),
  perVisitMaxPeople: z.number().int().min(1).max(20).optional(),
  cuisineTags: z.array(z.string()).optional(),
  specialtyDishes: z.array(z.string()).optional(),
});

export const updateCookPricingSchema = setCookPricingSchema.partial();

const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  slotStart: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  slotEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  status: z.enum(['available', 'blocked']).optional(),
});

export const setAvailabilitySchema = z.object({
  slots: z.array(availabilitySlotSchema).min(1),
});

export type CreateHouseholdProfileInput = z.infer<typeof createHouseholdProfileSchema>;
export type UpdateHouseholdProfileInput = z.infer<typeof updateHouseholdProfileSchema>;
export type CreateHelperProfileInput = z.infer<typeof createHelperProfileSchema>;
export type UpdateHelperProfileInput = z.infer<typeof updateHelperProfileSchema>;
export type SetCookPricingInput = z.infer<typeof setCookPricingSchema>;
export type UpdateCookPricingInput = z.infer<typeof updateCookPricingSchema>;
export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>;
