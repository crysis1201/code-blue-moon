import type { Request, Response, NextFunction } from 'express';
import * as monthlyService from './monthly.service.js';
import * as dailyService from './daily.service.js';

const paramId = (req: Request): string => req.params.id as string;

// --- Monthly ---

export async function createMonthlyBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await monthlyService.createMonthlyBooking(req.user!.id, req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
}

export async function getMonthlyBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await monthlyService.getMonthlyBooking(paramId(req), req.user!.id);
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
}

export async function negotiate(req: Request, res: Response, next: NextFunction) {
  try {
    const negotiation = await monthlyService.negotiate(paramId(req), req.user!.id, req.body);
    res.json({ success: true, data: negotiation });
  } catch (err) { next(err); }
}

export async function acceptBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await monthlyService.acceptBooking(paramId(req), req.user!.id);
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
}

export async function startTrial(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await monthlyService.startTrial(paramId(req), req.user!.id);
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
}

export async function confirmBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await monthlyService.confirmBooking(paramId(req), req.user!.id);
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
}

export async function pauseBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await monthlyService.pauseBooking(paramId(req), req.user!.id, req.body.reason);
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
}

export async function resumeBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await monthlyService.resumeBooking(paramId(req), req.user!.id);
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
}

export async function endBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await monthlyService.endBooking(paramId(req), req.user!.id, req.body.reason);
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
}

export async function cancelMonthlyBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await monthlyService.cancelBooking(paramId(req), req.user!.id, req.body.reason);
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
}

export async function getActiveMonthlyBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const bookings = await monthlyService.getActiveBookings(req.user!.id);
    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
}

// --- Daily ---

export async function createDailyBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await dailyService.createDailyBooking(req.user!.id, req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
}

export async function getDailyBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await dailyService.getDailyBooking(paramId(req), req.user!.id);
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
}

export async function acceptDailyBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await dailyService.acceptDailyBooking(paramId(req), req.user!.id);
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
}

export async function cancelDailyBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await dailyService.cancelDailyBooking(paramId(req), req.user!.id, req.body.reason);
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
}

export async function getUpcomingDailyBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const bookings = await dailyService.getUpcomingDailyBookings(req.user!.id);
    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
}
