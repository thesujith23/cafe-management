import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(200);
const phone = z.string().trim().max(20).optional().default('');

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(200),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password: z.string().min(8).max(200),
  role: z.enum(['owner', 'counter', 'kitchen', 'display']).optional().default('counter'),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: email.optional(),
  role: z.enum(['owner', 'counter', 'kitchen', 'display']).optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'Nothing to update' });

const cartItemSchema = z.object({
  menuItemId: z.string().max(64).optional(),
  name: z.string().trim().max(120).optional(),
  quantity: z.coerce.number().int().min(1).max(20).optional().default(1),
  selectedSizeId: z.string().max(64).optional(),
  selectedSizeName: z.string().max(80).optional(),
  selectedAddonIds: z.array(z.string().max(64)).max(20).optional(),
  customizations: z.array(z.record(z.string(), z.unknown())).max(20).optional(),
  specialInstructions: z.string().max(300).optional().default(''),
}).refine((item) => item.menuItemId || item.name, { message: 'Each item needs a menu id or a name' });

export const orderCreateSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(30),
  customerNotes: z.string().max(500).optional().default(''),
  customerName: z.string().trim().max(80).optional().default(''),
  customerPhone: z.string().trim().max(20).optional().default(''),
});

export const orderCancelSchema = z.object({
  reason: z.string().max(300).optional().default(''),
  tableToken: z.string().max(200).optional(),
  isStaffOverride: z.boolean().optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum(['new', 'confirmed', 'accepted', 'preparing', 'ready', 'completed', 'served', 'cancelled']),
  reason: z.string().max(300).optional(),
  cancellationReason: z.string().max(300).optional(),
});

export const orderItemSchema = z.object({
  isDone: z.boolean().optional(),
});

export const paymentCreateSchema = z.object({
  tableToken: z.string().max(200).optional(),
});

export const paymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(3).max(200),
  razorpay_payment_id: z.string().min(3).max(200),
  razorpay_signature: z.string().max(400).optional(),
  tableToken: z.string().max(200).optional(),
});

export const tableStatusSchema = z.object({
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']),
  customerName: z.string().trim().max(80).optional(),
  customerPhone: z.string().trim().max(20).optional(),
  guests: z.coerce.number().int().min(1).max(20).optional(),
});

export const reservationSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  customerPhone: z.string().trim().regex(/^[+\d\s().-]{7,20}$/, 'Enter a phone number we can use'),
  guests: z.coerce.number().int().min(1).max(8),
  startsAt: z.string().max(60),
  notes: z.string().max(300).optional().default(''),
});

export const checkinSchema = z.object({
  customerName: z.string().trim().max(80).optional().default(''),
  customerPhone: phone,
  guests: z.coerce.number().int().min(1).max(20).optional().default(1),
});

export const chatSchema = z.object({
  message: z.string().trim().min(1).max(500),
});

export const menuItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500).optional().default(''),
  price: z.coerce.number().min(0).max(100000),
  category: z.string().max(64).optional(),
  isVeg: z.boolean().optional(),
  prepTime: z.coerce.number().int().min(0).max(240).optional(),
  isAvailable: z.boolean().optional(),
  discountPercent: z.coerce.number().min(0).max(90).optional(),
}).catchall(z.unknown());
