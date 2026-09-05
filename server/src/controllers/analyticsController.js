import prisma from '../../prisma/client.js';

/**
 * Top-level KPIs for the dashboard
 */
export const getKPIs = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalRevenue,
      totalExpenses,
      totalAR,
      totalAP,
      openPOs,
      openInvoices,
      openBills,
      salesThisMonth
    ] = await Promise.all([
      // Total revenue from posted income journal items YTD
      prisma.journalItem.aggregate({
        where: {
          journalEntry: { state: 'posted', date: { gte: startOfYear } },
          account: { type: 'income' }
        },
        _sum: { credit: true }
      }),

      // Total expenses from posted expense journal items YTD
      prisma.journalItem.aggregate({
        where: {
          journalEntry: { state: 'posted', date: { gte: startOfYear } },
          account: { type: 'expense' }
        },
        _sum: { debit: true }
      }),

      // Accounts Receivable (outstanding customer invoices)
      prisma.customerInvoice.aggregate({
        where: { status: { in: ['posted', 'partly_paid'] } },
        _sum: { outstanding_amount: true }
      }),

      // Accounts Payable (outstanding vendor bills)
      prisma.vendorBill.aggregate({
        where: { status: { in: ['posted', 'partly_paid'] } },
        _sum: { outstanding_amount: true }
      }),

      // Open (draft + confirmed) Purchase Orders
      prisma.purchaseOrder.count({ where: { status: { in: ['draft', 'confirmed'] } } }),

      // Open (posted + partly_paid) Customer Invoices
      prisma.customerInvoice.count({ where: { status: { in: ['posted', 'partly_paid'] } } }),

      // Open Vendor Bills
      prisma.vendorBill.count({ where: { status: { in: ['posted', 'partly_paid'] } } }),

      // Sales this month
      prisma.salesOrder.aggregate({
        where: { created_at: { gte: startOfMonth }, status: { not: 'cancelled' } },
        _sum: { total: true }
      })
    ]);

    res.json({
      revenue_ytd: parseFloat(totalRevenue._sum.credit || 0),
      expenses_ytd: parseFloat(totalExpenses._sum.debit || 0),
      net_profit_ytd: parseFloat(totalRevenue._sum.credit || 0) - parseFloat(totalExpenses._sum.debit || 0),
      accounts_receivable: parseFloat(totalAR._sum.outstanding_amount || 0),
      accounts_payable: parseFloat(totalAP._sum.outstanding_amount || 0),
      open_purchase_orders: openPOs,
      open_invoices: openInvoices,
      open_bills: openBills,
      sales_this_month: parseFloat(salesThisMonth._sum.total || 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Monthly revenue vs expenses for the last 12 months
 */
export const getRevenueVsExpenses = async (req, res) => {
  try {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      });
    }

    const data = await Promise.all(months.map(async (m) => {
      const [rev, exp] = await Promise.all([
        prisma.journalItem.aggregate({
          where: {
            journalEntry: { state: 'posted', date: { gte: m.start, lte: m.end } },
            account: { type: 'income' }
          },
          _sum: { credit: true }
        }),
        prisma.journalItem.aggregate({
          where: {
            journalEntry: { state: 'posted', date: { gte: m.start, lte: m.end } },
            account: { type: 'expense' }
          },
          _sum: { debit: true }
        })
      ]);

      return {
        month: m.label,
        revenue: parseFloat(rev._sum.credit || 0),
        expenses: parseFloat(exp._sum.debit || 0)
      };
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Top 5 customers by invoice total
 */
export const getTopCustomers = async (req, res) => {
  try {
    const invoices = await prisma.customerInvoice.groupBy({
      by: ['customer_id'],
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5
    });

    const enriched = await Promise.all(invoices.map(async (row) => {
      const contact = await prisma.contact.findUnique({ where: { id: row.customer_id } });
      return {
        name: contact?.name || 'Unknown',
        total: parseFloat(row._sum.total || 0)
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Top 5 vendors by bill total
 */
export const getTopVendors = async (req, res) => {
  try {
    const bills = await prisma.vendorBill.groupBy({
      by: ['vendor_id'],
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5
    });

    const enriched = await Promise.all(bills.map(async (row) => {
      const contact = await prisma.contact.findUnique({ where: { id: row.vendor_id } });
      return {
        name: contact?.name || 'Unknown',
        total: parseFloat(row._sum.total || 0)
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Recent journal entries
 */
export const getRecentActivity = async (req, res) => {
  try {
    const entries = await prisma.journalEntry.findMany({
      take: 8,
      orderBy: { created_at: 'desc' },
      include: { journal: true }
    });

    res.json(entries.map(e => ({
      id: e.id,
      date: e.date,
      journal: e.journal?.name,
      reference: e.reference,
      source_type: e.source_type,
      total: parseFloat(e.total_debit),
      state: e.state
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Monthly sales orders count + total for current year
 */
export const getMonthlySales = async (req, res) => {
  try {
    const now = new Date();
    const months = [];

    for (let i = 0; i < 12; i++) {
      const start = new Date(now.getFullYear(), i, 1);
      const end = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59);
      const result = await prisma.salesOrder.aggregate({
        where: { date: { gte: start, lte: end }, status: { not: 'cancelled' } },
        _sum: { total: true },
        _count: { id: true }
      });
      months.push({
        month: start.toLocaleString('default', { month: 'short' }),
        total: parseFloat(result._sum.total || 0),
        count: result._count.id
      });
    }

    res.json(months);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
