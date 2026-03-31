import type { Request, Response, NextFunction } from 'express';
import * as notificationsService from './notifications.service.js';

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unread === 'true';
    const result = await notificationsService.getNotifications(req.user!.id, page, limit, unreadOnly);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const result = await notificationsService.markAsRead(id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await notificationsService.markAllAsRead(req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function updateFcmToken(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationsService.updateFcmToken(req.user!.id, req.body.fcmToken);
    res.json({ success: true, data: { message: 'FCM token updated' } });
  } catch (err) { next(err); }
}
