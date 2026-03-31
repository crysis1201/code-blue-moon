import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { calculateAllMonthlySalaries } from '../modules/payments/index.js';

export const salaryQueue = new Queue('salary', { connection: redis });

// Schedule monthly salary calculation on the 28th at 6 AM IST
export async function setupSalaryJobs() {
  const existing = await salaryQueue.getRepeatableJobs();
  for (const job of existing) {
    await salaryQueue.removeRepeatableByKey(job.key);
  }

  await salaryQueue.add(
    'calculate-monthly-salaries',
    {},
    {
      repeat: { pattern: '0 0 6 28 * *' }, // 28th of every month at 6 AM
      removeOnComplete: 10,
      removeOnFail: 50,
    },
  );

  console.log('📅 Salary cron job scheduled: calculate on 28th of every month');
}

export const salaryWorker = new Worker(
  'salary',
  async (job) => {
    if (job.name === 'calculate-monthly-salaries') {
      const results = await calculateAllMonthlySalaries();
      console.log(`[salary] Calculated ${results.length} salary cycles`);
      return { calculated: results.length };
    }
  },
  {
    connection: redis,
    concurrency: 1,
  },
);

salaryWorker.on('failed', (job, err) => {
  console.error(`[salary] Job ${job?.name} failed:`, err.message);
});
