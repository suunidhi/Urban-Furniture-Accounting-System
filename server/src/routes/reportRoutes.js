const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const prisma = require('../db');

// Helper to calculate balance of an account
// Normal Balance: Assets/Expenses -> Debit - Credit
// Normal Balance: Liabilities/Income/Capital -> Credit - Debit
const calculateBalance = (accountType, totalDebit, totalCredit) => {
  if (accountType === 'asset' || accountType === 'expense') {
    return Number(totalDebit) - Number(totalCredit);
  } else {
    return Number(totalCredit) - Number(totalDebit);
  }
};

// Get Balance Sheet
router.get('/balance-sheet', authenticateToken, async (req, res) => {
  try {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { type: { in: ['asset', 'liability', 'capital'] } },
      include: { journal_items: true }
    });

    const report = {
      assets: [],
      liabilities: [],
      capital: [],
      total_assets: 0,
      total_liabilities: 0,
      total_capital: 0
    };

    accounts.forEach(acc => {
      let totalDebit = 0;
      let totalCredit = 0;
      acc.journal_items.forEach(item => {
        totalDebit += Number(item.debit);
        totalCredit += Number(item.credit);
      });

      const balance = calculateBalance(acc.type, totalDebit, totalCredit);
      
      const accData = { id: acc.id, code: acc.code, name: acc.name, balance };
      
      if (acc.type === 'asset') {
        report.assets.push(accData);
        report.total_assets += balance;
      } else if (acc.type === 'liability') {
        report.liabilities.push(accData);
        report.total_liabilities += balance;
      } else if (acc.type === 'capital') {
        report.capital.push(accData);
        report.total_capital += balance;
      }
    });

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating Balance Sheet' });
  }
});

// Get Profit & Loss
router.get('/profit-loss', authenticateToken, async (req, res) => {
  try {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { type: { in: ['income', 'expense'] } },
      include: { journal_items: true }
    });

    const report = {
      income: [],
      expenses: [],
      total_income: 0,
      total_expenses: 0,
      net_profit: 0
    };

    accounts.forEach(acc => {
      let totalDebit = 0;
      let totalCredit = 0;
      acc.journal_items.forEach(item => {
        totalDebit += Number(item.debit);
        totalCredit += Number(item.credit);
      });

      const balance = calculateBalance(acc.type, totalDebit, totalCredit);
      
      const accData = { id: acc.id, code: acc.code, name: acc.name, balance };
      
      if (acc.type === 'income') {
        report.income.push(accData);
        report.total_income += balance;
      } else if (acc.type === 'expense') {
        report.expenses.push(accData);
        report.total_expenses += balance;
      }
    });

    report.net_profit = report.total_income - report.total_expenses;

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating Profit & Loss' });
  }
});

module.exports = router;
