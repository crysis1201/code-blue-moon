import express from 'express';
import path from 'node:path';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { globalRateLimiter, errorHandler } from './common/middleware/index.js';
import { authRouter } from './modules/auth/index.js';
import { onboardingRouter } from './modules/onboarding/index.js';
import { householdsRouter } from './modules/households/index.js';
import { helpersRouter } from './modules/helpers/index.js';
import { searchRouter } from './modules/search/index.js';
import { bookingsRouter } from './modules/bookings/index.js';
import { attendanceRouter } from './modules/attendance/index.js';
import { paymentsRouter } from './modules/payments/index.js';
import { notificationsRouter } from './modules/notifications/index.js';
import { reviewsRouter } from './modules/reviews/index.js';
import { leaveRouter, replacementsRouter } from './modules/leave/index.js';
import { adminRouter } from './modules/admin/index.js';
import { locationsRouter } from './modules/locations/index.js';

const app: ReturnType<typeof express> = express();

// Global middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(globalRateLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/v1/auth', authRouter);
app.use('/v1/onboarding', onboardingRouter);
app.use('/v1/household', householdsRouter);
app.use('/v1/helper', helpersRouter);
app.use('/v1/search', searchRouter);
app.use('/v1/bookings', bookingsRouter);
app.use('/v1/attendance', attendanceRouter);
app.use('/v1/payments', paymentsRouter);
app.use('/v1/notifications', notificationsRouter);
app.use('/v1/reviews', reviewsRouter);
app.use('/v1/leave', leaveRouter);
app.use('/v1/replacements', replacementsRouter);
app.use('/v1/admin', adminRouter);
app.use('/v1/locations', locationsRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
