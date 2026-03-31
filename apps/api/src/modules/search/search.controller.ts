import type { Request, Response, NextFunction } from 'express';
import * as searchService from './search.service.js';

export async function searchHelpers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await searchService.searchHelpers(req.query as any);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getHelperDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await searchService.getHelperDetail(req.params.id as string);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function getHelperAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const slots = await searchService.getHelperAvailability(req.params.id as string);
    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
}

export async function getPriceEstimate(req: Request, res: Response, next: NextFunction) {
  try {
    const estimate = await searchService.getPriceEstimate(req.query as any);
    res.json({ success: true, data: estimate });
  } catch (err) {
    next(err);
  }
}
