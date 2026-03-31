import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { env } from '../../config/env.js';

// Initialize Cashfree SDK instance
const cfEnv = env.CASHFREE_ENV === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
const cashfreeClient = new Cashfree(cfEnv, env.CASHFREE_APP_ID, env.CASHFREE_SECRET_KEY);

export interface CreateOrderParams {
  orderId: string;
  amount: number;
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
  returnUrl: string;
  notifyUrl: string;
  orderNote?: string;
}

export interface PayoutParams {
  transferId: string;
  amount: number;
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryVpa?: string;
  beneficiaryAccountNumber?: string;
  beneficiaryIfsc?: string;
  remarks?: string;
}

export async function createOrder(params: CreateOrderParams) {
  if (env.isDev) {
    return {
      orderId: params.orderId,
      paymentSessionId: `dev_session_${params.orderId}`,
      orderStatus: 'ACTIVE',
    };
  }

  const request = {
    order_id: params.orderId,
    order_amount: params.amount,
    order_currency: 'INR',
    customer_details: {
      customer_id: params.customerId,
      customer_phone: params.customerPhone,
      customer_email: params.customerEmail,
    },
    order_meta: {
      return_url: params.returnUrl,
      notify_url: params.notifyUrl,
    },
    order_note: params.orderNote,
  };

  const response = await cashfreeClient.PGCreateOrder(request);
  const data = response.data as any;

  return {
    orderId: data.order_id,
    paymentSessionId: data.payment_session_id,
    orderStatus: data.order_status,
  };
}

export async function getOrderStatus(orderId: string) {
  if (env.isDev) {
    return { orderStatus: 'PAID', paymentId: `dev_pay_${orderId}` };
  }

  const response = await cashfreeClient.PGOrderFetchPayments(orderId);
  const payments = (response.data as any) || [];
  const successPayment = payments.find((p: any) => p.payment_status === 'SUCCESS');

  return {
    orderStatus: successPayment ? 'PAID' : 'PENDING',
    paymentId: successPayment?.cf_payment_id,
    paymentMethod: successPayment?.payment_method?.type,
  };
}

export async function initiatePayout(params: PayoutParams) {
  if (env.isDev) {
    console.log(`[DEV] Payout ${params.transferId}: ₹${params.amount} to ${params.beneficiaryName}`);
    return { transferId: params.transferId, status: 'SUCCESS' };
  }

  // Cashfree Payouts API (REST, not in the PG SDK)
  const baseUrl = env.CASHFREE_ENV === 'PRODUCTION'
    ? 'https://payout-api.cashfree.com'
    : 'https://payout-gamma.cashfree.com';

  const response = await fetch(`${baseUrl}/payout/v2/directTransfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': env.CASHFREE_APP_ID,
      'x-client-secret': env.CASHFREE_SECRET_KEY,
    },
    body: JSON.stringify({
      transfer_id: params.transferId,
      transfer_amount: params.amount,
      transfer_currency: 'INR',
      transfer_mode: params.beneficiaryVpa ? 'upi' : 'banktransfer',
      beneficiary_details: {
        beneficiary_name: params.beneficiaryName,
        beneficiary_phone: params.beneficiaryPhone,
        beneficiary_vpa: params.beneficiaryVpa,
        beneficiary_account_number: params.beneficiaryAccountNumber,
        beneficiary_ifsc: params.beneficiaryIfsc,
      },
      transfer_remarks: params.remarks,
    }),
  });

  const data = await response.json() as any;
  return {
    transferId: data.transfer_id || params.transferId,
    status: data.status || 'PENDING',
  };
}

export function verifyWebhookSignature(signature: string, rawBody: string, timestamp: string): boolean {
  if (env.isDev) return true;

  try {
    cashfreeClient.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    return true;
  } catch {
    return false;
  }
}
