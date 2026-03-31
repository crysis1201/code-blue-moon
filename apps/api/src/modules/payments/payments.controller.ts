import type { Request, Response, NextFunction } from 'express';
import * as salaryService from './salary.service.js';
import * as paymentsService from './payments.service.js';
import * as cashfree from './cashfree.client.js';
import { UnauthorizedError } from '../../common/errors/index.js';

export async function getSalary(req: Request, res: Response, next: NextFunction) {
  try {
    const { bookingId, month } = req.params as { bookingId: string; month: string };
    const result = await salaryService.getSalaryForBooking(bookingId, month);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function paySalary(req: Request, res: Response, next: NextFunction) {
  try {
    const cycleId = req.params.cycleId as string;
    const result = await paymentsService.collectSalaryPayment(cycleId, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function payDailyBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const bookingId = req.params.bookingId as string;
    const result = await paymentsService.processDailyBookingPayment(bookingId, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getEarnings(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await salaryService.getHelperEarnings(req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getTransactionHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await salaryService.getTransactionHistory(req.user!.id, page, limit);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function cashfreeWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['x-cashfree-signature'] as string;
    const timestamp = req.headers['x-cashfree-timestamp'] as string;
    const rawBody = JSON.stringify(req.body);

    if (!cashfree.verifyWebhookSignature(signature, rawBody, timestamp)) {
      throw new UnauthorizedError('Invalid webhook signature');
    }

    const event = req.body;
    await paymentsService.handleWebhook(event.type, event.data);

    res.json({ success: true });
  } catch (err) { next(err); }
}
