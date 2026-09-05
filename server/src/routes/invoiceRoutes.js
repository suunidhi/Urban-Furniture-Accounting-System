const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const prisma = require('../db');

// List Invoices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const invoices = await prisma.customerInvoice.findMany({
      include: {
        customer: true,
        so: true
      },
      orderBy: { invoice_date: 'desc' }
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

// Get Invoice by ID
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        so: true,
        lines: {
          include: { product: true, analytic_account: true }
        }
      }
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching invoice' });
  }
});

// Create Invoice from Sales Order
router.post('/from-so/:soId', authenticateToken, async (req, res) => {
  const { soId } = req.params;
  try {
    const so = await prisma.salesOrder.findUnique({
      where: { id: parseInt(soId) },
      include: { lines: true }
    });

    if (!so) return res.status(404).json({ message: 'Sales order not found' });
    if (so.status !== 'confirmed') return res.status(400).json({ message: 'Only confirmed orders can be invoiced' });

    // Generate Invoice Number
    const count = await prisma.customerInvoice.count();
    const invoice_number = `INV${String(count + 1).padStart(5, '0')}`;

    const newInvoice = await prisma.$transaction(async (tx) => {
      // Create Invoice Header
      const invoice = await tx.customerInvoice.create({
        data: {
          invoice_number,
          so_id: so.id,
          customer_id: so.customer_id,
          invoice_date: new Date(),
          subtotal: so.subtotal,
          tax_amount: so.tax_amount,
          total: so.total,
          outstanding_amount: so.total,
          status: 'draft',
          created_by: req.user.id
        }
      });

      // Create Lines
      const lineCreates = so.lines.map(line => ({
        invoice_id: invoice.id,
        product_id: line.product_id,
        analytic_account_id: line.analytic_account_id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        tax_rate: line.tax_rate,
        subtotal: line.subtotal,
        tax_amount: line.tax_amount,
        total: line.total
      }));

      await tx.customerInvoiceLine.createMany({ data: lineCreates });

      // Update SO status to billed/invoiced
      await tx.salesOrder.update({
        where: { id: so.id },
        data: { status: 'invoiced' }
      });

      return invoice;
    });

    res.status(201).json(newInvoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating invoice' });
  }
});

// Confirm Invoice & Generate Journal Entry
router.post('/:id/confirm', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: parseInt(id) },
      include: { customer: true }
    });

    if (!invoice || invoice.status !== 'draft') {
      return res.status(400).json({ message: 'Invalid invoice or state' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Get Accounts (Debtors & Sales)
      // Ideally these would be fetched dynamically or via system settings
      let debtorAcc = await tx.chartOfAccount.findFirst({ where: { name: { contains: 'Debtor' } } });
      let salesAcc = await tx.chartOfAccount.findFirst({ where: { name: { contains: 'Sale' } } });

      if (!debtorAcc) debtorAcc = await tx.chartOfAccount.create({ data: { code: '1200', name: 'Debtors', type: 'asset' } });
      if (!salesAcc) salesAcc = await tx.chartOfAccount.create({ data: { code: '4000', name: 'Sales Income', type: 'income' } });

      let journal = await tx.journal.findFirst({ where: { type: 'sale' } });
      if (!journal) journal = await tx.journal.create({ data: { name: 'Sales Journal', type: 'sale' } });

      // 2. Create Journal Entry
      const je = await tx.journalEntry.create({
        data: {
          journal_id: journal.id,
          date: invoice.invoice_date,
          reference: invoice.invoice_number,
          source_type: 'customer_invoice',
          source_id: invoice.id,
          state: 'posted',
          total_debit: invoice.total,
          total_credit: invoice.total,
          created_by: req.user.id
        }
      });

      // 3. Create Journal Items
      const invoiceWithLines = await tx.customerInvoice.findUnique({
        where: { id: invoice.id },
        include: { lines: true }
      });

      const journalItems = [];
      
      // Debit Debtors (Asset increases) for the total amount
      journalItems.push({
        journal_entry_id: je.id,
        account_id: debtorAcc.id,
        debit: invoice.total,
        credit: 0
      });

      // Credit Sales (Income increases) for each line item
      for (const line of invoiceWithLines.lines) {
        if (Number(line.subtotal) > 0) {
          journalItems.push({
            journal_entry_id: je.id,
            account_id: salesAcc.id,
            analytic_account_id: line.analytic_account_id,
            debit: 0,
            credit: line.subtotal
          });
        }
      }

      if (journalItems.length > 0) {
        await tx.journalItem.createMany({ data: journalItems });
      }

      // 4. Update Invoice Status
      return tx.customerInvoice.update({
        where: { id: invoice.id },
        data: { 
          status: 'posted',
          journal_entry_id: je.id
        }
      });
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error confirming invoice' });
  }
});

module.exports = router;
