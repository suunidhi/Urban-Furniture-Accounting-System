import prisma from '../config/db';

export class AnalysisService {
  static async getProductAnalysis(timeRange: string, type: string, categoryId?: number, productId?: number) {
    let dateFilter = new Date();
    if (timeRange === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (timeRange === '14d') dateFilter.setDate(dateFilter.getDate() - 14);
    else if (timeRange === '1m') dateFilter.setMonth(dateFilter.getMonth() - 1);
    else dateFilter = new Date(0);

    const productMap = new Map();

    if (type === 'income') {
      const lines = await prisma.customerInvoiceLine.findMany({
        where: {
          customerInvoice: {
            invoiceDate: { gte: dateFilter },
            status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] }
          }
        },
        include: { product: true }
      });
      lines.forEach(line => {
        if (categoryId && line.product.categoryId !== categoryId) return;
        if (productId && line.productId !== productId) return;
        const pName = line.product.name;
        if (!productMap.has(pName)) productMap.set(pName, { name: pName, value: 0 });
        productMap.get(pName).value += Number(line.total);
      });
    } else {
      const lines = await prisma.vendorBillLine.findMany({
        where: {
          vendorBill: {
            billDate: { gte: dateFilter },
            status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] }
          }
        },
        include: { product: true }
      });
      lines.forEach(line => {
        if (categoryId && line.product.categoryId !== categoryId) return;
        if (productId && line.productId !== productId) return;
        const pName = line.product.name;
        if (!productMap.has(pName)) productMap.set(pName, { name: pName, value: 0 });
        productMap.get(pName).value += Number(line.total);
      });
    }

    return Array.from(productMap.values());
  }

  static async getCustomerAnalysis(timeRange: string, type: string) {
    let dateFilter = new Date();
    if (timeRange === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (timeRange === '14d') dateFilter.setDate(dateFilter.getDate() - 14);
    else if (timeRange === '1m') dateFilter.setMonth(dateFilter.getMonth() - 1);
    else dateFilter = new Date(0);

    const contactMap = new Map();

    if (type === 'income') {
      const invoices = await prisma.customerInvoice.findMany({
        where: {
          invoiceDate: { gte: dateFilter },
          status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] }
        },
        include: { customer: true }
      });
      invoices.forEach(inv => {
        const cName = inv.customer.name;
        if (!contactMap.has(cName)) contactMap.set(cName, { name: cName, value: 0 });
        contactMap.get(cName).value += Number(inv.totalAmount);
      });
    } else {
      const bills = await prisma.vendorBill.findMany({
        where: {
          billDate: { gte: dateFilter },
          status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] }
        },
        include: { vendor: true }
      });
      bills.forEach(bill => {
        const cName = bill.vendor.name;
        if (!contactMap.has(cName)) contactMap.set(cName, { name: cName, value: 0 });
        contactMap.get(cName).value += Number(bill.totalAmount);
      });
    }

    return Array.from(contactMap.values());
  }

  static async getFreestyleAnalysis(startDate: string, endDate: string, type: string) {
    const dateMap = new Map();
    const productMap = new Map();
    const contactMap = new Map();

    const fetchIncome = type === 'all' || type === 'income';
    const fetchExpense = type === 'all' || type === 'expense';

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (fetchIncome) {
      const invoices = await prisma.customerInvoice.findMany({
        where: {
          invoiceDate: { gte: start, lte: end },
          status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] }
        },
        include: { customer: true, lines: { include: { product: true } } }
      });

      invoices.forEach(inv => {
        const dStr = new Date(inv.invoiceDate).toISOString().split('T')[0];
        if (!dateMap.has(dStr)) dateMap.set(dStr, { date: dStr, value: 0 });
        dateMap.get(dStr).value += Number(inv.totalAmount);

        const cName = inv.customer.name;
        if (!contactMap.has(cName)) contactMap.set(cName, { name: cName, value: 0 });
        contactMap.get(cName).value += Number(inv.totalAmount);

        inv.lines.forEach(line => {
          const pName = line.product.name;
          if (!productMap.has(pName)) productMap.set(pName, { name: pName, value: 0 });
          productMap.get(pName).value += Number(line.total);
        });
      });
    }

    if (fetchExpense) {
      const bills = await prisma.vendorBill.findMany({
        where: {
          billDate: { gte: start, lte: end },
          status: { in: ['POSTED', 'PARTIALLY_PAID', 'PAID'] }
        },
        include: { vendor: true, lines: { include: { product: true } } }
      });

      bills.forEach(bill => {
        const dStr = new Date(bill.billDate).toISOString().split('T')[0];
        if (!dateMap.has(dStr)) dateMap.set(dStr, { date: dStr, value: 0 });
        dateMap.get(dStr).value += Number(bill.totalAmount);

        const cName = bill.vendor.name;
        if (!contactMap.has(cName)) contactMap.set(cName, { name: cName, value: 0 });
        contactMap.get(cName).value += Number(bill.totalAmount);

        bill.lines.forEach(line => {
          const pName = line.product.name;
          if (!productMap.has(pName)) productMap.set(pName, { name: pName, value: 0 });
          productMap.get(pName).value += Number(line.total);
        });
      });
    }

    return {
      byDate: Array.from(dateMap.values()).sort((a,b) => a.date.localeCompare(b.date)),
      byProduct: Array.from(productMap.values()),
      byContact: Array.from(contactMap.values())
    };
  }
}
