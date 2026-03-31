import { Router } from 'express';
import { authenticate, authorize } from '../../common/middleware/index.js';
import * as ctrl from './payments.controller.js';

const router: ReturnType<typeof Router> = Router();

// Salary
router.get('/salary/:bookingId/:month', authenticate, ctrl.getSalary);
router.post('/salary/:cycleId/pay', authenticate, authorize('household'), ctrl.paySalary);

// Daily booking payment
router.post('/daily/:bookingId/pay', authenticate, authorize('household'), ctrl.payDailyBooking);

// Helper earnings
router.get('/earnings', authenticate, authorize('helper'), ctrl.getEarnings);

// Transaction history
router.get('/history', authenticate, ctrl.getTransactionHistory);

// Cashfree webhook (no auth — verified by signature)
router.post('/webhooks/cashfree', ctrl.cashfreeWebhook);

export default router;
