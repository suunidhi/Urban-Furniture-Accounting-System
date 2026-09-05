import prisma from '../../prisma/client.js';
import accountingService from '../services/AccountingService.js';

export const getPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { type: 'vendor' },
      include: {
        partner: true,
        creator: {
          select: { id: true, name: true, email: true }
        },
        allocations: {
          include: { vendorBill: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        partner: true,
        creator: {
          select: { id: true, name: true, email: true }
        },
        allocations: {
          include: { vendorBill: true }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createVendorPayment = async (req, res) => {
  try {
    const { vendor_id, bill_id, amount, payment_method, date, reference } = req.body;

    if (!vendor_id) {
      return res.status(400).json({ message: 'Vendor is required' });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than zero' });
    }

    if (!payment_method || !['cash', 'bank'].includes(payment_method)) {
      return res.status(400).json({ message: 'Payment method must be cash or bank' });
    }

    // Get the bill to validate
    let bill = null;
    if (bill_id) {
      bill = await prisma.vendorBill.findUnique({
        where: { id: Number(bill_id) },
        include: { vendor: true }
      });

      if (!bill) {
        return res.status(404).json({ message: 'Vendor bill not found' });
      }

      if (!['posted', 'partly_paid'].includes(bill.status)) {
        return res.status(400).json({ message: 'Can only pay posted or partly-paid bills' });
      }

      const payAmount = parseFloat(amount);
      const outstanding = parseFloat(bill.outstanding_amount);

      if (payAmount > outstanding + 0.001) {
        return res.status(400).json({
          message: `Payment amount (${payAmount.toFixed(2)}) exceeds outstanding balance (${outstanding.toFixed(2)})`
        });
      }
    }

    // Find required accounts for journal entry
    const payableAccount = await prisma.chartOfAccount.findFirst({ where: { type: 'liability', is_active: true } });
    const cashBankAccount = payment_method === 'bank'
      ? await prisma.chartOfAccount.findFirst({ where: { is_active: true, type: 'asset' } })
      : await prisma.chartOfAccount.findFirst({ where: { is_active: true, type: 'asset' } });

    const paymentJournal = payment_method === 'bank'
      ? await prisma.journal.findFirst({ where: { type: 'bank', is_active: true } })
      : await prisma.journal.findFirst({ where: { type: 'cash', is_active: true } });

    const fallbackJournal = paymentJournal || await prisma.journal.findFirst({ where: { is_active: true } });

    if (!payableAccount || !cashBankAccount || !fallbackJournal) {
      return res.status(400).json({
        message: 'Cannot register payment: Missing accounting setup. Please configure accounts and journals first.'
      });
    }

    const payAmount = parseFloat(amount);

    // Generate Payment Number
    const count = await prisma.payment.count();
    const payment_number = `PAY-${String(count + 1).padStart(5, '0')}`;

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create Journal Entry: Debit AP (reduces liability), Credit Cash/Bank (reduces asset)
      const journalEntry = await accountingService.createJournalEntry({
        journal_id: fallbackJournal.id,
        date: date || new Date(),
        reference: reference || payment_number,
        source_type: 'payment',
        source_id: null, // Will update after payment creation
        created_by: req.user.id,
        items: [
          {
            account_id: payableAccount.id,
            debit: payAmount,
            credit: 0,
            description: `Bill payment — ${bill?.bill_number || 'Manual Payment'}`
          },
          {
            account_id: cashBankAccount.id,
            debit: 0,
            credit: payAmount,
            description: `Payment via ${payment_method}`
          }
        ]
      }, tx);

      // Create Payment record
      const payment = await tx.payment.create({
        data: {
          payment_number,
          type: 'vendor',
          partner_id: Number(vendor_id),
          amount: payAmount,
          payment_method,
          date: new Date(date || new Date()),
          reference: reference || null,
          journal_entry_id: journalEntry.id,
          status: 'posted',
          created_by: req.user.id
        }
      });

      // Update journal entry source_id to point to payment
      await tx.journalEntry.update({
        where: { id: journalEntry.id },
        data: { source_id: payment.id }
      });

      // If linked to a bill, create allocation and update bill balance
      if (bill && bill_id) {
        await tx.paymentAllocation.create({
          data: {
            payment_id: payment.id,
            bill_id: Number(bill_id),
            allocated_amount: payAmount
          }
        });

        const newPaidAmount = parseFloat(bill.paid_amount) + payAmount;
        const newOutstanding = parseFloat(bill.total) - newPaidAmount;

        let newStatus = 'partly_paid';
        if (newOutstanding <= 0.001) {
          newStatus = 'paid';
        }

        await tx.vendorBill.update({
          where: { id: Number(bill_id) },
          data: {
            paid_amount: newPaidAmount,
            outstanding_amount: Math.max(0, newOutstanding),
            status: newStatus
          }
        });
      }

      return payment;
    });

    const fullPayment = await prisma.payment.findUnique({
      where: { id: result.id },
      include: {
        partner: true,
        allocations: {
          include: { vendorBill: true }
        }
      }
    });

    res.status(201).json(fullPayment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
