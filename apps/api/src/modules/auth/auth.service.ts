import { prisma } from '../../config/database.js';
import { generateAccessToken } from '../../common/utils/jwt.js';
import { hashToken, generateToken } from '../../common/utils/crypto.js';
import { TOKEN_EXPIRY } from '@homehelp/shared';
import type { UserRole, VerifyOtpResponse } from '@homehelp/shared';
import { UnauthorizedError, BadRequestError } from '../../common/errors/index.js';
import * as msg91 from './msg91.client.js';

export async function sendOtp(phone: string): Promise<void> {
  await msg91.sendOtp(phone);
}

export async function verifyOtp(
  phone: string,
  otp: string,
  role?: 'household' | 'helper',
): Promise<VerifyOtpResponse> {
  const isValid = await msg91.verifyOtp(phone, otp);
  if (!isValid) {
    throw new BadRequestError('Invalid OTP', 'INVALID_OTP');
  }

  let user = await prisma.user.findUnique({ where: { phone } });
  let isNewUser = false;

  if (!user) {
    if (!role) {
      throw new BadRequestError('Role is required for new users', 'ROLE_REQUIRED');
    }
    user = await prisma.user.create({
      data: { phone, role },
    });
    isNewUser = true;
  }

  const accessToken = generateAccessToken(user.id, user.role as UserRole);
  const refreshTokenRaw = generateToken(48);
  const refreshTokenHash = hashToken(refreshTokenRaw);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_MS),
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenRaw,
    isNewUser,
    user: {
      id: user.id,
      phone: user.phone,
      role: user.role as UserRole,
      fullName: user.fullName,
    },
  };
}

export async function refreshTokens(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);

  const stored = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!stored) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Revoke old token (rotation)
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  });

  // Generate new pair
  const accessToken = generateAccessToken(stored.user.id, stored.user.role as UserRole);
  const newRefreshTokenRaw = generateToken(48);
  const newRefreshTokenHash = hashToken(newRefreshTokenRaw);

  await prisma.refreshToken.create({
    data: {
      userId: stored.user.id,
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_MS),
    },
  });

  return {
    accessToken,
    refreshToken: newRefreshTokenRaw,
  };
}

export async function logout(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { userId, tokenHash },
      data: { revoked: true },
    });
  } else {
    // Logout from all devices
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }
}
