import { Router } from 'express';
import { createReviewSchema, flagReviewSchema } from '@homehelp/shared';
import { authenticate, validate } from '../../common/middleware/index.js';
import * as ctrl from './reviews.controller.js';

const router: ReturnType<typeof Router> = Router();

router.post('/', authenticate, validate(createReviewSchema), ctrl.createReview);
router.get('/helper/:id', authenticate, ctrl.getHelperReviews);
router.post('/:id/flag', authenticate, validate(flagReviewSchema), ctrl.flagReview);

export default router;
