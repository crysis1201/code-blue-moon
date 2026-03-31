import { Router } from 'express';
import { updateHouseholdProfileSchema } from '@homehelp/shared';
import { authenticate, authorize, validate } from '../../common/middleware/index.js';
import * as householdsController from './households.controller.js';

const router: ReturnType<typeof Router> = Router();

router.get('/dashboard', authenticate, authorize('household'), householdsController.getDashboard);
router.get('/profile', authenticate, authorize('household'), householdsController.getProfile);
router.put(
  '/profile',
  authenticate,
  authorize('household'),
  validate(updateHouseholdProfileSchema),
  householdsController.updateProfile,
);

export default router;
