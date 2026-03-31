export const USER_ROLES = ['household', 'helper', 'admin'] as const;

export const TOKEN_EXPIRY = {
  ACCESS_SECONDS: 900,        // 15 minutes
  REFRESH_DAYS: 30,
  REFRESH_MS: 30 * 24 * 60 * 60 * 1000,
} as const;

export const OTP_LENGTH = 6;

export const RATE_LIMITS = {
  GLOBAL: { points: 100, duration: 60 },        // 100 req/min per IP
  OTP: { points: 5, duration: 3600 },            // 5 OTP/hour per phone
  BOOKING: { points: 10, duration: 86400 },      // 10/day per user
} as const;
