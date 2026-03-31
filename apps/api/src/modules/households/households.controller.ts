import type { Request, Response, NextFunction } from 'express';
import * as householdsService from './households.service.js';

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await householdsService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await householdsService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const dashboard = await householdsService.getDashboard(req.user!.id);
    res.json({ success: true, data: dashboard });
  } catch (err) {
    next(err);
  }
}
