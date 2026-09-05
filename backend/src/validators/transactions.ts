import { z } from 'zod';

// Purchase Order Line
export const poLineSchema = z.object({
  productId: z.coerce.number().int().positive('Product is required'),
  analyticAccountId: z.coerce.number().int().positive().optional().nullable(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be non-negative'),
});

// Purchase Order
export const purchaseOrderSchema = z.object({
  vendorId: z.coerce.number().int().positive('Vendor is required'),
  poDate: z.string().or(z.date()).optional(),
  paymentTerms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(poLineSchema).min(1, 'At least one line item is required'),
});

// Vendor Bill Line
export const billLineSchema = z.object({
  productId: z.coerce.number().int().positive('Product is required'),
  description: z.string().optional().nullable(),
  accountId: z.coerce.number().int().positive('Chart of Account is required'),
  analyticAccountId: z.coerce.number().int().positive().optional().nullable(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be non-negative'),
  taxRate: z.coerce.number().min(0).default(0),
});

// Vendor Bill
export const vendorBillSchema = z.object({
  vendorId: z.coerce.number().int().positive('Vendor is required'),
  billDate: z.string().or(z.date()).optional(),
  accountingDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()),
  paymentTerms: z.string().optional().nullable(),
  journalId: z.coerce.number().int().positive('Journal is required'),
  reference: z.string().optional().nullable(),
  purchaseOrderId: z.coerce.number().int().positive().optional().nullable(),
  lines: z.array(billLineSchema).min(1, 'At least one line item is required'),
});

// Sales Order Line
export const soLineSchema = z.object({
  productId: z.coerce.number().int().positive('Product is required'),
  analyticAccountId: z.coerce.number().int().positive().optional().nullable(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be non-negative'),
  taxRate: z.coerce.number().min(0).default(0),
});

// Sales Order
export const salesOrderSchema = z.object({
  customerId: z.coerce.number().int().positive('Customer is required'),
  soDate: z.string().or(z.date()).optional(),
  notes: z.string().optional().nullable(),
  lines: z.array(soLineSchema).min(1, 'At least one line item is required'),
});

// Customer Invoice Line
export const invoiceLineSchema = z.object({
  productId: z.coerce.number().int().positive('Product is required'),
  description: z.string().optional().nullable(),
  accountId: z.coerce.number().int().positive('Chart of Account is required'),
  analyticAccountId: z.coerce.number().int().positive().optional().nullable(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be non-negative'),
  taxRate: z.coerce.number().min(0).default(0),
});

// Customer Invoice
export const customerInvoiceSchema = z.object({
  customerId: z.coerce.number().int().positive('Customer is required'),
  invoiceDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()),
  paymentTerms: z.string().optional().nullable(),
  journalId: z.coerce.number().int().positive('Journal is required'),
  reference: z.string().optional().nullable(),
  salesOrderId: z.coerce.number().int().positive().optional().nullable(),
  lines: z.array(invoiceLineSchema).min(1, 'At least one line item is required'),
});

// Update Customer Invoice
export const updateInvoiceSchema = z.object({
  invoiceDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()).optional(),
  paymentTerms: z.string().optional().nullable(),
  journalId: z.coerce.number().int().positive().optional(),
  reference: z.string().optional().nullable(),
  lines: z.array(invoiceLineSchema).min(1, 'At least one line item is required').optional(),
});

// Payment Registration
export const paymentRegistrationSchema = z.object({
  type: z.enum(['CUSTOMER', 'VENDOR']),
  partnerId: z.coerce.number().int().positive('Partner is required'),
  amount: z.coerce.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'BANK']),
  paymentDate: z.string().or(z.date()).optional(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  invoiceId: z.coerce.number().int().positive().optional().nullable(),
  customerInvoiceId: z.coerce.number().int().positive().optional().nullable(),
  billId: z.coerce.number().int().positive().optional().nullable(),
  vendorBillId: z.coerce.number().int().positive().optional().nullable(),
});
