import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { TOKEN_EXPIRY } from '@homehelp/shared';
import type { UserRole } from '@homehelp/shared';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export function generateAccessToken(userId: string, role: UserRole): string {
  return jwt.sign(
    { sub: userId, role },
    env.jwtPrivateKey,
    {
      algorithm: 'RS256',
      expiresIn: TOKEN_EXPIRY.ACCESS_SECONDS,
    },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtPublicKey, {
    algorithms: ['RS256'],
  }) as AccessTokenPayload;
}
