import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { detectNoShows } from '../modules/attendance/index.js';

export const attendanceQueue = new Queue('attendance', { connection: redis });

// Schedule daily no-show detection at 10:30 AM IST
export async function setupAttendanceJobs() {
  // Remove existing repeatable jobs to avoid duplicates
  const existing = await attendanceQueue.getRepeatableJobs();
  for (const job of existing) {
    await attendanceQueue.removeRepeatableByKey(job.key);
  }

  await attendanceQueue.add(
    'detect-no-shows',
    {},
    {
      repeat: { pattern: '0 30 10 * * *' }, // 10:30 AM every day
      removeOnComplete: 10,
      removeOnFail: 50,
    },
  );

  console.log('📅 Attendance cron job scheduled: detect-no-shows at 10:30 AM daily');
}

export const attendanceWorker = new Worker(
  'attendance',
  async (job) => {
    if (job.name === 'detect-no-shows') {
      const results = await detectNoShows();
      console.log(`[attendance] Marked ${results.length} no-shows for today`);
      return { markedAbsent: results.length };
    }
  },
  {
    connection: redis,
    concurrency: 1,
  },
);

attendanceWorker.on('failed', (job, err) => {
  console.error(`[attendance] Job ${job?.name} failed:`, err.message);
});
