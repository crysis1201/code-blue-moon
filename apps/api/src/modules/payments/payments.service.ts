import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { BadRequestError, NotFoundError } from '../../common/errors/index.js';
import * as cashfree from './cashfree.client.js';

export async function collectSalaryPayment(cycleId: string, userId: string) {
  const cycle = await prisma.salaryCycle.findUnique({
    where: { id: cycleId },
    include: { household: { include: { user: true } } },
  });
  if (!cycle) throw new NotFoundError('Salary cycle not found');
  if (cycle.household.userId !== userId) throw new BadRequestError('Not your salary cycle');
  if (!['calculated', 'household_notified'].includes(cycle.status)) {
    throw new BadRequestError('Payment already initiated or completed');
  }

  const orderId = `salary_${cycleId}_${Date.now()}`;
  const user = cycle.household.user;

  const order = await cashfree.createOrder({
    orderId,
    amount: cycle.householdTotal,
    customerId: userId,
    customerPhone: user.phone,
    customerEmail: user.email ?? undefined,
    returnUrl: `${env.APP_BASE_URL}/payment/status?order_id=${orderId}`,
    notifyUrl: `${env.APP_BASE_URL}/v1/payments/webhooks/cashfree`,
    orderNote: `Salary payment - ${cycle.id}`,
  });

  // Create transaction record
  await prisma.transaction.create({
    data: {
      type: 'monthly_salary_collection',
      fromUserId: userId,
      amount: cycle.householdTotal * 100, // convert to paisa
      salaryCycleId: cycleId,
      monthlyBookingId: cycle.monthlyBookingId,
      bookingType: 'monthly',
      cfOrderId: order.orderId,
      paymentSessionId: order.paymentSessionId,
      status: 'pending',
    },
  });

  await prisma.salaryCycle.update({
    where: { id: cycleId },
    data: { status: 'payment_pending', householdPaymentId: order.orderId },
  });

  return {
    orderId: order.orderId,
    paymentSessionId: order.paymentSessionId,
    amount: cycle.householdTotal,
  };
}

export async function processDailyBookingPayment(bookingId: string, userId: string) {
  const booking = await prisma.dailyBooking.findUnique({
    where: { id: bookingId },
    include: { household: { include: { user: true } } },
  });
  if (!booking) throw new NotFoundError('Booking not found');
  if (booking.household.userId !== userId) throw new BadRequestError('Not your booking');
  if (booking.paymentStatus !== 'pending') throw new BadRequestError('Payment already initiated');

  const orderId = `daily_${bookingId}_${Date.now()}`;
  const user = booking.household.user;

  const order = await cashfree.createOrder({
    orderId,
    amount: booking.totalAmount,
    customerId: userId,
    customerPhone: user.phone,
    customerEmail: user.email ?? undefined,
    returnUrl: `${env.APP_BASE_URL}/payment/status?order_id=${orderId}`,
    notifyUrl: `${env.APP_BASE_URL}/v1/payments/webhooks/cashfree`,
    orderNote: `Daily booking - ${bookingId}`,
  });

  await prisma.transaction.create({
    data: {
      type: 'daily_booking_payment',
      fromUserId: userId,
      amount: booking.totalAmount * 100,
      dailyBookingId: bookingId,
      bookingType: 'daily',
      cfOrderId: order.orderId,
      paymentSessionId: order.paymentSessionId,
      status: 'pending',
    },
  });

  await prisma.dailyBooking.update({
    where: { id: bookingId },
    data: { paymentStatus: 'authorized', paymentId: order.orderId },
  });

  return {
    orderId: order.orderId,
    paymentSessionId: order.paymentSessionId,
    amount: booking.totalAmount,
  };
}

