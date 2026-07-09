import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "البريد/الجوال مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().min(7, "رقم الجوال غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  city: z.string().optional(),
});

export const createTripSchema = z.object({
  userId: z.string().min(1),
  serviceType: z.string().optional(),
  fromAddress: z.string().min(1, "عنوان الانطلاق مطلوب"),
  toAddress: z.string().min(1, "عنوان الوجهة مطلوب"),
  distance: z.number().optional(),
  duration: z.number().optional(),
  price: z.number().optional(),
  paymentMethod: z.string().optional(),
  fromLat: z.number().optional(),
  fromLng: z.number().optional(),
  toLat: z.number().optional(),
  toLng: z.number().optional(),
  fromCity: z.string().optional(),
  toCity: z.string().optional(),
  surgeMultiplier: z.number().optional(),
  basePrice: z.number().optional(),
});

export const walletSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["deposit", "refund", "trip_payment_refund", "topup", "trip_earnings", "bonus", "withdrawal", "trip_payment", "fee", "commission"]),
  amount: z.number().positive("المبلغ يجب أن يكون موجباً"),
  description: z.string().optional(),
  tripId: z.string().optional(),
});
