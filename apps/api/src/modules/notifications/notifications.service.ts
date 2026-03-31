import { prisma } from '../../config/database.js';
import { Queue } from 'bullmq';
import { redis } from '../../config/redis.js';
import { NotFoundError } from '../../common/errors/index.js';

export const notificationQueue = new Queue('notifications', { connection: redis });

export interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  channel?: 'push' | 'sms' | 'in_app' | 'whatsapp';
  priority?: 'low' | 'normal' | 'high';
}

export async function sendNotification(userId: string, payload: NotificationPayload) {
  const channel = payload.channel ?? 'push';
  const priority = payload.priority ?? 'normal';

  // Save to DB (in-app notification center)
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? undefined,
      channel,
      priority,
    },
  });

  // Queue for push/sms delivery
  if (channel === 'push' || channel === 'sms') {
    await notificationQueue.add(
      'send',
      {
        notificationId: notification.id,
        userId,
        ...payload,
        channel,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        priority: priority === 'high' ? 1 : priority === 'normal' ? 5 : 10,
      },
    );
  }

  return notification;
}

// Bulk send (e.g., notify all helpers in a city)
export async function sendBulkNotification(userIds: string[], payload: NotificationPayload) {
  const results = [];
  for (const userId of userIds) {
    const n = await sendNotification(userId, payload);
    results.push(n);
  }
  return results;
}

export async function getNotifications(userId: string, page = 1, limit = 20, unreadOnly = false) {
  const offset = (page - 1) * limit;

  const where: any = { userId };
  if (unreadOnly) where.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new NotFoundError('Notification not found');
  if (notification.userId !== userId) throw new NotFoundError('Notification not found');

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { marked: result.count };
}

export async function updateFcmToken(userId: string, fcmToken: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { fcmToken },
  });
}
