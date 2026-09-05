import prisma from '../../prisma/client.js';
import accountingService from '../services/AccountingService.js';

export const getCustomerPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { type: 'customer' },
      include: {
        partner: true,
        creator: { select: { id: true, name: true } },
        allocations: { include: { customerInvoice: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createCustomerPayment = async (req, res) => {
  try {
    const { customer_id, invoice_id, amount, payment_method, date, reference } = req.body;

    if (!customer_id) return res.status(400).json({ message: 'Customer is required' });
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ message: 'Payment amount must be greater than zero' });
    if (!payment_method || !['cash', 'bank'].includes(payment_method)) return res.status(400).json({ message: 'Payment method must be cash or bank' });

    let invoice = null;
    if (invoice_id) {
      invoice = await prisma.customerInvoice.findUnique({
        where: { id: Number(invoice_id) },
        include: { customer: true }
      });
      if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
      if (!['posted', 'partly_paid'].includes(invoice.status)) {
        return res.status(400).json({ message: 'Can only collect payment on posted or partly-paid invoices' });
      }
      const payAmount = parseFloat(amount);
      const outstanding = parseFloat(invoice.outstanding_amount);
      if (payAmount > outstanding + 0.001) {
        return res.status(400).json({
          message: `Payment amount (${payAmount.toFixed(2)}) exceeds outstanding balance (${outstanding.toFixed(2)})`
        });
      }
    }

    // Find required accounts
    const receivableAccount = await prisma.chartOfAccount.findFirst({ where: { type: 'asset', is_active: true } });
    const cashBankAccount = await prisma.chartOfAccount.findFirst({ where: { type: 'asset', is_active: true } });
    const paymentJournal = payment_method === 'bank'
      ? await prisma.journal.findFirst({ where: { type: 'bank', is_active: true } })
      : await prisma.journal.findFirst({ where: { type: 'cash', is_active: true } });
    const fallbackJournal = paymentJournal || await prisma.journal.findFirst({ where: { is_active: true } });

    if (!receivableAccount || !cashBankAccount || !fallbackJournal) {
      return res.status(400).json({ message: 'Cannot register payment: Missing accounting setup.' });
    }

    const payAmount = parseFloat(amount);
    const count = await prisma.payment.count();
    const payment_number = `RCPT-${String(count + 1).padStart(5, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      // Journal Entry: Debit Cash/Bank (asset increases), Credit AR (asset decreases)
      const journalEntry = await accountingService.createJournalEntry({
        journal_id: fallbackJournal.id,
        date: date || new Date(),
        reference: reference || payment_number,
        source_type: 'payment',
        source_id: null,
        created_by: req.user.id,
        items: [
          {
            account_id: cashBankAccount.id,
            debit: payAmount,
            credit: 0,
            description: `Receipt via ${payment_method} — ${invoice?.invoice_number || 'Manual'}`
          },
          {
            account_id: receivableAccount.id,
            debit: 0,
            credit: payAmount,
            description: `Payment from customer`
          }
        ]
      }, tx);

      const payment = await tx.payment.create({
        data: {
          payment_number,
          type: 'customer',
          partner_id: Number(customer_id),
          amount: payAmount,
          payment_method,
          date: new Date(date || new Date()),
          reference: reference || null,
          journal_entry_id: journalEntry.id,
          status: 'posted',
          created_by: req.user.id
        }
      });

      await tx.journalEntry.update({
        where: { id: journalEntry.id },
        data: { source_id: payment.id }
      });

      if (invoice && invoice_id) {
        await tx.paymentAllocation.create({
          data: {
            payment_id: payment.id,
            invoice_id: Number(invoice_id),
            allocated_amount: payAmount
          }
        });

        const newPaid = parseFloat(invoice.paid_amount) + payAmount;
        const newOutstanding = parseFloat(invoice.total) - newPaid;
        const newStatus = newOutstanding <= 0.001 ? 'paid' : 'partly_paid';

        await tx.customerInvoice.update({
          where: { id: Number(invoice_id) },
          data: {
            paid_amount: newPaid,
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
        allocations: { include: { customerInvoice: true } }
      }
    });

    res.status(201).json(fullPayment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
