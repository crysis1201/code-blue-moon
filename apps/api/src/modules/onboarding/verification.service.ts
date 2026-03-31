import { createHash } from 'node:crypto';
import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../common/errors/index.js';

export async function submitAadhaarVerification(
  userId: string,
  aadhaarNumber: string,
  photoPath: string,
) {
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });
  if (!helper) throw new NotFoundError('Helper profile not found. Complete onboarding first.');

  if (helper.aadhaarVerified) {
    throw new BadRequestError('Aadhaar is already verified');
  }

  // Hash the Aadhaar number — never store raw
  const aadhaarHash = createHash('sha256').update(aadhaarNumber).digest('hex');

  const updated = await prisma.helperProfile.update({
    where: { userId },
    data: {
      aadhaarNumberHash: aadhaarHash,
      aadhaarPhotoUrl: photoPath,
      verificationStatus: 'in_progress',
    },
  });

  return {
    id: updated.id,
    verificationStatus: updated.verificationStatus,
    message: 'Aadhaar submitted for verification. You will be notified once verified.',
  };
}

export async function getVerificationStatus(userId: string) {
  const helper = await prisma.helperProfile.findUnique({
    where: { userId },
    select: {
      aadhaarVerified: true,
      policeVerified: true,
      verificationStatus: true,
      aadhaarPhotoUrl: true,
    },
  });

  if (!helper) throw new NotFoundError('Helper profile not found');
  return helper;
}
