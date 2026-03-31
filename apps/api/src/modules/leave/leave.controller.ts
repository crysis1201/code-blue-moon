import type { Request, Response, NextFunction } from 'express';
import * as leaveService from './leave.service.js';

// ─── Leave ───────────────────────────────────────────────────────────────────

export async function requestLeave(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await leaveService.requestLeave(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function approveLeave(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const result = await leaveService.approveLeave(id, req.user!.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getLeaveRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await leaveService.getLeaveRequests(req.user!.id, page, limit);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

// ─── Replacements ────────────────────────────────────────────────────────────

export async function requestReplacement(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await leaveService.requestReplacement(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function findMatches(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const result = await leaveService.findMatches(id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function assignSubstitute(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { substituteHelperId } = req.body;
    const result = await leaveService.assignSubstitute(id, substituteHelperId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getReplacementStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const result = await leaveService.getReplacementStatus(id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}
