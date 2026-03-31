import type { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service.js';

export async function getDashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.getDashboard();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      phone: req.query.phone as string | undefined,
      name: req.query.name as string | undefined,
      role: req.query.role as string | undefined,
      status: req.query.status as string | undefined,
    };
    const result = await adminService.getUsers(filters, page, limit);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getUserDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const result = await adminService.getUserDetail(id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function suspendUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const result = await adminService.suspendUser(id, reason);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getVerificationQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await adminService.getVerificationQueue(page, limit);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function approveVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const helperId = req.params.helperId as string;
    const { type } = req.body;
    const result = await adminService.approveVerification(helperId, type);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
    };
    const result = await adminService.getBookings(filters, page, limit);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getPaymentOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const result = await adminService.getPaymentOverview(month);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getFailedPayouts(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await adminService.getFailedPayouts(page, limit);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { key, value } = req.body;
    const result = await adminService.updateSettings(key, value);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}
