import { z } from 'zod';

// Contact validation
export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['CUSTOMER', 'VENDOR', 'BOTH']),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  mobile: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().default('India'),
  pincode: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

// Category validation
export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional().nullable(),
});

// Product validation
export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  type: z.enum(['GOODS', 'SERVICE', 'COMBO']),
  salesPrice: z.coerce.number().min(0, 'Sales price must be non-negative'),
  costPrice: z.coerce.number().min(0, 'Cost price must be non-negative'),
  categoryId: z.coerce.number().int().positive('Category is required'),
  imageUrl: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  allowPartialPayment: z.boolean().optional().nullable(),
  defaultDueDate: z.string().optional().nullable(),
});

// Account validation
export const accountSchema = z.object({
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(2, 'Account name must be at least 2 characters'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE', 'OTHER_EXPENSE']),
  parentId: z.coerce.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

// Journal validation
export const journalSchema = z.object({
  name: z.string().min(2, 'Journal name must be at least 2 characters'),
  code: z.string().min(1, 'Journal code is required'),
  type: z.enum(['SALES', 'PURCHASE', 'BANK', 'CASH', 'GENERAL']),
  defaultDebitAccountId: z.coerce.number().int().positive().optional().nullable(),
  defaultCreditAccountId: z.coerce.number().int().positive().optional().nullable(),
});

// Analytic Account validation
export const analyticAccountSchema = z.object({
  name: z.string().min(2, 'Analytic account name must be at least 2 characters'),
  type: z.enum(['INCOME', 'EXPENSE']),
  isActive: z.boolean().default(true),
});
