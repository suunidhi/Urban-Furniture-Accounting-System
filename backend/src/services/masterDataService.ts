import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { ContactType, RecordStatus, ProductType, AccountType, JournalType, AnalyticType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class MasterDataService {
  // ==================== CONTACTS ====================
  static async listContacts(filter?: { type?: string; search?: string; status?: string }) {
    const where: any = {};

    if (filter?.type && filter.type !== 'ALL') {
      where.type = filter.type as ContactType;
    }

    if (filter?.status && filter.status !== 'ALL') {
      where.status = filter.status as RecordStatus;
    } else if (!filter?.status) {
      where.status = RecordStatus.ACTIVE;
    }

    if (filter?.search) {
      const q = filter.search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { mobile: { contains: q } },
        { city: { contains: q } },
      ];
    }

    return await prisma.contact.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            invoices: true,
            vendorBills: true,
            purchaseOrders: true,
            salesOrders: true,
            payments: true,
          },
        },
      },
    });
  }

  static async getContact(id: number) {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, loginId: true, email: true, role: true, status: true },
        },
        invoices: {
          orderBy: { invoiceDate: 'desc' },
          take: 20,
        },
        vendorBills: {
          orderBy: { billDate: 'desc' },
          take: 20,
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 20,
        },
        salesOrders: {
          orderBy: { soDate: 'desc' },
          take: 10,
        },
        purchaseOrders: {
          orderBy: { poDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    // Compute aggregated figures
    const invoices = await prisma.customerInvoice.findMany({
      where: { customerId: id, status: { not: 'CANCELLED' } },
      select: { totalAmount: true, amountDue: true },
    });

    const bills = await prisma.vendorBill.findMany({
      where: { vendorId: id, status: { not: 'CANCELLED' } },
      select: { totalAmount: true, amountDue: true },
    });

    const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const outstandingReceivable = invoices.reduce((sum, inv) => sum + Number(inv.amountDue), 0);

    const totalPurchases = bills.reduce((sum, b) => sum + Number(b.totalAmount), 0);
    const outstandingPayable = bills.reduce((sum, b) => sum + Number(b.amountDue), 0);

    return {
      ...contact,
      metrics: {
        totalSales,
        outstandingReceivable,
        totalPurchases,
        outstandingPayable,
      },
    };
  }

  static async createContact(data: any) {
    const email = data.email ? data.email.trim().toLowerCase() : null;

    if (email) {
      const existing = await prisma.contact.findFirst({
        where: { email },
      });
      if (existing) {
        throw new AppError('A contact with this email address already exists.', 400);
      }
    }

    const contact = await prisma.contact.create({
      data: {
        name: data.name.trim(),
        type: data.type,
        email: email || null,
        mobile: data.mobile || null,
        street: data.street || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || 'India',
        pincode: data.pincode || null,
        imageUrl: data.imageUrl || null,
        status: RecordStatus.ACTIVE,
      },
    });

    // Automatically provision a Contact User portal account if email is provided (as per PRD / Excalidraw)
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: { email },
      });

      if (!existingUser) {
        const defaultPassword = await bcrypt.hash('User@123456', 10);
        const loginIdBase = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        const safeLoginId = loginIdBase.length >= 6 ? loginIdBase : `${loginIdBase}_user`;

        await prisma.user.create({
          data: {
            name: contact.name,
            loginId: safeLoginId,
            email,
            passwordHash: defaultPassword,
            role: UserRole.CONTACT_USER,
            contactId: contact.id,
            status: RecordStatus.ACTIVE,
          },
        }).catch((err) => {
          console.warn('Could not auto-provision portal user:', err.message);
        });
      }
    }

    return contact;
  }

  static async updateContact(id: number, data: any) {
    return await prisma.contact.update({
      where: { id },
      data,
    });
  }

  static async toggleContactStatus(id: number, status: RecordStatus) {
    return await prisma.contact.update({
      where: { id },
      data: { status },
    });
  }

  // ==================== PRODUCT CATEGORIES ====================
  static async listCategories() {
    return await prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  static async createCategory(data: { name: string; description?: string | null }) {
    const existing = await prisma.productCategory.findUnique({
      where: { name: data.name.trim() },
    });
    if (existing) {
      return existing; // Support on-the-fly idempotency
    }
    return await prisma.productCategory.create({
      data: {
        name: data.name.trim(),
        description: data.description || null,
      },
    });
  }

  // ==================== PRODUCTS ====================
  static async listProducts(filter?: { categoryId?: number; search?: string; status?: string }) {
    const where: any = {};

    if (filter?.categoryId) {
      where.categoryId = Number(filter.categoryId);
    }

    if (filter?.status && filter.status !== 'ALL') {
      where.status = filter.status as RecordStatus;
    } else if (!filter?.status) {
      where.status = RecordStatus.ACTIVE;
    }

    if (filter?.search) {
      where.name = { contains: filter.search.trim() };
    }

    return await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        category: true,
      },
    });
  }

  static async getProduct(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        purchaseOrderLines: {
          take: 10,
          include: { purchaseOrder: true },
        },
        salesOrderLines: {
          take: 10,
          include: { salesOrder: true },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Dynamic stock / sales aggregation from actual transaction lines
    const vendorLines = await prisma.vendorBillLine.findMany({
      where: {
        productId: id,
        vendorBill: { status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] } },
      },
      select: { quantity: true, total: true },
    });

    const invoiceLines = await prisma.customerInvoiceLine.findMany({
      where: {
        productId: id,
        customerInvoice: { status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] } },
      },
      select: { quantity: true, total: true },
    });

    const quantityPurchased = vendorLines.reduce((sum, l) => sum + Number(l.quantity), 0);
    const purchaseValue = vendorLines.reduce((sum, l) => sum + Number(l.total), 0);

    const quantitySold = invoiceLines.reduce((sum, l) => sum + Number(l.quantity), 0);
    const salesValue = invoiceLines.reduce((sum, l) => sum + Number(l.total), 0);

    const currentStock = quantityPurchased - quantitySold;

    // Fetch related invoices and bills for due dates and partial payments tracking
    const detailedInvoiceLines = await prisma.customerInvoiceLine.findMany({
      where: { productId: id },
      include: {
        customerInvoice: {
          include: { customer: true },
        },
      },
      orderBy: { id: 'desc' },
      take: 25,
    });

    const detailedBillLines = await prisma.vendorBillLine.findMany({
      where: { productId: id },
      include: {
        vendorBill: {
          include: { vendor: true },
        },
      },
      orderBy: { id: 'desc' },
      take: 25,
    });

    const relatedTransactions = [
      ...detailedInvoiceLines.map((l) => ({
        id: l.customerInvoice.id,
        reference: l.customerInvoice.invoiceNumber,
        partnerName: l.customerInvoice.customer?.name || 'Customer',
        partnerId: l.customerInvoice.customerId,
        date: l.customerInvoice.invoiceDate,
        dueDate: l.customerInvoice.dueDate,
        totalAmount: Number(l.customerInvoice.totalAmount),
        paidAmount: Number(l.customerInvoice.paidAmount),
        amountDue: Number(l.customerInvoice.amountDue),
        status: l.customerInvoice.status,
        type: 'CUSTOMER',
        quantity: Number(l.quantity),
        lineTotal: Number(l.total),
      })),
      ...detailedBillLines.map((l) => ({
        id: l.vendorBill.id,
        reference: l.vendorBill.billNumber,
        partnerName: l.vendorBill.vendor?.name || 'Vendor',
        partnerId: l.vendorBill.vendorId,
        date: l.vendorBill.billDate,
        dueDate: l.vendorBill.dueDate,
        totalAmount: Number(l.vendorBill.totalAmount),
        paidAmount: Number(l.vendorBill.paidAmount),
        amountDue: Number(l.vendorBill.amountDue),
        status: l.vendorBill.status,
        type: 'VENDOR',
        quantity: Number(l.quantity),
        lineTotal: Number(l.total),
      })),
    ];

    return {
      ...product,
      stockMetrics: {
        quantityPurchased,
        purchaseValue,
        quantitySold,
        salesValue,
        currentStock,
      },
      relatedTransactions,
    };
  }

  static async getStockSummary() {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    const vendorLines = await prisma.vendorBillLine.findMany({
      where: {
        vendorBill: { status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] } },
      },
      select: { productId: true, quantity: true, total: true },
    });

    const invoiceLines = await prisma.customerInvoiceLine.findMany({
      where: {
        customerInvoice: { status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] } },
      },
      select: { productId: true, quantity: true, total: true },
    });

    const purchaseMap: Record<number, { qty: number; value: number }> = {};
    for (const line of vendorLines) {
      if (!purchaseMap[line.productId]) purchaseMap[line.productId] = { qty: 0, value: 0 };
      purchaseMap[line.productId].qty += Number(line.quantity);
      purchaseMap[line.productId].value += Number(line.total);
    }

    const salesMap: Record<number, { qty: number; value: number }> = {};
    for (const line of invoiceLines) {
      if (!salesMap[line.productId]) salesMap[line.productId] = { qty: 0, value: 0 };
      salesMap[line.productId].qty += Number(line.quantity);
      salesMap[line.productId].value += Number(line.total);
    }

    let totalValuation = 0;
    let totalStockUnits = 0;

    const summary = products.map((p) => {
      const pPurchases = purchaseMap[p.id] || { qty: 0, value: 0 };
      const pSales = salesMap[p.id] || { qty: 0, value: 0 };
      const currentStock = Math.max(0, pPurchases.qty - pSales.qty);
      const stockValuation = currentStock * Number(p.costPrice);

      totalStockUnits += currentStock;
      totalValuation += stockValuation;

      return {
        id: p.id,
        name: p.name,
        type: p.type,
        category: p.category?.name || 'General',
        salesPrice: Number(p.salesPrice),
        costPrice: Number(p.costPrice),
        quantityPurchased: pPurchases.qty,
        purchasesValue: Number(pPurchases.value.toFixed(2)),
        quantitySold: pSales.qty,
        salesValue: Number(pSales.value.toFixed(2)),
        currentStock,
        stockValuation: Number(stockValuation.toFixed(2)),
        status: p.status,
      };
    });

    return {
      products: summary,
      totals: {
        totalProducts: products.length,
        totalStockUnits,
        totalValuation: Number(totalValuation.toFixed(2)),
      },
    };
  }

  static async createProduct(data: any) {
    return await prisma.product.create({
      data: {
        name: data.name.trim(),
        type: data.type,
        salesPrice: data.salesPrice,
        costPrice: data.costPrice,
        category: {
          connect: { id: Number(data.categoryId) },
        },
        imageUrl: data.imageUrl || null,
        paymentTerms: data.paymentTerms || null,
        allowPartialPayment: data.allowPartialPayment !== undefined ? Boolean(data.allowPartialPayment) : true,
        defaultDueDate: data.defaultDueDate && !isNaN(new Date(data.defaultDueDate).getTime())
          ? new Date(data.defaultDueDate)
          : null,
        status: RecordStatus.ACTIVE,
      },
      include: {
        category: true,
      },
    });
  }

  static async updateProduct(id: number, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.salesPrice !== undefined) updateData.salesPrice = data.salesPrice;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms || null;
    if (data.allowPartialPayment !== undefined) updateData.allowPartialPayment = Boolean(data.allowPartialPayment);
    if (data.defaultDueDate !== undefined) {
      updateData.defaultDueDate = data.defaultDueDate && !isNaN(new Date(data.defaultDueDate).getTime())
        ? new Date(data.defaultDueDate)
        : null;
    }
    if (data.categoryId !== undefined && data.categoryId !== null) {
      updateData.category = {
        connect: { id: Number(data.categoryId) },
      };
    }

    return await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  static async toggleProductStatus(id: number, status: RecordStatus) {
    return await prisma.product.update({
      where: { id },
      data: { status },
    });
  }

  // ==================== CHART OF ACCOUNTS ====================
  static async listAccounts() {
    const accounts = await prisma.account.findMany({
      orderBy: { code: 'asc' },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        _count: { select: { journalItems: true } },
      },
    });

    // Compute live balance for every account from actual posted journal items!
    // Never hardcoded: Debit minus Credit (or Credit minus Debit depending on account normal balance)
    const items = await prisma.journalItem.findMany({
      where: {
        journalEntry: { status: 'POSTED' },
      },
      select: {
        accountId: true,
        debit: true,
        credit: true,
      },
    });

    const balances: Record<number, { debit: number; credit: number; balance: number }> = {};

    for (const item of items) {
      if (!balances[item.accountId]) {
        balances[item.accountId] = { debit: 0, credit: 0, balance: 0 };
      }
      balances[item.accountId].debit += Number(item.debit);
      balances[item.accountId].credit += Number(item.credit);
    }

    return accounts.map((acc) => {
      const b = balances[acc.id] || { debit: 0, credit: 0, balance: 0 };
      // Normal balance:
      // Asset / Expense: Debit - Credit
      // Liability / Equity / Income: Credit - Debit
      let netBalance = 0;
      if (acc.type === 'ASSET' || acc.type === 'EXPENSE' || acc.type === 'OTHER_EXPENSE') {
        netBalance = b.debit - b.credit;
      } else {
        netBalance = b.credit - b.debit;
      }

      return {
        ...acc,
        totalDebit: b.debit,
        totalCredit: b.credit,
        balance: netBalance,
      };
    });
  }

  static async getAccount(id: number) {
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    // Fetch ledger entries for this account
    const journalItems = await prisma.journalItem.findMany({
      where: {
        accountId: id,
        journalEntry: { status: 'POSTED' },
      },
      orderBy: { journalEntry: { date: 'asc' } },
      include: {
        journalEntry: {
          include: { journal: true },
        },
        partner: { select: { id: true, name: true, type: true } },
        analyticAccount: { select: { id: true, name: true } },
      },
    });

    let runningBalance = 0;
    const ledger = journalItems.map((item) => {
      const d = Number(item.debit);
      const c = Number(item.credit);
      if (account.type === 'ASSET' || account.type === 'EXPENSE' || account.type === 'OTHER_EXPENSE') {
        runningBalance += d - c;
      } else {
        runningBalance += c - d;
      }

      return {
        id: item.id,
        date: item.journalEntry.date,
        entryNumber: item.journalEntry.entryNumber,
        reference: item.journalEntry.reference,
        journal: item.journalEntry.journal.name,
        partner: item.partner?.name,
        analytic: item.analyticAccount?.name,
        description: item.description,
        debit: d,
        credit: c,
        balance: runningBalance,
      };
    });

    const totalDebit = journalItems.reduce((sum, item) => sum + Number(item.debit), 0);
    const totalCredit = journalItems.reduce((sum, item) => sum + Number(item.credit), 0);

    return {
      ...account,
      totalDebit,
      totalCredit,
      balance: runningBalance,
      ledger,
    };
  }

  static async createAccount(data: any) {
    const existing = await prisma.account.findUnique({
      where: { code: data.code.trim() },
    });
    if (existing) {
      throw new AppError(`Account code ${data.code} already exists.`, 400);
    }

    return await prisma.account.create({
      data: {
        code: data.code.trim(),
        name: data.name.trim(),
        type: data.type,
        parentId: data.parentId,
        isActive: data.isActive ?? true,
      },
      include: { parent: true },
    });
  }

  static async updateAccount(id: number, data: any) {
    return await prisma.account.update({
      where: { id },
      data,
      include: { parent: true },
    });
  }

  // ==================== JOURNALS ====================
  static async listJournals() {
    const journals = await prisma.journal.findMany({
      orderBy: { name: 'asc' },
      include: {
        defaultDebitAccount: { select: { id: true, code: true, name: true } },
        defaultCreditAccount: { select: { id: true, code: true, name: true } },
        _count: {
          select: {
            journalEntries: true,
            vendorBills: true,
            customerInvoices: true,
            payments: true,
          },
        },
      },
    });

    return journals;
  }

  static async createJournal(data: any) {
    const existing = await prisma.journal.findUnique({
      where: { code: data.code.trim() },
    });
    if (existing) {
      throw new AppError(`Journal code ${data.code} already exists.`, 400);
    }

    return await prisma.journal.create({
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        type: data.type,
        defaultDebitAccountId: data.defaultDebitAccountId,
        defaultCreditAccountId: data.defaultCreditAccountId,
      },
      include: {
        defaultDebitAccount: true,
        defaultCreditAccount: true,
      },
    });
  }

  // ==================== ANALYTIC ACCOUNTS ====================
  static async listAnalyticAccounts() {
    return await prisma.analyticAccount.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            budgets: true,
            journalItems: true,
            vendorBillLines: true,
            customerInvoiceLines: true,
          },
        },
      },
    });
  }

  static async createAnalyticAccount(data: { name: string; type: AnalyticType; isActive?: boolean }) {
    const existing = await prisma.analyticAccount.findUnique({
      where: { name: data.name.trim() },
    });
    if (existing) {
      throw new AppError(`Analytic account with name "${data.name}" already exists.`, 400);
    }

    return await prisma.analyticAccount.create({
      data: {
        name: data.name.trim(),
        type: data.type,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async updateAnalyticAccount(id: number, data: any) {
    return await prisma.analyticAccount.update({
      where: { id },
      data,
    });
  }
}
