import { Router } from 'express';
import * as locationsController from './locations.controller.js';

const router: ReturnType<typeof Router> = Router();

// GET /v1/locations/areas?zone=South
router.get('/areas', locationsController.getServiceAreas);

// GET /v1/locations/zones
router.get('/zones', locationsController.getZones);

// GET /v1/locations/validate-pincode/:pincode
router.get('/validate-pincode/:pincode', locationsController.validatePincode);

export default router;
