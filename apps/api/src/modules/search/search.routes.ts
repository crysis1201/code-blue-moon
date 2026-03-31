import { Router } from 'express';
import { searchHelpersSchema, priceEstimateSchema } from '@homehelp/shared';
import { authenticate, authorize, validate } from '../../common/middleware/index.js';
import * as searchController from './search.controller.js';

const router: ReturnType<typeof Router> = Router();

router.get(
  '/helpers',
  authenticate,
  authorize('household'),
  validate(searchHelpersSchema, 'query'),
  searchController.searchHelpers,
);

router.get(
  '/helpers/:id',
  authenticate,
  authorize('household'),
  searchController.getHelperDetail,
);

router.get(
  '/helpers/:id/availability',
  authenticate,
  authorize('household'),
  searchController.getHelperAvailability,
);

router.get(
  '/price-estimate',
  authenticate,
  authorize('household'),
  validate(priceEstimateSchema, 'query'),
  searchController.getPriceEstimate,
);

export default router;
