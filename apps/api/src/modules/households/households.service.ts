import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../common/errors/index.js';
import type { UpdateHouseholdProfileInput } from '@homehelp/shared';

export async function getProfile(userId: string) {
  const profile = await prisma.householdProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, phone: true, fullName: true, email: true, avatarUrl: true, languagePref: true },
      },
    },
  });

  if (!profile) throw new NotFoundError('Household profile not found');
  return profile;
}

export async function updateProfile(userId: string, input: UpdateHouseholdProfileInput) {
  const existing = await prisma.householdProfile.findUnique({ where: { userId } });
  if (!existing) throw new NotFoundError('Household profile not found');

  const { fullName, ...profileData } = input;

  const [profile] = await prisma.$transaction([
    prisma.householdProfile.update({
      where: { userId },
      data: profileData,
    }),
    ...(fullName !== undefined
      ? [prisma.user.update({ where: { id: userId }, data: { fullName } })]
      : []),
  ]);

  return profile;
}

export async function getDashboard(userId: string) {
  const profile = await prisma.householdProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Household profile not found');

  // Placeholder — will be enriched with bookings, attendance, etc. in later modules
  return {
    profile,
    todaySchedule: [],
    alerts: [],
  };
}
