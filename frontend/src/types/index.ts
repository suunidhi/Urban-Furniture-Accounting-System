export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'CONTACT_USER';
export type RecordStatus = 'ACTIVE' | 'ARCHIVED';
export type ContactType = 'CUSTOMER' | 'VENDOR' | 'BOTH';
export type ProductType = 'GOODS' | 'SERVICE' | 'COMBO';
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE' | 'OTHER_EXPENSE';
export type JournalType = 'SALES' | 'PURCHASE' | 'BANK' | 'CASH' | 'GENERAL';
export type AnalyticType = 'INCOME' | 'EXPENSE';
export type BudgetStatus = 'DRAFT' | 'CONFIRMED' | 'REVISED' | 'CANCELLED';
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'BILLED' | 'INVOICED' | 'CANCELLED';
export type InvoiceStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'POSTED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type PaymentType = 'CUSTOMER' | 'VENDOR';
export type PaymentMethod = 'CASH' | 'BANK';
export type PaymentStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';
export type EntryStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export interface User {
  id: number;
  loginId: string;
  name: string;
  email: string;
  role: UserRole;
  status: RecordStatus;
  contactId?: number | null;
  contact?: Contact | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: number;
  name: string;
  type: ContactType;
  email?: string | null;
  mobile?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  imageUrl?: string | null;
  status: RecordStatus;
  user?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string | null;
}

export interface Product {
  id: number;
  name: string;
  type: ProductType;
  salesPrice: string | number;
  costPrice: string | number;
  categoryId: number;
  category?: ProductCategory;
  imageUrl?: string | null;
  status: RecordStatus;
  paymentTerms?: string | null;
  allowPartialPayment?: boolean;
  defaultDueDate?: string | null;
}

export interface Account {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  parentId?: number | null;
  parent?: Account | null;
  isActive: boolean;
  balance?: number | string;
}

export interface Journal {
  id: number;
  name: string;
  code: string;
  type: JournalType;
  defaultDebitAccountId?: number | null;
  defaultDebitAccount?: Account | null;
  defaultCreditAccountId?: number | null;
  defaultCreditAccount?: Account | null;
}

export interface AnalyticAccount {
  id: number;
  name: string;
  type: AnalyticType;
  isActive: boolean;
}

export interface Budget {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  responsibleId?: number | null;
  responsibleContact?: Contact | null;
  analyticAccountId: number;
  analyticAccount?: AnalyticAccount;
  type: AnalyticType;
  committedAmount: string | number;
  achievedAmount?: string | number;
  achievedPercentage?: string | number;
  amountToAchieve?: string | number;
  status: BudgetStatus;
  notes?: string | null;
  originalBudgetId?: number | null;
  originalBudget?: Budget | null;
  revisedBudgets?: Budget[];
}

export interface PurchaseOrderLine {
  id?: number;
  productId: number;
  product?: Product;
  analyticAccountId?: number | null;
  analyticAccount?: AnalyticAccount | null;
  quantity: number | string;
  unitPrice: number | string;
  total: number | string;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  vendorId: number;
  vendor?: Contact;
  poDate: string;
  paymentTerms?: string | null;
  status: OrderStatus;
  notes?: string | null;
  totalAmount: number | string;
  lines?: PurchaseOrderLine[];
  vendorBill?: VendorBill | null;
}

export interface VendorBillLine {
  id?: number;
  productId: number;
  product?: Product;
  description?: string;
  accountId: number;
  account?: Account;
  analyticAccountId?: number | null;
  analyticAccount?: AnalyticAccount | null;
  quantity: number | string;
  unitPrice: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  subtotal: number | string;
  total: number | string;
}

export interface VendorBill {
  id: number;
  billNumber: string;
  reference?: string | null;
  vendorId: number;
  vendor?: Contact;
  billDate: string;
  accountingDate: string;
  dueDate: string;
  paymentTerms?: string | null;
  journalId: number;
  journal?: Journal;
  purchaseOrderId?: number | null;
  purchaseOrder?: PurchaseOrder | null;
  status: InvoiceStatus;
  subtotal: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  paidAmount: number | string;
  amountDue: number | string;
  ocrRawData?: string | null;
  lines?: VendorBillLine[];
  journalEntry?: JournalEntry | null;
  allocations?: PaymentAllocation[];
}

export interface SalesOrderLine {
  id?: number;
  productId: number;
  product?: Product;
  analyticAccountId?: number | null;
  analyticAccount?: AnalyticAccount | null;
  quantity: number | string;
  unitPrice: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  subtotal: number | string;
  total: number | string;
}

export interface SalesOrder {
  id: number;
  soNumber: string;
  customerId: number;
  customer?: Contact;
  soDate: string;
  status: OrderStatus;
  notes?: string | null;
  subtotal: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  lines?: SalesOrderLine[];
  customerInvoice?: CustomerInvoice | null;
}

export interface CustomerInvoiceLine {
  id?: number;
  productId: number;
  product?: Product;
  description?: string;
  accountId: number;
  account?: Account;
  analyticAccountId?: number | null;
  analyticAccount?: AnalyticAccount | null;
  quantity: number | string;
  unitPrice: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  subtotal: number | string;
  total: number | string;
}

export interface CustomerInvoice {
  id: number;
  invoiceNumber: string;
  reference?: string | null;
  customerId: number;
  customer?: Contact;
  invoiceDate: string;
  dueDate: string;
  paymentTerms?: string | null;
  journalId: number;
  journal?: Journal;
  salesOrderId?: number | null;
  salesOrder?: SalesOrder | null;
  status: InvoiceStatus;
  subtotal: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  paidAmount: number | string;
  amountDue: number | string;
  ocrRawData?: string | null;
  lines?: CustomerInvoiceLine[];
  journalEntry?: JournalEntry | null;
  allocations?: PaymentAllocation[];
}

export interface PaymentAllocation {
  id: number;
  paymentId: number;
  customerInvoiceId?: number | null;
  vendorBillId?: number | null;
  amountAllocated: number | string;
}

export interface Payment {
  id: number;
  paymentNumber: string;
  type: PaymentType;
  partnerId: number;
  partner?: Contact;
  amount: number | string;
  paymentMethod: PaymentMethod;
  journalId: number;
  journal?: Journal;
  paymentDate: string;
  reference?: string | null;
  status: PaymentStatus;
  notes?: string | null;
  allocations?: PaymentAllocation[];
  journalEntry?: JournalEntry | null;
}

export interface JournalItem {
  id: number;
  journalEntryId: number;
  accountId: number;
  account?: Account;
  partnerId?: number | null;
  partner?: Contact | null;
  analyticAccountId?: number | null;
  analyticAccount?: AnalyticAccount | null;
  description?: string | null;
  debit: number | string;
  credit: number | string;
}

export interface JournalEntry {
  id: number;
  entryNumber: string;
  date: string;
  journalId: number;
  journal?: Journal;
  status: EntryStatus;
  reference?: string | null;
  sourceType?: string | null;
  sourceId?: number | null;
  vendorBillId?: number | null;
  vendorBill?: VendorBill | null;
  customerInvoiceId?: number | null;
  customerInvoice?: CustomerInvoice | null;
  paymentId?: number | null;
  payment?: Payment | null;
  totalDebit: number | string;
  totalCredit: number | string;
  items?: JournalItem[];
}
