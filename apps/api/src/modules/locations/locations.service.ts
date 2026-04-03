import { prisma } from '../../config/database.js';

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
              cookPricingProfile: {
                select: { baseMonthlyRate: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ zone: 'asc' }, { name: 'asc' }],
  });

  return areas.map(({ helpers, ...area }) => {
    const rates = helpers
      .map((h) => h.helper.cookPricingProfile?.baseMonthlyRate)
      .filter((r): r is number => r != null);

    return {
      ...area,
      helperCount: helpers.length,
      marketRange: rates.length > 0
        ? { min: Math.min(...rates), max: Math.max(...rates) }
        : null,
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
