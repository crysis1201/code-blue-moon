import { env, prisma, redis } from './config/index.js';
import app from './app.js';
import { setupAttendanceJobs, attendanceWorker } from './jobs/attendance.worker.js';
import { setupSalaryJobs, salaryWorker } from './jobs/salary.worker.js';
import { notificationWorker } from './jobs/notification.worker.js';

async function main() {
  await prisma.$connect();
  console.log('✅ Database connected');

  // Start BullMQ workers
  await setupAttendanceJobs();
  await setupSalaryJobs();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 API server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down...');
    server.close();
    await attendanceWorker.close();
    await salaryWorker.close();
    await notificationWorker.close();
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
