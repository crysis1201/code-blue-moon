import type { Request, Response, NextFunction } from 'express';
import * as reviewsService from './reviews.service.js';

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reviewsService.createReview(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getHelperReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await reviewsService.getHelperReviews(id, page, limit);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function flagReview(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const result = await reviewsService.flagReview(id, req.user!.id, req.body.reason);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}
