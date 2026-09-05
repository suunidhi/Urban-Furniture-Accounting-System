import prisma from '../config/db';
import { SequenceService } from './sequenceService';
import { AppError } from '../middleware/errorHandler';
import { OrderStatus, InvoiceStatus, EntryStatus } from '@prisma/client';

export class SalesService {
  // ==================== SALES ORDERS ====================
  static async listSOs(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { soNumber: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }
    return await prisma.salesOrder.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        customer: true,
        lines: { include: { product: true, analyticAccount: true } },
        customerInvoice: { select: { id: true, invoiceNumber: true, status: true } },
      },
    });
  }

  static async getSO(id: number) {
    const so = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: { include: { product: true, analyticAccount: true } },
        customerInvoice: true,
      },
    });
    if (!so) throw new AppError('Sales order not found', 404);
    return so;
  }

  static async createSO(data: {
    customerId: number;
    soDate?: Date | string;
    notes?: string | null;
    lines: Array<{
      productId: number;
      analyticAccountId?: number | null;
      quantity: number;
      unitPrice: number;
      taxRate?: number;
    }>;
  }) {
    const soNumber = await SequenceService.getNextSONumber();

    let subtotal = 0;
    let taxAmount = 0;

    const computedLines = data.lines.map((line) => {
      const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
      const lineTax = (lineSubtotal * (Number(line.taxRate) || 0)) / 100;
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        productId: line.productId,
        analyticAccountId: line.analyticAccountId || null,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate || 0,
        taxAmount: lineTax,
        subtotal: lineSubtotal,
        total: lineTotal,
      };
    });

    const totalAmount = subtotal + taxAmount;

    return await prisma.salesOrder.create({
      data: {
        soNumber,
        customerId: data.customerId,
        soDate: data.soDate ? new Date(data.soDate) : new Date(),
        status: OrderStatus.DRAFT,
        notes: data.notes || null,
        subtotal,
        taxAmount,
        totalAmount,
        lines: {
          create: computedLines,
        },
      },
      include: {
        customer: true,
        lines: { include: { product: true } },
      },
    });
  }

  static async confirmSO(id: number) {
    const so = await prisma.salesOrder.findUnique({ where: { id } });
    if (!so) throw new AppError('Sales order not found', 404);
    if (so.status !== OrderStatus.DRAFT) {
      throw new AppError(`Cannot confirm a sales order with status ${so.status}`, 400);
    }

    return await prisma.salesOrder.update({
      where: { id },
      data: { status: OrderStatus.CONFIRMED },
      include: { customer: true, lines: true },
    });
  }

  static async convertSOToInvoice(soId: number) {
    const so = await prisma.salesOrder.findUnique({
      where: { id: soId },
      include: {
        customer: true,
        lines: { include: { product: true } },
        customerInvoice: true,
      },
    });

    if (!so) throw new AppError('Sales order not found', 404);
    if (so.customerInvoice) {
      throw new AppError(`Invoice ${so.customerInvoice.invoiceNumber} already exists for this SO.`, 400);
    }

    // Default Sales Journal
    const salesJournal = await prisma.journal.findFirst({
      where: { type: 'SALES' },
    });
    if (!salesJournal) {
      throw new AppError('No default Sales Journal configured in the system.', 400);
    }

    // Default Sales Account (4000)
    const salesAccount = await prisma.account.findFirst({
      where: { code: '4000' },
    });
    if (!salesAccount) {
      throw new AppError('Default Sales Income Account (4000) not found in CoA.', 400);
    }

    const invoiceNumber = await SequenceService.getNextInvoiceNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15); // 15 days default invoice terms

    let subtotal = 0;
    let taxAmount = 0;

    const invoiceLinesData = so.lines.map((l) => {
      const lineSubtotal = Number(l.subtotal);
      const lineTax = Number(l.taxAmount);
      const lineTotal = Number(l.total);

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        productId: l.productId,
        description: `Sale of ${l.product.name}`,
        accountId: salesAccount.id,
        analyticAccountId: l.analyticAccountId || null,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
        taxAmount: lineTax,
        subtotal: lineSubtotal,
        total: lineTotal,
      };
    });

    const totalAmount = subtotal + taxAmount;

    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.customerInvoice.create({
        data: {
          invoiceNumber,
          reference: so.soNumber,
          customerId: so.customerId,
          invoiceDate: new Date(),
          dueDate,
          paymentTerms: 'Immediate',
          journalId: salesJournal.id,
          salesOrderId: so.id,
          status: InvoiceStatus.DRAFT,
          subtotal,
          taxAmount,
          totalAmount,
          paidAmount: 0,
          amountDue: totalAmount,
          lines: {
            create: invoiceLinesData,
          },
        },
        include: {
          customer: true,
          lines: { include: { product: true, account: true, analyticAccount: true } },
          salesOrder: true,
        },
      });

      await tx.salesOrder.update({
        where: { id: so.id },
        data: { status: OrderStatus.INVOICED },
      });

      return invoice;
    });
  }

  // ==================== CUSTOMER INVOICES ====================
  static async listInvoices(filter?: { status?: string; customerId?: number; search?: string }) {
    const where: any = {};
    if (filter?.status && filter.status !== 'ALL') {
      where.status = filter.status as InvoiceStatus;
    }
    if (filter?.customerId) {
      where.customerId = Number(filter.customerId);
    }
    if (filter?.search) {
      where.OR = [
        { invoiceNumber: { contains: filter.search } },
        { reference: { contains: filter.search } },
        { customer: { name: { contains: filter.search } } },
      ];
    }

    return await prisma.customerInvoice.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        customer: true,
        journal: true,
        salesOrder: { select: { id: true, soNumber: true } },
        lines: { include: { product: true, account: true, analyticAccount: true } },
        allocations: { include: { payment: true } },
        journalEntry: { select: { id: true, entryNumber: true, status: true } },
      },
    });
  }

  static async getInvoice(id: number) {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id },
      include: {
        customer: true,
        journal: true,
        salesOrder: true,
        lines: { include: { product: true, account: true, analyticAccount: true } },
        allocations: { include: { payment: true } },
        journalEntry: {
          include: {
            items: { include: { account: true, partner: true, analyticAccount: true } },
          },
        },
      },
    });
    if (!invoice) throw new AppError('Customer invoice not found', 404);
    return invoice;
  }

  static async createInvoice(data: {
    customerId: number;
    invoiceDate?: Date | string;
    dueDate: Date | string;
    paymentTerms?: string | null;
    journalId: number;
    reference?: string | null;
    salesOrderId?: number | null;
    ocrRawData?: string | null;
    lines: Array<{
      productId: number;
      description?: string | null;
      accountId: number;
      analyticAccountId?: number | null;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>;
  }) {
    const invoiceNumber = await SequenceService.getNextInvoiceNumber();

    let subtotal = 0;
    let taxAmount = 0;

    const computedLines = data.lines.map((l) => {
      const lineSubtotal = Number(l.quantity) * Number(l.unitPrice);
      const lineTax = (lineSubtotal * (Number(l.taxRate) || 0)) / 100;
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        productId: l.productId,
        description: l.description || null,
        accountId: l.accountId,
        analyticAccountId: l.analyticAccountId || null,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate || 0,
        taxAmount: lineTax,
        subtotal: lineSubtotal,
        total: lineTotal,
      };
    });

    const totalAmount = subtotal + taxAmount;

    return await prisma.customerInvoice.create({
      data: {
        invoiceNumber,
        reference: data.reference || null,
        customerId: data.customerId,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
        dueDate: new Date(data.dueDate),
        paymentTerms: data.paymentTerms || 'Immediate',
        journalId: data.journalId,
        salesOrderId: data.salesOrderId || null,
        status: InvoiceStatus.DRAFT,
        subtotal,
        taxAmount,
        totalAmount,
        paidAmount: 0,
        amountDue: totalAmount,
        ocrRawData: data.ocrRawData || null,
        lines: {
          create: computedLines,
        },
      },
      include: {
        customer: true,
        journal: true,
        lines: { include: { product: true, account: true, analyticAccount: true } },
      },
    });
  }

  static async updateInvoice(invoiceId: number, userRole: string, data: {
    invoiceDate?: Date | string;
    dueDate?: Date | string;
    paymentTerms?: string | null;
    journalId?: number;
    reference?: string | null;
    lines?: Array<{
      id?: number;
      productId: number;
      description?: string | null;
      accountId: number;
      analyticAccountId?: number | null;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>;
  }) {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: invoiceId },
      include: { lines: true },
    });

    if (!invoice) throw new AppError('Customer invoice not found', 404);

    if (invoice.status === InvoiceStatus.POSTED || invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.PARTIALLY_PAID || invoice.status === InvoiceStatus.CANCELLED) {
      throw new AppError(`Cannot edit an invoice with status ${invoice.status}`, 400);
    }

    if (invoice.status === InvoiceStatus.PENDING_APPROVAL && userRole !== 'ADMIN') {
      throw new AppError('Only Admin can edit invoices pending approval', 403);
    }

    return await prisma.$transaction(async (tx) => {
      let subtotal = Number(invoice.subtotal);
      let taxAmount = Number(invoice.taxAmount);
      let totalAmount = Number(invoice.totalAmount);

      if (data.lines) {
        await tx.customerInvoiceLine.deleteMany({ where: { customerInvoiceId: invoiceId } });

        subtotal = 0;
        taxAmount = 0;

        const computedLines = data.lines.map((l) => {
          const lineSubtotal = Number(l.quantity) * Number(l.unitPrice);
          const lineTax = (lineSubtotal * (Number(l.taxRate) || 0)) / 100;
          const lineTotal = lineSubtotal + lineTax;

          subtotal += lineSubtotal;
          taxAmount += lineTax;

          return {
            productId: l.productId,
            description: l.description || null,
            accountId: l.accountId,
            analyticAccountId: l.analyticAccountId || null,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate || 0,
            taxAmount: lineTax,
            subtotal: lineSubtotal,
            total: lineTotal,
          };
        });

        totalAmount = subtotal + taxAmount;

        await tx.customerInvoice.update({
          where: { id: invoiceId },
          data: {
            lines: {
              create: computedLines,
            },
          },
        });
      }

      return await tx.customerInvoice.update({
        where: { id: invoiceId },
        data: {
          reference: data.reference !== undefined ? data.reference : undefined,
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          paymentTerms: data.paymentTerms !== undefined ? data.paymentTerms : undefined,
          journalId: data.journalId !== undefined ? data.journalId : undefined,
          subtotal,
          taxAmount,
          totalAmount,
          amountDue: totalAmount, // Assuming no payments made yet
        },
        include: {
          customer: true,
          journal: true,
          lines: { include: { product: true, account: true, analyticAccount: true } },
        },
      });
    });
  }

  static async submitForApproval(invoiceId: number) {
    const invoice = await prisma.customerInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new AppError('Customer invoice not found', 404);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new AppError(`Cannot submit an invoice with status ${invoice.status}`, 400);
    }

    return await prisma.customerInvoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.PENDING_APPROVAL },
    });
  }

  // ==================== POST CUSTOMER INVOICE (STRICT DOUBLE-ENTRY) ====================
  static async postInvoice(invoiceId: number) {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        journal: true,
        lines: { include: { product: true, account: true, analyticAccount: true } },
        journalEntry: true,
      },
    });

    if (!invoice) throw new AppError('Customer invoice not found', 404);
    if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.PENDING_APPROVAL) {
      throw new AppError(`Cannot post an invoice with status ${invoice.status}`, 400);
    }
    if (!invoice.lines || invoice.lines.length === 0) {
      throw new AppError('Cannot post an invoice with no line items.', 400);
    }

    // Find Debtors / Accounts Receivable account (1100)
    const debtorsAccount = await prisma.account.findFirst({
      where: { code: '1100' },
    });
    if (!debtorsAccount) {
      throw new AppError('Debtors account (code 1100) not configured in Chart of Accounts.', 400);
    }

    // Find Output Tax / GST Payable account (2100) if tax > 0
    let taxPayableAccount: any = null;
    const totalTax = Number(invoice.taxAmount);
    if (totalTax > 0) {
      taxPayableAccount = await prisma.account.findFirst({
        where: { code: '2100' },
      });
      if (!taxPayableAccount) {
        throw new AppError('Tax Payable account (code 2100) not configured in Chart of Accounts.', 400);
      }
    }

    const entryNumber = await SequenceService.getNextJournalEntryNumber();

    // Prepare journal items:
    // 1. Debit: Debtors (Accounts Receivable) for the full Invoice Total
    const journalItemsData: any[] = [];
    const totalDebit = Number(invoice.totalAmount);

    journalItemsData.push({
      accountId: debtorsAccount.id,
      partnerId: invoice.customerId,
      analyticAccountId: null,
      description: `Invoice ${invoice.invoiceNumber} - ${invoice.customer.name}`,
      debit: totalDebit,
      credit: 0,
    });

    // 2. Credit: Sales Income account for each line item (linked to product & analytic account)
    let totalCredit = 0;
    for (const line of invoice.lines) {
      const lineSubtotal = Number(line.subtotal);
      totalCredit += lineSubtotal;
      journalItemsData.push({
        accountId: line.accountId,
        partnerId: invoice.customerId,
        analyticAccountId: line.analyticAccountId || null,
        description: line.description || `Sale - ${line.product.name}`,
        debit: 0,
        credit: lineSubtotal,
      });
    }

    // 3. Credit: Tax Payable (if tax > 0)
    if (totalTax > 0 && taxPayableAccount) {
      totalCredit += totalTax;
      journalItemsData.push({
        accountId: taxPayableAccount.id,
        partnerId: invoice.customerId,
        analyticAccountId: null,
        description: `Output GST for ${invoice.invoiceNumber}`,
        debit: 0,
        credit: totalTax,
      });
    }

    // Verify non-negotiable double-entry rule: Debit == Credit
    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.01) {
      throw new AppError(
        `Accounting Error: Unbalanced journal entry! Total Debit (₹${totalDebit}) must equal Total Credit (₹${totalCredit}).`,
        400
      );
    }

    // Atomic database transaction
    return await prisma.$transaction(async (tx) => {
      // Create Journal Entry
      const entry = await tx.journalEntry.create({
        data: {
          entryNumber,
          date: invoice.invoiceDate,
          journalId: invoice.journalId,
          status: EntryStatus.POSTED,
          reference: invoice.invoiceNumber,
          sourceType: 'CUSTOMER_INVOICE',
          sourceId: invoice.id,
          customerInvoiceId: invoice.id,
          totalDebit,
          totalCredit,
          items: {
            create: journalItemsData,
          },
        },
      });

      // Update Invoice status to POSTED
      const updatedInvoice = await tx.customerInvoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.POSTED },
        include: {
          customer: true,
          journal: true,
          lines: true,
          journalEntry: { include: { items: true } },
        },
      });

      return updatedInvoice;
    });
  }
}
