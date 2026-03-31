import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../common/errors/index.js';
import type {
  CreateHouseholdProfileInput,
  CreateHelperProfileInput,
  SetCookPricingInput,
} from '@homehelp/shared';

export async function createHouseholdProfile(userId: string, input: CreateHouseholdProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  if (user.role !== 'household') throw new BadRequestError('Only household users can create a household profile');

  const existing = await prisma.householdProfile.findUnique({ where: { userId } });
  if (existing) throw new BadRequestError('Household profile already exists');

  const { fullName, ...profileData } = input;

  const [profile] = await prisma.$transaction([
    prisma.householdProfile.create({
      data: {
        userId,
        ...profileData,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { fullName },
    }),
  ]);

  return profile;
}

export async function createHelperProfile(userId: string, input: CreateHelperProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  if (user.role !== 'helper') throw new BadRequestError('Only helper users can create a helper profile');

  const existing = await prisma.helperProfile.findUnique({ where: { userId } });
  if (existing) throw new BadRequestError('Helper profile already exists');

  const { fullName, ...profileData } = input;

  const [profile] = await prisma.$transaction([
    prisma.helperProfile.create({
      data: {
        userId,
        ...profileData,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { fullName },
    }),
  ]);

  return profile;
}

export async function setCookPricing(userId: string, input: SetCookPricingInput) {
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });
  if (!helper) throw new NotFoundError('Helper profile not found. Complete onboarding first.');

  if (!helper.serviceTypes.includes('cook')) {
    throw new BadRequestError('Cook pricing is only for helpers with "cook" service type');
  }

  const profile = await prisma.cookPricingProfile.upsert({
    where: { helperId: helper.id },
    create: {
      helperId: helper.id,
      ...input,
    },
    update: input,
  });

  return profile;
}
