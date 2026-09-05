const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const prisma = require('../db');

// List Payments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        partner: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

// Register Payment
router.post('/register', authenticateToken, async (req, res) => {
  const { type, partner_id, amount, payment_method, date, reference, invoice_id, bill_id } = req.body;
  // type: 'customer' | 'vendor'
  // payment_method: 'cash' | 'bank'
  
  try {
    // Generate Payment Number
    const count = await prisma.payment.count();
    const payment_number = `PAY${String(count + 1).padStart(5, '0')}`;

    const newPayment = await prisma.$transaction(async (tx) => {
      // 1. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          payment_number,
          type,
          partner_id: parseInt(partner_id),
          amount: parseFloat(amount),
          payment_method,
          date: new Date(date),
          reference,
          status: 'posted',
          created_by: req.user.id
        }
      });

      // 2. Allocate to Invoice/Bill if provided
      if (invoice_id) {
        await tx.paymentAllocation.create({
          data: {
            payment_id: payment.id,
            invoice_id: parseInt(invoice_id),
            allocated_amount: payment.amount
          }
        });
        
        // Update invoice outstanding amount
        const inv = await tx.customerInvoice.findUnique({ where: { id: parseInt(invoice_id) }});
        const newOutstanding = Number(inv.outstanding_amount) - payment.amount;
        
        await tx.customerInvoice.update({
          where: { id: parseInt(invoice_id) },
          data: { 
            paid_amount: Number(inv.paid_amount) + payment.amount,
            outstanding_amount: newOutstanding,
            status: newOutstanding <= 0 ? 'paid' : 'partly_paid'
          }
        });
      } else if (bill_id) {
        await tx.paymentAllocation.create({
          data: {
            payment_id: payment.id,
            bill_id: parseInt(bill_id),
            allocated_amount: payment.amount
          }
        });
        
        // Update bill outstanding amount
        const bill = await tx.vendorBill.findUnique({ where: { id: parseInt(bill_id) }});
        const newOutstanding = Number(bill.outstanding_amount) - payment.amount;
        
        await tx.vendorBill.update({
          where: { id: parseInt(bill_id) },
          data: { 
            paid_amount: Number(bill.paid_amount) + payment.amount,
            outstanding_amount: newOutstanding,
            status: newOutstanding <= 0 ? 'paid' : 'partly_paid'
          }
        });
      }

      // 3. Generate Journal Entry
      // Accounts needed: Cash/Bank, and Debtors(Customer) or Creditors(Vendor)
      const assetAccName = payment_method === 'bank' ? 'Bank' : 'Cash';
      let assetAcc = await tx.chartOfAccount.findFirst({ where: { name: { contains: assetAccName } } });
      if (!assetAcc) assetAcc = await tx.chartOfAccount.create({ data: { code: payment_method === 'bank' ? '1000' : '1010', name: assetAccName, type: 'asset' } });

      let partnerAcc;
      if (type === 'customer') {
        partnerAcc = await tx.chartOfAccount.findFirst({ where: { name: { contains: 'Debtor' } } });
        if (!partnerAcc) partnerAcc = await tx.chartOfAccount.create({ data: { code: '1200', name: 'Debtors', type: 'asset' } });
      } else {
        partnerAcc = await tx.chartOfAccount.findFirst({ where: { name: { contains: 'Creditor' } } });
        if (!partnerAcc) partnerAcc = await tx.chartOfAccount.create({ data: { code: '2100', name: 'Creditors', type: 'liability' } });
      }

      const journalType = payment_method === 'bank' ? 'bank' : 'cash';
      let journal = await tx.journal.findFirst({ where: { type: journalType } });
      if (!journal) journal = await tx.journal.create({ data: { name: `${assetAccName} Journal`, type: journalType } });

      const je = await tx.journalEntry.create({
        data: {
          journal_id: journal.id,
          date: payment.date,
          reference: payment.payment_number,
          source_type: 'payment',
          source_id: payment.id,
          state: 'posted',
          total_debit: payment.amount,
          total_credit: payment.amount,
          created_by: req.user.id
        }
      });

      // Customer Payment (Receive Money) -> Debit Cash/Bank, Credit Debtors
      // Vendor Payment (Send Money) -> Debit Creditors, Credit Cash/Bank
      const debitAccId = type === 'customer' ? assetAcc.id : partnerAcc.id;
      const creditAccId = type === 'customer' ? partnerAcc.id : assetAcc.id;

      await tx.journalItem.createMany({
        data: [
          { journal_entry_id: je.id, account_id: debitAccId, debit: payment.amount, credit: 0 },
          { journal_entry_id: je.id, account_id: creditAccId, debit: 0, credit: payment.amount }
        ]
      });

      // Link JE to Payment
      await tx.payment.update({
        where: { id: payment.id },
        data: { journal_entry_id: je.id }
      });

      return payment;
    });

    res.status(201).json(newPayment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error registering payment' });
  }
});

module.exports = router;
