import { Router } from 'express';
import { authenticate, authorize } from '../../common/middleware/index.js';
import * as ctrl from './admin.controller.js';

const router: ReturnType<typeof Router> = Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Users
router.get('/users', ctrl.getUsers);
router.get('/users/:id', ctrl.getUserDetail);
router.post('/users/:id/suspend', ctrl.suspendUser);

// Verifications
router.get('/verifications', ctrl.getVerificationQueue);
router.post('/verifications/:helperId/approve', ctrl.approveVerification);

// Bookings
router.get('/bookings', ctrl.getBookings);

// Payments
router.get('/payments/overview', ctrl.getPaymentOverview);
router.get('/payments/failed-payouts', ctrl.getFailedPayouts);

// Settings
router.put('/settings', ctrl.updateSettings);

export default router;