export async function initiateHelperPayout(cycleId: string) {
  const cycle = await prisma.salaryCycle.findUnique({
    where: { id: cycleId },
    include: { helper: { include: { user: true } } },
  });
  if (!cycle) throw new NotFoundError('Salary cycle not found');
  if (cycle.status !== 'payment_collected') {
    throw new BadRequestError('Payment not yet collected from household');
  }

  const transferId = `payout_${cycleId}_${Date.now()}`;
  const helperUser = cycle.helper.user;

  const result = await cashfree.initiatePayout({
    transferId,
    amount: cycle.helperPayout,
    beneficiaryName: helperUser.fullName ?? 'Helper',
    beneficiaryPhone: helperUser.phone,
    remarks: `HomeHelp salary ${cycle.cycleMonth.toISOString().slice(0, 7)}`,
  });

  await prisma.transaction.create({
    data: {
      type: 'monthly_salary_payout',
      toUserId: cycle.helper.userId,
      amount: cycle.helperPayout * 100,
      salaryCycleId: cycleId,
      monthlyBookingId: cycle.monthlyBookingId,
      bookingType: 'monthly',
      cfTransferId: result.transferId,
      status: result.status === 'SUCCESS' ? 'completed' : 'processing',
    },
  });

  const newStatus = result.status === 'SUCCESS' ? 'payout_completed' : 'payout_initiated';
  await prisma.salaryCycle.update({
    where: { id: cycleId },
    data: {
      status: newStatus,
      helperPayoutId: result.transferId,
      ...(newStatus === 'payout_completed' ? { payoutCompletedAt: new Date() } : {}),
    },
  });

  return result;
}

// Cashfree webhook handler
export async function handleWebhook(eventType: string, data: any) {
  switch (eventType) {
    case 'PAYMENT_SUCCESS_WEBHOOK': {
      const orderId = data.order?.order_id;
      if (!orderId) break;

      const tx = await prisma.transaction.findFirst({ where: { cfOrderId: orderId } });
      if (!tx) break;

      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: 'completed',
          cfPaymentId: data.payment?.cf_payment_id,
          paymentMethod: data.payment?.payment_method?.type,
        },
      });

      // Update salary cycle or daily booking
      if (tx.salaryCycleId) {
        await prisma.salaryCycle.update({
          where: { id: tx.salaryCycleId },
          data: { status: 'payment_collected', paymentCollectedAt: new Date() },
        });
        // Auto-initiate payout
        await initiateHelperPayout(tx.salaryCycleId);
      }
      if (tx.dailyBookingId) {
        await prisma.dailyBooking.update({
          where: { id: tx.dailyBookingId },
          data: { paymentStatus: 'captured' },
        });
      }
      break;
    }

    case 'PAYMENT_FAILED_WEBHOOK': {
      const orderId = data.order?.order_id;
      if (!orderId) break;

      const tx = await prisma.transaction.findFirst({ where: { cfOrderId: orderId } });
      if (!tx) break;

      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: 'failed', failureReason: data.payment?.payment_message },
      });

      if (tx.salaryCycleId) {
        await prisma.salaryCycle.update({
          where: { id: tx.salaryCycleId },
          data: { status: 'failed' },
        });
      }
      if (tx.dailyBookingId) {
        await prisma.dailyBooking.update({
          where: { id: tx.dailyBookingId },
          data: { paymentStatus: 'failed' },
        });
      }
      break;
    }

    case 'TRANSFER_SUCCESS': {
      const transferId = data.transfer?.transfer_id;
      if (!transferId) break;

      const tx = await prisma.transaction.findFirst({ where: { cfTransferId: transferId } });
      if (!tx) break;

      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: 'completed' },
      });

      if (tx.salaryCycleId) {
        await prisma.salaryCycle.update({
          where: { id: tx.salaryCycleId },
          data: { status: 'payout_completed', payoutCompletedAt: new Date() },
        });
      }
      break;
    }

    case 'TRANSFER_FAILED': {
      const transferId = data.transfer?.transfer_id;
      if (!transferId) break;

      const tx = await prisma.transaction.findFirst({ where: { cfTransferId: transferId } });
      if (!tx) break;

      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: 'failed', failureReason: data.transfer?.reason },
      });
      break;
    }
  }
}
