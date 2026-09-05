const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const prisma = require('../db');

// List Vendor Bills
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bills = await prisma.vendorBill.findMany({
      include: {
        vendor: true,
        po: true
      },
      orderBy: { invoice_date: 'desc' }
    });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bills' });
  }
});

// Get Bill by ID
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const bill = await prisma.vendorBill.findUnique({
      where: { id: parseInt(id) },
      include: {
        vendor: true,
        po: true,
        lines: {
          include: { product: true, analytic_account: true }
        }
      }
    });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bill' });
  }
});

// Create Bill from Purchase Order
router.post('/from-po/:poId', authenticateToken, async (req, res) => {
  const { poId } = req.params;
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(poId) },
      include: { lines: true }
    });

    if (!po) return res.status(404).json({ message: 'Purchase order not found' });
    if (po.status !== 'confirmed') return res.status(400).json({ message: 'Only confirmed orders can be billed' });

    // Generate Bill Number
    const count = await prisma.vendorBill.count();
    const bill_number = `BILL${String(count + 1).padStart(5, '0')}`;

    const newBill = await prisma.$transaction(async (tx) => {
      // Create Bill Header
      const bill = await tx.vendorBill.create({
        data: {
          bill_number,
          po_id: po.id,
          vendor_id: po.vendor_id,
          invoice_date: new Date(),
          total: po.total,
          outstanding_amount: po.total,
          status: 'draft',
          created_by: req.user.id
        }
      });

      // Create Lines
      const lineCreates = po.lines.map(line => ({
        bill_id: bill.id,
        product_id: line.product_id,
        analytic_account_id: line.analytic_account_id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        subtotal: line.subtotal
      }));

      await tx.vendorBillLine.createMany({ data: lineCreates });

      // Update PO status to billed
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'billed' }
      });

      return bill;
    });

    res.status(201).json(newBill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating bill' });
  }
});

// Confirm Bill & Generate Journal Entry
router.post('/:id/confirm', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const bill = await prisma.vendorBill.findUnique({
      where: { id: parseInt(id) },
      include: { vendor: true }
    });

    if (!bill || bill.status !== 'draft') {
      return res.status(400).json({ message: 'Invalid bill or state' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Get Accounts (Purchases & Creditors)
      let creditorAcc = await tx.chartOfAccount.findFirst({ where: { name: { contains: 'Creditor' } } });
      let purchaseAcc = await tx.chartOfAccount.findFirst({ where: { name: { contains: 'Purchase' } } });

      if (!creditorAcc) creditorAcc = await tx.chartOfAccount.create({ data: { code: '2100', name: 'Creditors', type: 'liability' } });
      if (!purchaseAcc) purchaseAcc = await tx.chartOfAccount.create({ data: { code: '5000', name: 'Purchase Expense', type: 'expense' } });

      let journal = await tx.journal.findFirst({ where: { type: 'purchase' } });
      if (!journal) journal = await tx.journal.create({ data: { name: 'Purchase Journal', type: 'purchase' } });

      // 2. Create Journal Entry
      const je = await tx.journalEntry.create({
        data: {
          journal_id: journal.id,
          date: bill.invoice_date,
          reference: bill.bill_number,
          source_type: 'vendor_bill',
          source_id: bill.id,
          state: 'posted',
          total_debit: bill.total,
          total_credit: bill.total,
          created_by: req.user.id
        }
      });

      // 2.5 Update Stock for billed products
      const billWithLines = await tx.vendorBill.findUnique({
        where: { id: bill.id },
        include: { lines: true }
      });
      for (const line of billWithLines.lines) {
        if (line.product_id) {
          const product = await tx.product.findUnique({ where: { id: line.product_id } });
          await tx.product.update({
            where: { id: line.product_id },
            data: { stock: Number(product.stock) + Number(line.quantity) }
          });
        }
      }

      // 3. Create Journal Items
      const journalItems = [];
      
      // Credit Creditors (Liability increases) for the total amount
      journalItems.push({
        journal_entry_id: je.id,
        account_id: creditorAcc.id,
        debit: 0,
        credit: bill.total
      });

      // Debit Purchases (Expense increases) for each line item
      for (const line of billWithLines.lines) {
        if (Number(line.subtotal) > 0) {
          journalItems.push({
            journal_entry_id: je.id,
            account_id: purchaseAcc.id,
            analytic_account_id: line.analytic_account_id,
            debit: line.subtotal,
            credit: 0
          });
        }
      }

      if (journalItems.length > 0) {
        await tx.journalItem.createMany({ data: journalItems });
      }

      // 4. Update Bill Status
      return tx.vendorBill.update({
        where: { id: bill.id },
        data: { 
          status: 'posted',
          journal_entry_id: je.id
        }
      });
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error confirming bill' });
  }
});

module.exports = router;
