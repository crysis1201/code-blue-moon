import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';

export async function sendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.sendOtp(req.body.phone);
    res.json({ success: true, data: { message: 'OTP sent successfully' } });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, otp, role } = req.body;
    const result = await authService.verifyOtp(phone, otp, role);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.user!.id, req.body.refreshToken);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    next(err);
  }
}
