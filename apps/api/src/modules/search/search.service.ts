import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../common/errors/index.js';
import { calculateCookPrice } from './price.utils.js';
import type { SearchHelpersInput, PriceEstimateInput } from '@homehelp/shared';
import { Prisma } from '@prisma/client';

// Haversine distance in km (pure SQL, no PostGIS needed)
const HAVERSINE_SQL = `
  6371 * acos(
    cos(radians($1::float)) * cos(radians(hp.latitude::float)) *
    cos(radians(hp.longitude::float) - radians($2::float)) +
    sin(radians($1::float)) * sin(radians(hp.latitude::float))
  )
`;

interface HelperSearchRow {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  service_types: string[];
  locality: string;
  city: string;
  latitude: number;
  longitude: number;
  experience_years: number;
  languages: string[];
  bio: string | null;
  aadhaar_verified: boolean;
  police_verified: boolean;
  verification_status: string;
  available_for_daily: boolean;
  available_for_monthly: boolean;
  reputation_score: number;
  total_ratings: number;
  avg_rating: number;
  tier: string;
  distance_km: number;
  // Cook pricing (may be null)
  base_monthly_rate: number | null;
  cuisine_tags: string[] | null;
}

export async function searchHelpers(input: SearchHelpersInput) {
  const {
    service_type, latitude, longitude, radius_km,
    service_area_id, cuisine, sort_by, page, limit,
  } = input;

  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions: string[] = [
    `hp.city IS NOT NULL`,
    `u.status = 'active'`,
    `$3 = ANY(hp.service_types)`,
    `${HAVERSINE_SQL} <= $4::float`,
  ];
  const params: (string | number)[] = [latitude, longitude, service_type, radius_km];
  let paramIdx = 5;

  // Service area filter — only show helpers who serve this area
  if (service_area_id) {
    conditions.push(`EXISTS (SELECT 1 FROM helper_service_areas hsa WHERE hsa.helper_id = hp.id AND hsa.service_area_id = $${paramIdx}::uuid)`);
    params.push(service_area_id);
    paramIdx++;
  }

  // Cuisine filter (for cooks)
  const cuisineList = cuisine ? cuisine.split(',').map((c) => c.trim()) : [];
  if (cuisineList.length > 0) {
    conditions.push(`cpp.cuisine_tags && $${paramIdx}::text[]`);
    params.push(`{${cuisineList.join(',')}}`);
    paramIdx++;
  }

  // Budget filter — skip helpers without pricing only when budget is specified
  if (input.budget_min !== undefined) {
    conditions.push(`(cpp.base_monthly_rate IS NULL OR cpp.base_monthly_rate >= $${paramIdx})`);
    params.push(input.budget_min);
    paramIdx++;
  }
  if (input.budget_max !== undefined) {
    conditions.push(`(cpp.base_monthly_rate IS NULL OR cpp.base_monthly_rate <= $${paramIdx})`);
    params.push(input.budget_max);
    paramIdx++;
  }

  // Sort
  let orderBy: string;
  switch (sort_by) {
    case 'distance':
      orderBy = 'distance_km ASC';
      break;
    case 'rating':
      orderBy = 'hp.avg_rating DESC';
      break;
    case 'price_low':
      orderBy = 'COALESCE(cpp.base_monthly_rate, 999999) ASC';
      break;
    case 'price_high':
      orderBy = 'COALESCE(cpp.base_monthly_rate, 0) DESC';
      break;
    default:
      orderBy = 'relevance_score DESC';
  }

  const whereClause = conditions.join(' AND ');

  // Count query
  const countQuery = `
    SELECT COUNT(*) as total
    FROM helper_profiles hp
    JOIN users u ON u.id = hp.user_id
    LEFT JOIN cook_pricing_profiles cpp ON cpp.helper_id = hp.id
    WHERE ${whereClause}
  `;

  // Data query with relevance scoring
  const dataQuery = `
    SELECT
      hp.id,
      hp.user_id,
      u.full_name,
      u.avatar_url,
      hp.service_types,
      hp.locality,
      hp.city,
      hp.latitude::float,
      hp.longitude::float,
      hp.experience_years,
      hp.languages,
      hp.bio,
      hp.aadhaar_verified,
      hp.police_verified,
      hp.verification_status,
      hp.available_for_daily,
      hp.available_for_monthly,
      hp.reputation_score,
      hp.total_ratings,
      hp.avg_rating::float,
      hp.tier,
      ${HAVERSINE_SQL} as distance_km,
      cpp.base_monthly_rate,
      cpp.cuisine_tags,
      (
        0.25 * GREATEST(0, 1 - (${HAVERSINE_SQL} / $4::float)) +
        0.20 * (hp.avg_rating::float / 5.0) +
        0.15 * (hp.reputation_score::float / 100.0) +
        0.15 * CASE WHEN hp.aadhaar_verified THEN 0.6 ELSE 0 END +
        0.15 * CASE WHEN hp.police_verified THEN 0.4 ELSE 0 END +
        0.10 * (hp.experience_years::float / 20.0)
      ) as relevance_score
    FROM helper_profiles hp
    JOIN users u ON u.id = hp.user_id
    LEFT JOIN cook_pricing_profiles cpp ON cpp.helper_id = hp.id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  params.push(limit, offset);

  const [countResult, helpers] = await Promise.all([
    prisma.$queryRawUnsafe<[{ total: bigint }]>(countQuery, ...params.slice(0, -2)),
    prisma.$queryRawUnsafe<HelperSearchRow[]>(dataQuery, ...params),
  ]);

  const total = Number(countResult[0]?.total ?? 0);

  return {
    helpers: helpers.map((h) => ({
      id: h.id,
      userId: h.user_id,
      fullName: h.full_name,
      avatarUrl: h.avatar_url,
      serviceTypes: h.service_types,
      locality: h.locality,
      city: h.city,
      distanceKm: Math.round(h.distance_km * 10) / 10,
      experienceYears: h.experience_years,
      languages: h.languages,
      bio: h.bio,
      aadhaarVerified: h.aadhaar_verified,
      policeVerified: h.police_verified,
      verificationStatus: h.verification_status,
      availableForDaily: h.available_for_daily,
      availableForMonthly: h.available_for_monthly,
      reputationScore: h.reputation_score,
      totalRatings: h.total_ratings,
      avgRating: h.avg_rating,
      tier: h.tier,
      baseMonthlyRate: h.base_monthly_rate,
      cuisineTags: h.cuisine_tags,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getHelperDetail(helperId: string) {
  const profile = await prisma.helperProfile.findUnique({
    where: { id: helperId },
    include: {
      user: {
        select: { id: true, phone: true, fullName: true, avatarUrl: true, languagePref: true },
      },
      cookPricingProfile: true,
      availability: { orderBy: [{ dayOfWeek: 'asc' }, { slotStart: 'asc' }] },
      serviceAreas: {
        include: { serviceArea: { select: { id: true, name: true, zone: true, pincodes: true } } },
      },
    },
  });

  if (!profile) throw new NotFoundError('Helper not found');
  return profile;
}

export async function getHelperAvailability(helperId: string) {
  const helper = await prisma.helperProfile.findUnique({ where: { id: helperId } });
  if (!helper) throw new NotFoundError('Helper not found');

  return prisma.helperAvailability.findMany({
    where: { helperId, status: 'available' },
    orderBy: [{ dayOfWeek: 'asc' }, { slotStart: 'asc' }],
  });
}

export async function getPriceEstimate(input: PriceEstimateInput) {
  const helper = await prisma.helperProfile.findUnique({
    where: { id: input.helper_id },
    include: { cookPricingProfile: true },
  });

  if (!helper) throw new NotFoundError('Helper not found');
  if (!helper.cookPricingProfile) throw new NotFoundError('This helper has no cook pricing profile');

  const estimatedPrice = calculateCookPrice(
    {
      meals: input.meals,
      visitsPerDay: input.visits_per_day,
      familySize: input.family_size,
      includeWeekends: input.include_weekends,
      nonVeg: input.non_veg,
      groceryShopping: input.grocery_shopping,
      days: input.days,
    },
    helper.cookPricingProfile,
  );

  return {
    helperId: input.helper_id,
    estimatedMonthlyRate: estimatedPrice,
    breakdown: {
      baseRate: helper.cookPricingProfile.baseMonthlyRate,
      meals: input.meals,
      visitsPerDay: input.visits_per_day,
      familySize: input.family_size,
      includeWeekends: input.include_weekends,
      nonVeg: input.non_veg,
      groceryShopping: input.grocery_shopping,
    },
    helperMinAcceptable: helper.cookPricingProfile.minAcceptableRate,
  };
}
