import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';

export const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { notificationId, userId, title, body, data, channel } = job.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    if (channel === 'push') {
      if (env.isDev) {
        console.log(`[DEV PUSH] To: ${user.phone} | ${title}: ${body}`);
      } else if (user.fcmToken) {
        // FCM push — import firebase-admin when ready
        // await admin.messaging().send({
        //   token: user.fcmToken,
        //   notification: { title, body },
        //   data: data ?? {},
        //   android: { priority: 'high' },
        // });
        console.log(`[PUSH] Sent to ${user.phone}`);
      }
    }

    if (channel === 'sms') {
      if (env.isDev) {
        console.log(`[DEV SMS] To: ${user.phone} | ${body}`);
      } else {
        // MSG91 SMS — reuse the client when ready
        // await msg91.sendSMS(user.phone, body);
        console.log(`[SMS] Sent to ${user.phone}`);
      }
    }

    // Mark as sent
    await prisma.notification.update({
      where: { id: notificationId },
      data: { sentAt: new Date() },
    });
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

notificationWorker.on('failed', (job, err) => {
  console.error(`[notification] Job failed for ${job?.data?.userId}:`, err.message);
});
