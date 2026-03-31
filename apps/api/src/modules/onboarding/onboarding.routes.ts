import { Router } from 'express';
import {
  createHouseholdProfileSchema,
  createHelperProfileSchema,
  setCookPricingSchema,
} from '@homehelp/shared';
import { authenticate, authorize, validate } from '../../common/middleware/index.js';
import { upload } from '../../common/middleware/upload.js';
import * as onboardingController from './onboarding.controller.js';

const router: ReturnType<typeof Router> = Router();

router.post(
  '/household',
  authenticate,
  authorize('household'),
  validate(createHouseholdProfileSchema),
  onboardingController.createHouseholdProfile,
);

router.post(
  '/helper',
  authenticate,
  authorize('helper'),
  validate(createHelperProfileSchema),
  onboardingController.createHelperProfile,
);

router.put(
  '/helper/pricing',
  authenticate,
  authorize('helper'),
  validate(setCookPricingSchema),
  onboardingController.setCookPricing,
);

router.post(
  '/helper/verification',
  authenticate,
  authorize('helper'),
  upload.single('aadhaarPhoto'),
  onboardingController.submitAadhaarVerification,
);

router.get(
  '/helper/verification/status',
  authenticate,
  authorize('helper'),
  onboardingController.getVerificationStatus,
);

export default router;
