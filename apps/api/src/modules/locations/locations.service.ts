import { prisma } from '../../config/database.js';
import { calculateCookPrice } from '../search/price.utils.js';
import type { CookPricingProfile } from '@prisma/client';

// Typical household: 2 meals, 2 visits, family of 2 (min) and 6 (max)
const MARKET_RANGE_INPUTS = {
  small: { meals: 2, visitsPerDay: 2, familySize: 2, includeWeekends: false, nonVeg: false, groceryShopping: false },
  large: { meals: 2, visitsPerDay: 2, familySize: 6, includeWeekends: false, nonVeg: false, groceryShopping: false },
} as const;

export async function getServiceAreas(zone?: string) {
  const areas = await prisma.serviceArea.findMany({
    where: {
      isActive: true,
      ...(zone && { zone }),
    },
    select: {
      id: true,
      name: true,
      zone: true,
      city: true,
      pincodes: true,
      latitude: true,
      longitude: true,
      helpers: {
        select: {
          helper: {
            select: {
              cookPricingProfile: true,
            },
          },
        },
      },
    },
    orderBy: [{ zone: 'asc' }, { name: 'asc' }],
  });

  return areas.map(({ helpers, ...area }) => {
    const pricingProfiles = helpers
      .map((h) => h.helper.cookPricingProfile)
      .filter((p): p is CookPricingProfile => p != null);

    let marketRange: { min: number; max: number } | null = null;

    if (pricingProfiles.length > 0) {
      const allPrices: number[] = [];
      for (const pricing of pricingProfiles) {
        allPrices.push(calculateCookPrice(MARKET_RANGE_INPUTS.small, pricing));
        allPrices.push(calculateCookPrice(MARKET_RANGE_INPUTS.large, pricing));
      }
      marketRange = { min: Math.min(...allPrices), max: Math.max(...allPrices) };
    }

    return {
      ...area,
      helperCount: helpers.length,
      marketRange,
    };
  });
}

export async function validatePincode(pincode: string) {
  const area = await prisma.serviceArea.findFirst({
    where: {
      isActive: true,
      pincodes: { has: pincode },
    },
    select: {
      id: true,
      name: true,
      zone: true,
      city: true,
      pincodes: true,
      latitude: true,
      longitude: true,
    },
  });

  return {
    isServiceable: !!area,
    area: area ?? undefined,
  };
}

export async function getZones() {
  const areas = await prisma.serviceArea.findMany({
    where: { isActive: true },
    select: { zone: true },
    distinct: ['zone'],
    orderBy: { zone: 'asc' },
  });

  return areas.map((a) => a.zone);
}
