const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const prisma = require('../db');

// ---- CHART OF ACCOUNTS ----

// List accounts
router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const accounts = await prisma.chartOfAccount.findMany({
      orderBy: { code: 'asc' }
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching accounts' });
  }
});

// Create account
router.post('/accounts', authenticateToken, async (req, res) => {
  const { code, name, type } = req.body;
  try {
    const newAccount = await prisma.chartOfAccount.create({
      data: {
        code,
        name,
        type
      }
    });
    res.status(201).json(newAccount);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating account' });
  }
});

// Update account
router.put('/accounts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { code, name, type } = req.body;
  try {
    const updatedAccount = await prisma.chartOfAccount.update({
      where: { id: parseInt(id) },
      data: {
        code,
        name,
        type
      }
    });
    res.json(updatedAccount);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating account' });
  }
});

// ---- JOURNALS ----

// List journals
router.get('/journals', authenticateToken, async (req, res) => {
  try {
    const journals = await prisma.journal.findMany({
      include: {
        default_debit_account: true,
        default_credit_account: true
      },
      orderBy: { id: 'asc' }
    });
    res.json(journals);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching journals' });
  }
});

// Create journal
router.post('/journals', authenticateToken, async (req, res) => {
  const { name, type, code, default_debit_account_id, default_credit_account_id } = req.body;
  try {
    const newJournal = await prisma.journal.create({
      data: {
        name,
        type,
        code,
        default_debit_account_id: default_debit_account_id ? parseInt(default_debit_account_id) : null,
        default_credit_account_id: default_credit_account_id ? parseInt(default_credit_account_id) : null
      }
    });
    res.status(201).json(newJournal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating journal' });
  }
});

// Update journal
router.put('/journals/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, type, code, default_debit_account_id, default_credit_account_id } = req.body;
  try {
    const updatedJournal = await prisma.journal.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        code,
        default_debit_account_id: default_debit_account_id ? parseInt(default_debit_account_id) : null,
        default_credit_account_id: default_credit_account_id ? parseInt(default_credit_account_id) : null
      }
    });
    res.json(updatedJournal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating journal' });
  }
});

// ---- JOURNAL ENTRIES ----

// List journal entries
router.get('/journal-entries', authenticateToken, async (req, res) => {
  try {
    const entries = await prisma.journalEntry.findMany({
      include: {
        journal: true,
        items: {
          include: { account: true, analytic_account: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching journal entries' });
  }
});

// Create manual journal entry
router.post('/journal-entries', authenticateToken, async (req, res) => {
  const { journal_id, date, reference, items } = req.body;
  try {
    // Basic validation
    let totalDebit = 0;
    let totalCredit = 0;
    items.forEach(i => {
      totalDebit += parseFloat(i.debit) || 0;
      totalCredit += parseFloat(i.credit) || 0;
    });

    // Check if balanced (accounting standard)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ message: 'Debit and Credit must match' });
    }

    // Reference number logic
    const entryCount = await prisma.journalEntry.count();
    const generatedRef = reference || `JRN/2026/${String(entryCount + 1).padStart(4, '0')}`;

    const newEntry = await prisma.journalEntry.create({
      data: {
        journal_id: parseInt(journal_id),
        date: new Date(date),
        reference: generatedRef,
        source_type: 'manual',
        state: 'draft',
        total_debit: totalDebit,
        total_credit: totalCredit,
        created_by: req.user.userId,
        items: {
          create: items.map(item => ({
            account_id: parseInt(item.account_id),
            analytic_account_id: item.analytic_account_id ? parseInt(item.analytic_account_id) : null,
            debit: parseFloat(item.debit) || 0,
            credit: parseFloat(item.credit) || 0,
            description: item.description
          }))
        }
      },
      include: {
        items: true,
        journal: true
      }
    });

    res.status(201).json(newEntry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating journal entry' });
  }
});

// Post journal entry
router.post('/journal-entries/:id/post', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.journalEntry.update({
      where: { id: parseInt(id) },
      data: { state: 'posted' }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error posting journal entry' });
  }
});

module.exports = router;
