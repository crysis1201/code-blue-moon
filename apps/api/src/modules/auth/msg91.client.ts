import { env } from '../../config/env.js';
import { BadRequestError } from '../../common/errors/index.js';

const BASE_URL = 'https://control.msg91.com/api/v5';

export async function sendOtp(phone: string): Promise<void> {
  if (env.isDev) {
    console.log(`[DEV] OTP for ${phone}: 123456`);
    return;
  }

  const response = await fetch(`${BASE_URL}/otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: env.MSG91_AUTH_KEY,
    },
    body: JSON.stringify({
      template_id: env.MSG91_TEMPLATE_ID,
      mobile: phone,
      sender: env.MSG91_SENDER_ID,
    }),
  });

  const data = await response.json() as { type: string; message: string };

  if (data.type === 'error') {
    throw new BadRequestError(`OTP send failed: ${data.message}`, 'OTP_SEND_FAILED');
  }
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  if (env.isDev) {
    return otp === '123456';
  }

  const url = `${BASE_URL}/otp/verify?mobile=${phone}&otp=${otp}&authkey=${env.MSG91_AUTH_KEY}`;
  const response = await fetch(url);
  const data = await response.json() as { type: string; message: string };

  return data.type === 'success';
}
