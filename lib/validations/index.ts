import { z } from "zod";

// ─── Customer ─────────────────────────────────────────────────────────────────
export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").trim(),
  phone: z
    .string()
    .max(15, "Phone too long")
    .regex(/^[0-9+\-\s]*$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  address: z.string().max(500, "Address too long").optional().or(z.literal("")),
  village: z.string().max(100, "Village too long").optional().or(z.literal("")),
  notes: z.string().max(1000, "Notes too long").optional().or(z.literal("")),
  openingBalance: z.preprocess((v) => Number(v), z.number().default(0)),
});

export const updateCustomerSchema = createCustomerSchema.extend({
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// ─── Transaction ─────────────────────────────────────────────────────────────
export const transactionItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.preprocess((v) => Number(v), z.number().positive()),
  unit: z.string().min(1),
  rate: z.preprocess((v) => Number(v), z.number().nonnegative()),
  total: z.preprocess((v) => Number(v), z.number().nonnegative()),
});

export const createTransactionSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  type: z.enum(["SALE", "PAYMENT", "ADJUSTMENT"]),
  amount: z.preprocess(
    (v) => Number(v),
    z.number().positive("Amount must be positive").max(99999999, "Amount too large")
  ),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description too long")
    .trim(),
  notes: z.string().max(1000, "Notes too long").optional().or(z.literal("")),
  referenceNumber: z
    .string()
    .max(50, "Reference too long")
    .optional()
    .or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  items: z.array(transactionItemSchema).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

// ─── Business Settings ────────────────────────────────────────────────────────
export const businessSettingsSchema = z.object({
  businessName: z.string().min(1, "Business name required").max(100).trim(),
  ownerName: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  phone: z.string().max(15).optional().or(z.literal("")),
  gstNumber: z.string().max(20).optional().or(z.literal("")),
  upiId: z.string().max(100).optional().or(z.literal("")),
  bankName: z.string().max(100).optional().or(z.literal("")),
  bankAccount: z.string().max(30).optional().or(z.literal("")),
  bankIfsc: z.string().max(15).optional().or(z.literal("")),
  footerMessage: z.string().max(500).optional().or(z.literal("")),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;

// ─── Report Filters ───────────────────────────────────────────────────────────
export const reportFilterSchema = z.object({
  period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  customerId: z.string().optional(),
});

export type ReportFilterInput = z.infer<typeof reportFilterSchema>;

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
