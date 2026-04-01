import { prisma } from '../../config/database.js';

export async function getServiceAreas(zone?: string) {
  return prisma.serviceArea.findMany({
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
    },
    orderBy: [{ zone: 'asc' }, { name: 'asc' }],
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
