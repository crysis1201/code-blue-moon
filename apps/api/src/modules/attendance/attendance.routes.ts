import { Router } from 'express';
import {
  checkInSchema,
  checkOutSchema,
  confirmAttendanceSchema,
  overrideAttendanceSchema,
} from '@homehelp/shared';
import { authenticate, authorize, validate } from '../../common/middleware/index.js';
import * as ctrl from './attendance.controller.js';

const router: ReturnType<typeof Router> = Router();

router.post(
  '/check-in',
  authenticate, authorize('helper'),
  validate(checkInSchema),
  ctrl.checkIn,
);

router.post(
  '/check-out',
  authenticate, authorize('helper'),
  validate(checkOutSchema),
  ctrl.checkOut,
);

router.post(
  '/confirm',
  authenticate, authorize('household'),
  validate(confirmAttendanceSchema),
  ctrl.confirmAttendance,
);

router.get(
  '/calendar/:bookingId',
  authenticate,
  ctrl.getCalendar,
);

router.post(
  '/:id/override',
  authenticate, authorize('admin'),
  validate(overrideAttendanceSchema),
  ctrl.overrideAttendance,
);

export default router;
