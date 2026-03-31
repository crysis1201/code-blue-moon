import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../common/errors/index.js';

// Count scheduled working days in a month for given selected days
function countScheduledDays(selectedDays: number[], year: number, month: number): number {
  let count = 0;
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const dow = (date.getDay() + 6) % 7; // Convert Sun=0 to Mon=0
    if (selectedDays.includes(dow)) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

export async function calculateMonthlySalary(bookingId: string, cycleMonth: Date) {
  const booking = await prisma.monthlyBooking.findUnique({
    where: { id: bookingId },
    include: { helper: { include: { user: true } }, household: { include: { user: true } } },
  });
  if (!booking) throw new NotFoundError('Booking not found');

  const year = cycleMonth.getFullYear();
  const month = cycleMonth.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  // Get attendance summary
  const logs = await prisma.attendanceLog.findMany({
    where: {
      monthlyBookingId: bookingId,
      attendanceDate: { gte: monthStart, lte: monthEnd },
    },
  });

  const daysPresent = logs.filter((l) => ['checked_in', 'completed', 'late'].includes(l.status)).length;
  const daysAbsent = logs.filter((l) => l.status === 'absent').length;
  const daysLate = logs.filter((l) => l.status === 'late').length;
  const daysLeave = logs.filter((l) => l.status === 'leave').length;

  const scheduledDays = countScheduledDays(booking.selectedDays, year, month);

  // Pro-rate salary
  const grossSalary = scheduledDays > 0
    ? Math.round((daysPresent / scheduledDays) * booking.agreedMonthlyRate)
    : 0;

  const commissionPct = booking.platformCommissionPct;
  const platformCommission = Math.round(grossSalary * commissionPct / 100);
  const helperPayout = grossSalary - platformCommission;
  const processingFee = Math.round(grossSalary * 0.02); // 2% from household
  const householdTotal = grossSalary + processingFee;

  const cycle = await prisma.salaryCycle.upsert({
    where: {
      monthlyBookingId_cycleMonth: { monthlyBookingId: bookingId, cycleMonth: monthStart },
    },
    create: {
      monthlyBookingId: bookingId,
      helperId: booking.helperId,
      householdId: booking.householdId,
      cycleMonth: monthStart,
      scheduledDays,
      daysPresent,
      daysAbsent,
      daysLate,
      daysLeave,
      grossSalary,
      netSalary: grossSalary,
      platformCommission,
      helperPayout,
      paymentProcessingFee: processingFee,
      householdTotal,
      status: 'calculated',
      calculatedAt: new Date(),
    },
    update: {
      scheduledDays,
      daysPresent,
      daysAbsent,
      daysLate,
      daysLeave,
      grossSalary,
      netSalary: grossSalary,
      platformCommission,
      helperPayout,
      paymentProcessingFee: processingFee,
      householdTotal,
      status: 'calculated',
      calculatedAt: new Date(),
    },
  });

  return cycle;
}

export async function getSalaryCycle(cycleId: string) {
  const cycle = await prisma.salaryCycle.findUnique({
    where: { id: cycleId },
    include: {
      monthlyBooking: true,
      helper: { include: { user: { select: { fullName: true, phone: true } } } },
      household: { include: { user: { select: { fullName: true, phone: true } } } },
    },
  });
  if (!cycle) throw new NotFoundError('Salary cycle not found');
  return cycle;
}

export async function getSalaryForBooking(bookingId: string, month: string) {
  const [year, m] = month.split('-').map(Number);
  const cycleMonth = new Date(year, m - 1, 1);

  let cycle = await prisma.salaryCycle.findUnique({
    where: {
      monthlyBookingId_cycleMonth: { monthlyBookingId: bookingId, cycleMonth },
    },
    include: {
      helper: { include: { user: { select: { fullName: true } } } },
      household: { include: { user: { select: { fullName: true } } } },
    },
  });

  // Auto-calculate if not exists
  if (!cycle) {
    cycle = await calculateMonthlySalary(bookingId, cycleMonth) as any;
  }

  return cycle;
}

export async function getHelperEarnings(userId: string) {
  const helper = await prisma.helperProfile.findUnique({ where: { userId } });
  if (!helper) throw new NotFoundError('Helper profile not found');

  const cycles = await prisma.salaryCycle.findMany({
    where: { helperId: helper.id },
    include: {
      household: { include: { user: { select: { fullName: true } } } },
      monthlyBooking: { select: { agreedMonthlyRate: true, status: true } },
    },
    orderBy: { cycleMonth: 'desc' },
    take: 12,
  });

  const totalEarned = cycles
    .filter((c) => c.status === 'payout_completed')
    .reduce((sum, c) => sum + c.helperPayout, 0);

  const pendingPayout = cycles
    .filter((c) => ['calculated', 'payment_collected'].includes(c.status))
    .reduce((sum, c) => sum + c.helperPayout, 0);

  return { cycles, totalEarned, pendingPayout };
}

export async function getTransactionHistory(userId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.transaction.count({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
    }),
  ]);

  return {
    transactions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Calculate all salaries for the month — called by BullMQ cron
export async function calculateAllMonthlySalaries() {
  const now = new Date();
  const cycleMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeBookings = await prisma.monthlyBooking.findMany({
    where: { status: 'active' },
  });

  const results = [];
  for (const booking of activeBookings) {
    const cycle = await calculateMonthlySalary(booking.id, cycleMonth);
    results.push(cycle);
  }

  return results;
}
