import type { Request, Response, NextFunction } from 'express';
import * as attendanceService from './attendance.service.js';

export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.checkIn(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function checkOut(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.checkOut(req.user!.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function confirmAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.confirmAttendance(
      req.user!.id,
      req.body.attendanceId,
      req.body.confirmed,
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const { bookingId } = req.params as { bookingId: string };
    const bookingType = (req.query.type as string) || 'monthly';
    const month = req.query.month as string | undefined;
    const result = await attendanceService.getCalendar(bookingId, bookingType, req.user!.id, month);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function overrideAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const result = await attendanceService.overrideAttendance(id, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}
