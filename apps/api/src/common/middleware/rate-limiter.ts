import type { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../../config/redis.js';
import { RATE_LIMITS } from '@homehelp/shared';
import { TooManyRequestsError } from '../errors/index.js';

const globalLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl_global',
  points: RATE_LIMITS.GLOBAL.points,
  duration: RATE_LIMITS.GLOBAL.duration,
});

const otpLimiterInstance = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl_otp',
  points: RATE_LIMITS.OTP.points,
  duration: RATE_LIMITS.OTP.duration,
});

export async function globalRateLimiter(req: Request, _res: Response, next: NextFunction) {
  try {
    await globalLimiter.consume(req.ip ?? 'unknown');
    next();
  } catch {
    next(new TooManyRequestsError('Too many requests, slow down'));
  }
}

export async function otpRateLimiter(req: Request, _res: Response, next: NextFunction) {
  try {
    const phone = req.body?.phone ?? 'unknown';
    await otpLimiterInstance.consume(phone);
    next();
  } catch {
    next(new TooManyRequestsError('Too many OTP requests. Try again later.'));
  }
}
