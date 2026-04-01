import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../common/errors/index.js';
import type { UpdateHelperProfileInput, UpdateCookPricingInput, SetAvailabilityInput } from '@homehelp/shared';

export async function getProfile(userId: string) {
  const profile = await prisma.helperProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, phone: true, fullName: true, email: true, avatarUrl: true, languagePref: true },
      },
      cookPricingProfile: true,
      availability: { orderBy: [{ dayOfWeek: 'asc' }, { slotStart: 'asc' }] },
      serviceAreas: {
        include: { serviceArea: { select: { id: true, name: true, zone: true, pincodes: true } } },
      },
    },
  });

  if (!profile) throw new NotFoundError('Helper profile not found');
  return profile;
}

export async function updateProfile(userId: string, input: UpdateHelperProfileInput) {
  const existing = await prisma.helperProfile.findUnique({ where: { userId } });
  if (!existing) throw new NotFoundError('Helper profile not found');

  const { fullName, serviceAreaIds, ...profileData } = input;

  const profile = await prisma.$transaction(async (tx) => {
    const updated = await tx.helperProfile.update({
      where: { userId },
      data: profileData,
    });

    if (fullName !== undefined) {
      await tx.user.update({ where: { id: userId }, data: { fullName } });
    }

    if (serviceAreaIds !== undefined) {
      await tx.helperServiceArea.deleteMany({ where: { helperId: existing.id } });
      if (serviceAreaIds.length > 0) {
        await tx.helperServiceArea.createMany({
          data: serviceAreaIds.map((serviceAreaId) => ({
            helperId: existing.id,
            serviceAreaId,
          })),
        });
      }
    }

    return updated;
  });

  return profile;
}

export async function updatePricing(userId: string, input: UpdateCookPricingInput) {
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });
  if (!helper) throw new NotFoundError('Helper profile not found');

  const existing = await prisma.cookPricingProfile.findUnique({ where: { helperId: helper.id } });
  if (!existing) throw new NotFoundError('Cook pricing profile not found. Set it up via onboarding first.');

  return prisma.cookPricingProfile.update({
    where: { helperId: helper.id },
    data: input,
  });
}

export async function getSchedule(userId: string) {
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });
  if (!helper) throw new NotFoundError('Helper profile not found');

  return prisma.helperAvailability.findMany({
    where: { helperId: helper.id },
    orderBy: [{ dayOfWeek: 'asc' }, { slotStart: 'asc' }],
  });
}

export async function setAvailability(userId: string, input: SetAvailabilityInput) {
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });
  if (!helper) throw new NotFoundError('Helper profile not found');

  // Replace all existing availability slots with the new ones
  await prisma.$transaction([
    prisma.helperAvailability.deleteMany({ where: { helperId: helper.id, bookingId: null } }),
    prisma.helperAvailability.createMany({
      data: input.slots.map((slot) => ({
        helperId: helper.id,
        dayOfWeek: slot.dayOfWeek,
        slotStart: slot.slotStart,
        slotEnd: slot.slotEnd,
        status: slot.status ?? 'available',
      })),
    }),
  ]);

  return prisma.helperAvailability.findMany({
    where: { helperId: helper.id },
    orderBy: [{ dayOfWeek: 'asc' }, { slotStart: 'asc' }],
  });
}
