import { Router } from 'express';
import { sendOtpSchema, verifyOtpSchema, refreshTokenSchema } from '@homehelp/shared';
import { validate, otpRateLimiter, authenticate } from '../../common/middleware/index.js';
import * as authController from './auth.controller.js';

const router: ReturnType<typeof Router> = Router();

router.post('/otp/send', validate(sendOtpSchema), otpRateLimiter, authController.sendOtp);
router.post('/otp/verify', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);

export default router;
