import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../common/errors/index.js';

export async function getDashboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    householdCount,
    helperCount,
    adminCount,
    activeMonthlyBookings,
    activeDailyBookings,
    pendingVerifications,
    revenueThisMonth,
  ] = await Promise.all([
    prisma.user.count({ where: { status: 'active' } }),
    prisma.user.count({ where: { status: 'active', role: 'household' } }),
    prisma.user.count({ where: { status: 'active', role: 'helper' } }),
    prisma.user.count({ where: { status: 'active', role: 'admin' } }),
    prisma.monthlyBooking.count({ where: { status: 'active' } }),
    prisma.dailyBooking.count({ where: { status: { in: ['confirmed', 'in_progress'] } } }),
    prisma.helperProfile.count({ where: { verificationStatus: { in: ['pending', 'in_progress'] } } }),
    prisma.transaction.aggregate({
      where: {
        status: 'completed',
        type: { in: ['monthly_salary_collection', 'daily_booking_payment'] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    users: { total: totalUsers, household: householdCount, helper: helperCount, admin: adminCount },
    bookings: { activeMonthly: activeMonthlyBookings, activeDaily: activeDailyBookings },
    revenue: { thisMonth: (revenueThisMonth._sum.amount ?? 0) / 100 },
    pendingVerifications,
  };
}

export async function getUsers(
  filters: { phone?: string; name?: string; role?: string; status?: string },
  page = 1,
  limit = 20,
) {
  const offset = (page - 1) * limit;
  const where: any = {};

  if (filters.phone) where.phone = { contains: filters.phone };
  if (filters.name) where.fullName = { contains: filters.name, mode: 'insensitive' };
  if (filters.role) where.role = filters.role;
  if (filters.status) where.status = filters.status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        phone: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      householdProfile: true,
      helperProfile: true,
    },
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function suspendUser(userId: string, reason: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  return prisma.user.update({
    where: { id: userId },
    data: {
      status: 'suspended',
    },
  });
}

export async function getVerificationQueue(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const where = {
    verificationStatus: { in: ['pending', 'in_progress'] as string[] },
  };

  const [helpers, total] = await Promise.all([
    prisma.helperProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
      },
    }),
    prisma.helperProfile.count({ where }),
  ]);

  return {
    helpers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function approveVerification(helperId: string, type: 'aadhaar' | 'police') {
  const helper = await prisma.helperProfile.findUnique({ where: { id: helperId } });
  if (!helper) throw new NotFoundError('Helper not found');

  const updateData: any = {};

  if (type === 'aadhaar') {
    updateData.aadhaarVerified = true;
  } else if (type === 'police') {
    updateData.policeVerified = true;
  }

  // If both are now verified, mark as verified
  const willBeFullyVerified =
    (type === 'aadhaar' ? true : helper.aadhaarVerified) &&
    (type === 'police' ? true : helper.policeVerified);

  if (willBeFullyVerified) {
    updateData.verificationStatus = 'verified';
  } else {
    updateData.verificationStatus = 'in_progress';
  }

  return prisma.helperProfile.update({
    where: { id: helperId },
    data: updateData,
  });
}

export async function getBookings(
  filters: { status?: string; type?: string },
  page = 1,
  limit = 20,
) {
  const offset = (page - 1) * limit;

  // Fetch monthly bookings
  const monthlyWhere: any = {};
  if (filters.status) monthlyWhere.status = filters.status;

  const [monthlyBookings, monthlyTotal] = await Promise.all([
    prisma.monthlyBooking.findMany({
      where: monthlyWhere,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        household: { include: { user: { select: { id: true, fullName: true } } } },
        helper: { include: { user: { select: { id: true, fullName: true } } } },
      },
    }),
    prisma.monthlyBooking.count({ where: monthlyWhere }),
  ]);

  return {
    bookings: monthlyBookings,
    pagination: { page, limit, total: monthlyTotal, totalPages: Math.ceil(monthlyTotal / limit) },
  };
}

export async function getPaymentOverview(month: string) {
  const startDate = new Date(`${month}-01`);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

  const [totalCollected, totalPaidOut] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        status: 'completed',
        type: { in: ['monthly_salary_collection', 'daily_booking_payment'] },
        createdAt: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        status: 'completed',
        type: { in: ['monthly_salary_payout'] },
        createdAt: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
    }),
  ]);

  const collected = (totalCollected._sum.amount ?? 0) / 100;
  const paidOut = (totalPaidOut._sum.amount ?? 0) / 100;

  return {
    month,
    totalCollected: collected,
    totalPaidOut: paidOut,
    platformRevenue: collected - paidOut,
  };
}

export async function getFailedPayouts(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const where = {
    status: 'failed',
    type: { in: ['monthly_salary_payout'] as string[] },
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Settings can be stored in Redis or a simple key-value table later
export async function updateSettings(_key: string, _value: string) {
  // TODO: Add AppSetting model when needed
  return { key: _key, value: _value };
}
