import prisma from '../config/db';
import { SequenceService } from './sequenceService';
import { AppError } from '../middleware/errorHandler';
import { OrderStatus, InvoiceStatus, EntryStatus } from '@prisma/client';

export class PurchaseService {
  // ==================== PURCHASE ORDERS ====================
  static async listPOs(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { poNumber: { contains: search } },
        { vendor: { name: { contains: search } } },
      ];
    }
    return await prisma.purchaseOrder.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        vendor: true,
        lines: { include: { product: true, analyticAccount: true } },
        vendorBill: { select: { id: true, billNumber: true, status: true } },
      },
    });
  }

  static async getPO(id: number) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        lines: { include: { product: true, analyticAccount: true } },
        vendorBill: true,
      },
    });
    if (!po) {
      throw new AppError('Purchase order not found', 404);
    }
    return po;
  }

  static async createPO(data: {
    vendorId: number;
    poDate?: Date | string;
    paymentTerms?: string | null;
    notes?: string | null;
    lines: Array<{
      productId: number;
      analyticAccountId?: number | null;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    const poNumber = await SequenceService.getNextPONumber();

    let totalAmount = 0;
    const computedLines = data.lines.map((line) => {
      const lineTotal = Number(line.quantity) * Number(line.unitPrice);
      totalAmount += lineTotal;
      return {
        productId: line.productId,
        analyticAccountId: line.analyticAccountId || null,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: lineTotal,
      };
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId: data.vendorId,
        poDate: data.poDate ? new Date(data.poDate) : new Date(),
        paymentTerms: data.paymentTerms || '30 Days',
        status: OrderStatus.DRAFT,
        notes: data.notes || null,
        totalAmount,
        lines: {
          create: computedLines,
        },
      },
      include: {
        vendor: true,
        lines: { include: { product: true } },
      },
    });

    return po;
  }

  static async confirmPO(id: number) {
    const po = await prisma.purchaseOrder.findUnique({ 
      where: { id },
      include: { lines: { include: { product: true } } }
    });
    if (!po) throw new AppError('Purchase order not found', 404);
    if (po.status !== OrderStatus.DRAFT) {
      throw new AppError(`Cannot confirm a purchase order with status ${po.status}`, 400);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Increment stock for GOODS
      for (const line of po.lines) {
        if (line.product.type === 'GOODS') {
          await tx.product.update({
            where: { id: line.productId },
            data: { stockQuantity: { increment: Number(line.quantity) } },
          });
        }
      }

      return await tx.purchaseOrder.update({
        where: { id },
        data: { status: OrderStatus.CONFIRMED },
        include: { vendor: true, lines: true },
      });
    });
  }

  static async convertPOToBill(poId: number) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        vendor: true,
        lines: { include: { product: true } },
        vendorBill: true,
      },
    });

    if (!po) throw new AppError('Purchase order not found', 404);
    if (po.vendorBill) {
      throw new AppError(`Vendor Bill ${po.vendorBill.billNumber} already exists for this PO.`, 400);
    }

    // Default Purchase Journal
    const purchaseJournal = await prisma.journal.findFirst({
      where: { type: 'PURCHASE' },
    });
    if (!purchaseJournal) {
      throw new AppError('No default Purchase Journal configured in the system.', 400);
    }

    // Default Purchase Account (5000)
    const purchaseAccount = await prisma.account.findFirst({
      where: { code: '5000' },
    });
    if (!purchaseAccount) {
      throw new AppError('Default Purchases Expense Account (5000) not found in CoA.', 400);
    }

    const billNumber = await SequenceService.getNextBillNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms default

    let subtotal = 0;
    let taxAmount = 0;

    const billLinesData = po.lines.map((l) => {
      const lineSubtotal = Number(l.quantity) * Number(l.unitPrice);
      subtotal += lineSubtotal;
      return {
        productId: l.productId,
        description: `Purchased: ${l.product.name}`,
        accountId: purchaseAccount.id,
        analyticAccountId: l.analyticAccountId || null,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: 0,
        taxAmount: 0,
        subtotal: lineSubtotal,
        total: lineSubtotal,
      };
    });

    const totalAmount = subtotal + taxAmount;

    return await prisma.$transaction(async (tx) => {
      const bill = await tx.vendorBill.create({
        data: {
          billNumber,
          reference: po.poNumber,
          vendorId: po.vendorId,
          billDate: new Date(),
          accountingDate: new Date(),
          dueDate,
          paymentTerms: po.paymentTerms || '30 Days',
          journalId: purchaseJournal.id,
          purchaseOrderId: po.id,
          status: InvoiceStatus.DRAFT,
          subtotal,
          taxAmount,
          totalAmount,
          paidAmount: 0,
          amountDue: totalAmount,
          lines: {
            create: billLinesData,
          },
        },
        include: {
          vendor: true,
          lines: { include: { product: true, account: true, analyticAccount: true } },
          purchaseOrder: true,
        },
      });

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: OrderStatus.BILLED },
      });

      return bill;
    });
  }

  // ==================== VENDOR BILLS ====================
  static async listBills(filter?: { status?: string; vendorId?: number; search?: string }) {
    const where: any = {};
    if (filter?.status && filter.status !== 'ALL') {
      where.status = filter.status as InvoiceStatus;
    }
    if (filter?.vendorId) {
      where.vendorId = Number(filter.vendorId);
    }
    if (filter?.search) {
      where.OR = [
        { billNumber: { contains: filter.search } },
        { reference: { contains: filter.search } },
        { vendor: { name: { contains: filter.search } } },
      ];
    }

    return await prisma.vendorBill.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        vendor: true,
        journal: true,
        purchaseOrder: { select: { id: true, poNumber: true } },
        lines: { include: { product: true, account: true, analyticAccount: true } },
        allocations: { include: { payment: true } },
        journalEntry: { select: { id: true, entryNumber: true, status: true } },
      },
    });
  }

  static async getBill(id: number) {
    const bill = await prisma.vendorBill.findUnique({
      where: { id },
      include: {
        vendor: true,
        journal: true,
        purchaseOrder: true,
        lines: { include: { product: true, account: true, analyticAccount: true } },
        allocations: { include: { payment: true } },
        journalEntry: {
          include: {
            items: { include: { account: true, partner: true, analyticAccount: true } },
          },
        },
      },
    });
    if (!bill) throw new AppError('Vendor bill not found', 404);
    return bill;
  }

  static async createBill(data: {
    vendorId: number;
    billDate?: Date | string;
    accountingDate?: Date | string;
    dueDate: Date | string;
    paymentTerms?: string | null;
    journalId: number;
    reference?: string | null;
    purchaseOrderId?: number | null;
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
    const billNumber = await SequenceService.getNextBillNumber();

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

    return await prisma.vendorBill.create({
      data: {
        billNumber,
        reference: data.reference || null,
        vendorId: data.vendorId,
        billDate: data.billDate ? new Date(data.billDate) : new Date(),
        accountingDate: data.accountingDate ? new Date(data.accountingDate) : new Date(),
        dueDate: new Date(data.dueDate),
        paymentTerms: data.paymentTerms || '30 Days',
        journalId: data.journalId,
        purchaseOrderId: data.purchaseOrderId || null,
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
        vendor: true,
        journal: true,
        lines: { include: { product: true, account: true, analyticAccount: true } },
      },
    });
  }

  // ==================== POST VENDOR BILL (STRICT DOUBLE-ENTRY) ====================
  static async postBill(billId: number) {
    const bill = await prisma.vendorBill.findUnique({
      where: { id: billId },
      include: {
        vendor: true,
        journal: true,
        lines: { include: { product: true, account: true, analyticAccount: true } },
        journalEntry: true,
      },
    });

    if (!bill) throw new AppError('Vendor bill not found', 404);
    if (bill.status !== InvoiceStatus.DRAFT) {
      throw new AppError(`Cannot post a bill with status ${bill.status}`, 400);
    }
    if (!bill.lines || bill.lines.length === 0) {
      throw new AppError('Cannot post a vendor bill with no line items.', 400);
    }

    // Find Creditors / Accounts Payable account (2000)
    const creditorsAccount = await prisma.account.findFirst({
      where: { code: '2000' },
    });
    if (!creditorsAccount) {
      throw new AppError('Creditors account (code 2000) not configured in Chart of Accounts.', 400);
    }

    // Find Input Tax Paid account (2110) if tax > 0
    let inputTaxAccount: any = null;
    const totalTax = Number(bill.taxAmount);
    if (totalTax > 0) {
      inputTaxAccount = await prisma.account.findFirst({
        where: { code: '2110' },
      });
      if (!inputTaxAccount) {
        inputTaxAccount = await prisma.account.findFirst({
          where: { code: '2100' },
        });
      }
    }

    const entryNumber = await SequenceService.getNextJournalEntryNumber();

    // Prepare journal items:
    // 1. Debits for each expense line item (linked to product account & analytic account)
    const journalItemsData: any[] = [];
    let totalDebit = 0;

    for (const line of bill.lines) {
      const lineSubtotal = Number(line.subtotal);
      totalDebit += lineSubtotal;
      journalItemsData.push({
        accountId: line.accountId,
        partnerId: bill.vendorId,
        analyticAccountId: line.analyticAccountId || null,
        description: line.description || `Purchase - ${line.product.name}`,
        debit: lineSubtotal,
        credit: 0,
      });
    }

    // 2. Debit for Input Tax (if tax > 0)
    if (totalTax > 0 && inputTaxAccount) {
      totalDebit += totalTax;
      journalItemsData.push({
        accountId: inputTaxAccount.id,
        partnerId: bill.vendorId,
        analyticAccountId: null,
        description: `Input Tax for ${bill.billNumber}`,
        debit: totalTax,
        credit: 0,
      });
    }

    // 3. Credit for Creditors / Accounts Payable (Total Bill Amount)
    const totalCredit = Number(bill.totalAmount);
    journalItemsData.push({
      accountId: creditorsAccount.id,
      partnerId: bill.vendorId,
      analyticAccountId: null,
      description: `Bill ${bill.billNumber} - ${bill.vendor.name}`,
      debit: 0,
      credit: totalCredit,
    });

    // Enforce non-negotiable double-entry rule: Debit == Credit
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
          date: bill.accountingDate || bill.billDate,
          journalId: bill.journalId,
          status: EntryStatus.POSTED,
          reference: bill.billNumber,
          sourceType: 'VENDOR_BILL',
          sourceId: bill.id,
          vendorBillId: bill.id,
          totalDebit,
          totalCredit,
          items: {
            create: journalItemsData,
          },
        },
      });

      // Update Bill status to POSTED
      const updatedBill = await tx.vendorBill.update({
        where: { id: bill.id },
        data: { status: InvoiceStatus.POSTED },
        include: {
          vendor: true,
          journal: true,
          lines: true,
          journalEntry: { include: { items: true } },
        },
      });

      // 4. Increment stock for direct vendor bills
      if (!bill.purchaseOrderId) {
        for (const line of bill.lines) {
          if (line.product.type === 'GOODS') {
            await tx.product.update({
              where: { id: line.productId },
              data: { stockQuantity: { increment: Number(line.quantity) } },
            });
          }
        }
      }

      return updatedBill;
    });
  }
}
