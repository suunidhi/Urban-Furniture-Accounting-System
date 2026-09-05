import prisma from '../../prisma/client.js';
import accountingService from '../services/AccountingService.js';

export const getVendorBills = async (req, res) => {
  try {
    const bills = await prisma.vendorBill.findMany({
      include: {
        vendor: true,
        lines: {
          include: { product: true }
        },
        purchaseOrder: true,
        creator: {
          select: { id: true, name: true, email: true }
        },
        allocations: {
          include: { payment: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getVendorBillById = async (req, res) => {
  try {
    const bill = await prisma.vendorBill.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        vendor: true,
        lines: {
          include: { product: true }
        },
        purchaseOrder: true,
        creator: {
          select: { id: true, name: true, email: true }
        },
        allocations: {
          include: { payment: true }
        }
      }
    });

    if (!bill) {
      return res.status(404).json({ message: 'Vendor bill not found' });
    }

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createVendorBill = async (req, res) => {
  try {
    const { vendor_id, po_id, invoice_date, due_date, lines } = req.body;

    if (!vendor_id) {
      return res.status(400).json({ message: 'Vendor is required' });
    }

    if (!lines || lines.length === 0) {
      return res.status(400).json({ message: 'At least one bill line is required' });
    }

    // Generate Bill Number
    const count = await prisma.vendorBill.count();
    const bill_number = `BILL-${String(count + 1).padStart(5, '0')}`;

    let total = 0;
    const billLines = lines.map(line => {
      const qty = parseFloat(line.quantity) || 1;
      const price = parseFloat(line.unit_price) || 0;
      const subtotal = qty * price;
      total += subtotal;
      return {
        product_id: line.product_id ? Number(line.product_id) : null,
        description: line.description || '',
        quantity: qty,
        unit_price: price,
        subtotal
      };
    });

    const bill = await prisma.vendorBill.create({
      data: {
        bill_number,
        vendor_id: Number(vendor_id),
        po_id: po_id ? Number(po_id) : null,
        invoice_date: new Date(invoice_date || new Date()),
        due_date: due_date ? new Date(due_date) : null,
        total,
        paid_amount: 0,
        outstanding_amount: total,
        created_by: req.user.id,
        lines: {
          create: billLines
        }
      },
      include: {
        vendor: true,
        lines: {
          include: { product: true }
        }
      }
    });

    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const updateVendorBill = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { vendor_id, invoice_date, due_date, lines } = req.body;

    const existingBill = await prisma.vendorBill.findUnique({ where: { id } });
    if (!existingBill) {
      return res.status(404).json({ message: 'Vendor bill not found' });
    }

    if (existingBill.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft bills can be edited' });
    }

    let total = 0;
    const billLines = (lines || []).map(line => {
      const qty = parseFloat(line.quantity) || 1;
      const price = parseFloat(line.unit_price) || 0;
      const subtotal = qty * price;
      total += subtotal;
      return {
        product_id: line.product_id ? Number(line.product_id) : null,
        description: line.description || '',
        quantity: qty,
        unit_price: price,
        subtotal
      };
    });

    await prisma.vendorBillLine.deleteMany({ where: { bill_id: id } });

    const updatedBill = await prisma.vendorBill.update({
      where: { id },
      data: {
        vendor_id: vendor_id ? Number(vendor_id) : existingBill.vendor_id,
        invoice_date: invoice_date ? new Date(invoice_date) : existingBill.invoice_date,
        due_date: due_date ? new Date(due_date) : existingBill.due_date,
        total,
        outstanding_amount: total,
        lines: { create: billLines }
      },
      include: {
        vendor: true,
        lines: { include: { product: true } }
      }
    });

    res.json(updatedBill);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const deleteVendorBill = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existingBill = await prisma.vendorBill.findUnique({ where: { id } });

    if (!existingBill) {
      return res.status(404).json({ message: 'Vendor bill not found' });
    }

    if (existingBill.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft bills can be deleted' });
    }

    await prisma.vendorBill.delete({ where: { id } });
    res.json({ message: 'Vendor bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const postVendorBill = async (req, res) => {
  try {
    const billId = Number(req.params.id);
    const bill = await prisma.vendorBill.findUnique({
      where: { id: billId },
      include: { vendor: true, lines: true }
    });

    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.status !== 'draft') return res.status(400).json({ message: 'Bill is already posted or paid' });
    if (parseFloat(bill.total) <= 0) return res.status(400).json({ message: 'Bill total must be greater than zero' });

    // Find required accounts
    const payableAccount = await prisma.chartOfAccount.findFirst({ where: { type: 'liability', is_active: true } });
    const expenseAccount = await prisma.chartOfAccount.findFirst({ where: { type: 'expense', is_active: true } });
    const purchaseJournal = await prisma.journal.findFirst({ where: { type: 'purchase', is_active: true } })
      || await prisma.journal.findFirst({ where: { is_active: true } });

    if (!payableAccount || !expenseAccount || !purchaseJournal) {
      return res.status(400).json({
        message: 'Cannot post bill: Missing accounting setup (Liability/Expense accounts or Purchase Journal). Please configure your Chart of Accounts and Journals first.'
      });
    }

    const total = parseFloat(bill.total);

    // Create double-entry journal entry
    const journalEntry = await accountingService.createJournalEntry({
      journal_id: purchaseJournal.id,
      date: bill.invoice_date,
      reference: bill.bill_number,
      source_type: 'vendor_bill',
      source_id: bill.id,
      created_by: req.user.id,
      items: [
        {
          account_id: expenseAccount.id,
          debit: total,
          credit: 0,
          description: `Expenses for ${bill.bill_number}`
        },
        {
          account_id: payableAccount.id,
          debit: 0,
          credit: total,
          description: `Payable to ${bill.vendor.name} — ${bill.bill_number}`
        }
      ]
    });

    const updatedBill = await prisma.vendorBill.update({
      where: { id: billId },
      data: {
        status: 'posted',
        journal_entry_id: journalEntry.id
      },
      include: {
        vendor: true,
        lines: { include: { product: true } },
        allocations: true
      }
    });

    res.json(updatedBill);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
