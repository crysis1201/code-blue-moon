import { Router } from 'express';
import {
  updateHelperProfileSchema,
  updateCookPricingSchema,
  setAvailabilitySchema,
} from '@homehelp/shared';
import { authenticate, authorize, validate } from '../../common/middleware/index.js';
import * as helpersController from './helpers.controller.js';

const router: ReturnType<typeof Router> = Router();

router.get('/profile', authenticate, authorize('helper'), helpersController.getProfile);
router.put(
  '/profile',
  authenticate,
  authorize('helper'),
  validate(updateHelperProfileSchema),
  helpersController.updateProfile,
);
router.put(
  '/pricing',
  authenticate,
  authorize('helper'),
  validate(updateCookPricingSchema),
  helpersController.updatePricing,
);
router.get('/schedule', authenticate, authorize('helper'), helpersController.getSchedule);
router.put(
  '/availability',
  authenticate,
  authorize('helper'),
  validate(setAvailabilitySchema),
  helpersController.setAvailability,
);

export default router;
