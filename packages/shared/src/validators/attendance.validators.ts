import { z } from 'zod';

export const checkInSchema = z.object({
  bookingId: z.string().uuid(),
  bookingType: z.enum(['monthly', 'daily']),
  visitNumber: z.number().int().min(1).default(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const checkOutSchema = z.object({
  attendanceId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const confirmAttendanceSchema = z.object({
  attendanceId: z.string().uuid(),
  confirmed: z.boolean(),
});

export const overrideAttendanceSchema = z.object({
  status: z.enum(['checked_in', 'completed', 'absent', 'late', 'leave']),
  reason: z.string().min(1).max(300),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type ConfirmAttendanceInput = z.infer<typeof confirmAttendanceSchema>;
export type OverrideAttendanceInput = z.infer<typeof overrideAttendanceSchema>;
