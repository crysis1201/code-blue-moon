import type { Request, Response, NextFunction } from 'express';
import * as helpersService from './helpers.service.js';

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await helpersService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await helpersService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updatePricing(req: Request, res: Response, next: NextFunction) {
  try {
    const pricing = await helpersService.updatePricing(req.user!.id, req.body);
    res.json({ success: true, data: pricing });
  } catch (err) {
    next(err);
  }
}

export async function getSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const schedule = await helpersService.getSchedule(req.user!.id);
    res.json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
}

export async function setAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const slots = await helpersService.setAvailability(req.user!.id, req.body);
    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
}
