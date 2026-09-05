import prisma from '../../prisma/client.js';
import accountingService from '../services/AccountingService.js';

export const getCustomerInvoices = async (req, res) => {
  try {
    const invoices = await prisma.customerInvoice.findMany({
      include: {
        customer: true,
        lines: { include: { product: true } },
        salesOrder: true,
        creator: { select: { id: true, name: true } },
        allocations: { include: { payment: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getCustomerInvoiceById = async (req, res) => {
  try {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        customer: true,
        lines: { include: { product: true } },
        salesOrder: true,
        creator: { select: { id: true, name: true } },
        allocations: { include: { payment: true } }
      }
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createCustomerInvoice = async (req, res) => {
  try {
    const { customer_id, so_id, invoice_date, due_date, lines } = req.body;

    if (!customer_id) return res.status(400).json({ message: 'Customer is required' });
    if (!lines || lines.length === 0) return res.status(400).json({ message: 'At least one invoice line is required' });

    const count = await prisma.customerInvoice.count();
    const invoice_number = `INV-${String(count + 1).padStart(5, '0')}`;

    let subtotal = 0;
    let tax_amount = 0;

    const invoiceLines = lines.map(line => {
      const qty = parseFloat(line.quantity) || 1;
      const price = parseFloat(line.unit_price) || 0;
      const tax_rate = parseFloat(line.tax_rate) || 0;
      const lineSub = qty * price;
      const lineTax = lineSub * (tax_rate / 100);
      subtotal += lineSub;
      tax_amount += lineTax;
      return {
        product_id: line.product_id ? Number(line.product_id) : null,
        description: line.description || '',
        quantity: qty,
        unit_price: price,
        tax_rate,
        subtotal: lineSub,
        tax_amount: lineTax,
        total: lineSub + lineTax
      };
    });

    const total = subtotal + tax_amount;

    const invoice = await prisma.customerInvoice.create({
      data: {
        invoice_number,
        customer_id: Number(customer_id),
        so_id: so_id ? Number(so_id) : null,
        invoice_date: new Date(invoice_date || new Date()),
        due_date: due_date ? new Date(due_date) : null,
        subtotal,
        tax_amount,
        total,
        paid_amount: 0,
        outstanding_amount: total,
        created_by: req.user.id,
        lines: { create: invoiceLines }
      },
      include: {
        customer: true,
        lines: { include: { product: true } }
      }
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const updateCustomerInvoice = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { customer_id, invoice_date, due_date, lines } = req.body;

    const existing = await prisma.customerInvoice.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Invoice not found' });
    if (existing.status !== 'draft') return res.status(400).json({ message: 'Only draft invoices can be edited' });

    let subtotal = 0;
    let tax_amount = 0;

    const invoiceLines = (lines || []).map(line => {
      const qty = parseFloat(line.quantity) || 1;
      const price = parseFloat(line.unit_price) || 0;
      const tax_rate = parseFloat(line.tax_rate) || 0;
      const lineSub = qty * price;
      const lineTax = lineSub * (tax_rate / 100);
      subtotal += lineSub;
      tax_amount += lineTax;
      return {
        product_id: line.product_id ? Number(line.product_id) : null,
        description: line.description || '',
        quantity: qty,
        unit_price: price,
        tax_rate,
        subtotal: lineSub,
        tax_amount: lineTax,
        total: lineSub + lineTax
      };
    });

    await prisma.customerInvoiceLine.deleteMany({ where: { invoice_id: id } });

    const updated = await prisma.customerInvoice.update({
      where: { id },
      data: {
        customer_id: customer_id ? Number(customer_id) : existing.customer_id,
        invoice_date: invoice_date ? new Date(invoice_date) : existing.invoice_date,
        due_date: due_date ? new Date(due_date) : existing.due_date,
        subtotal,
        tax_amount,
        total: subtotal + tax_amount,
        outstanding_amount: subtotal + tax_amount,
        lines: { create: invoiceLines }
      },
      include: {
        customer: true,
        lines: { include: { product: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const deleteCustomerInvoice = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.customerInvoice.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Invoice not found' });
    if (existing.status !== 'draft') return res.status(400).json({ message: 'Only draft invoices can be deleted' });
    await prisma.customerInvoice.delete({ where: { id } });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const postCustomerInvoice = async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, lines: true }
    });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status !== 'draft') return res.status(400).json({ message: 'Invoice is already posted or paid' });
    if (parseFloat(invoice.total) <= 0) return res.status(400).json({ message: 'Invoice total must be greater than zero' });

    // Find required accounts
    const receivableAccount = await prisma.chartOfAccount.findFirst({ where: { type: 'asset', is_active: true } });
    const incomeAccount = await prisma.chartOfAccount.findFirst({ where: { type: 'income', is_active: true } });
    const salesJournal = await prisma.journal.findFirst({ where: { type: 'sale', is_active: true } })
      || await prisma.journal.findFirst({ where: { is_active: true } });

    if (!receivableAccount || !incomeAccount || !salesJournal) {
      return res.status(400).json({
        message: 'Cannot post invoice: Missing accounting setup (Asset/Income accounts or Sales Journal). Please configure your Chart of Accounts and Journals first.'
      });
    }

    const total = parseFloat(invoice.total);

    // Create double-entry journal: Debit AR (asset increases), Credit Income
    const journalEntry = await accountingService.createJournalEntry({
      journal_id: salesJournal.id,
      date: invoice.invoice_date,
      reference: invoice.invoice_number,
      source_type: 'customer_invoice',
      source_id: invoice.id,
      created_by: req.user.id,
      items: [
        {
          account_id: receivableAccount.id,
          debit: total,
          credit: 0,
          description: `Receivable from ${invoice.customer.name} — ${invoice.invoice_number}`
        },
        {
          account_id: incomeAccount.id,
          debit: 0,
          credit: total,
          description: `Revenue for ${invoice.invoice_number}`
        }
      ]
    });

    const updated = await prisma.customerInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'posted',
        journal_entry_id: journalEntry.id
      },
      include: {
        customer: true,
        lines: { include: { product: true } },
        allocations: true
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
