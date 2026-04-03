import { Router } from 'express';
import {
  createMonthlyBookingSchema,
  negotiateSchema,
  createDailyBookingSchema,
  cancelBookingSchema,
  pauseBookingSchema,
  endBookingSchema,
} from '@homehelp/shared';
import { authenticate, authorize, validate } from '../../common/middleware/index.js';
import * as ctrl from './bookings.controller.js';

const router: ReturnType<typeof Router> = Router();

// --- Monthly bookings ---
router.post(
  '/monthly',
  authenticate, authorize('household'),
  validate(createMonthlyBookingSchema),
  ctrl.createMonthlyBooking,
);
router.get('/monthly/active', authenticate, ctrl.getActiveMonthlyBookings);
router.get('/monthly/:id', authenticate, ctrl.getMonthlyBooking);
router.post(
  '/monthly/:id/negotiate',
  authenticate,
  validate(negotiateSchema),
  ctrl.negotiate,
);
router.post('/monthly/:id/accept', authenticate, ctrl.acceptBooking);
router.post('/monthly/:id/start-trial', authenticate, ctrl.startTrial);
router.post('/monthly/:id/confirm', authenticate, authorize('household'), ctrl.confirmBooking);
router.post(
  '/monthly/:id/pause',
  authenticate,
  validate(pauseBookingSchema),
  ctrl.pauseBooking,
);
router.post('/monthly/:id/resume', authenticate, ctrl.resumeBooking);
router.post(
  '/monthly/:id/end',
  authenticate,
  validate(endBookingSchema),
  ctrl.endBooking,
);
router.post(
  '/monthly/:id/cancel',
  authenticate,
  validate(cancelBookingSchema),
  ctrl.cancelMonthlyBooking,
);

// --- Daily bookings ---
router.post(
  '/daily',
  authenticate, authorize('household'),
  validate(createDailyBookingSchema),
  ctrl.createDailyBooking,
);
router.get('/daily/upcoming', authenticate, ctrl.getUpcomingDailyBookings);
router.get('/daily/:id', authenticate, ctrl.getDailyBooking);
router.post('/daily/:id/accept', authenticate, authorize('helper'), ctrl.acceptDailyBooking);
router.post(
  '/daily/:id/cancel',
  authenticate,
  validate(cancelBookingSchema),
  ctrl.cancelDailyBooking,
);

export default router;
