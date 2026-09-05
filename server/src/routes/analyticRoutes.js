const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const prisma = require('../db');

// ---- ANALYTIC ACCOUNTS ----

router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const accounts = await prisma.analyticAccount.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching analytic accounts' });
  }
});

router.post('/accounts', authenticateToken, async (req, res) => {
  const { name, type } = req.body;
  try {
    const newAccount = await prisma.analyticAccount.create({
      data: { name, type }
    });
    res.status(201).json(newAccount);
  } catch (err) {
    res.status(500).json({ message: 'Error creating analytic account' });
  }
});

router.put('/accounts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, type, is_active } = req.body;
  try {
    const updated = await prisma.analyticAccount.update({
      where: { id: parseInt(id) },
      data: { name, type, is_active: is_active === true || is_active === 'true' }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating analytic account' });
  }
});

// ---- BUDGETS ----

router.get('/budgets', authenticateToken, async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      include: {
        analytic_account: true,
        responsible: { select: { name: true } }
      },
      orderBy: { period_start: 'desc' }
    });

    // Calculate achieved amount for confirmed budgets dynamically
    const enrichedBudgets = await Promise.all(budgets.map(async (budget) => {
      let achieved_amount = 0;
      
      if (budget.status === 'confirmed' && budget.analytic_account_id) {
        // Query journal items for this analytic account within the date range
        // If type is expense (like for POs), we sum debits on expense accounts
        // If type is income (like for SOs), we sum credits on income accounts
        // But to keep it simple and robust, we can just look at JournalItems with this analytic_account_id
        const items = await prisma.journalItem.findMany({
          where: {
            analytic_account_id: budget.analytic_account_id,
            entry: {
              date: {
                gte: budget.period_start,
                lte: budget.period_end
              },
              state: 'posted' // Only count posted entries
            }
          }
        });
        
        const account = await prisma.analyticAccount.findUnique({ where: { id: budget.analytic_account_id } });
        
        if (account?.type === 'expense') {
          // For expenses, we sum Debits
          achieved_amount = items.reduce((sum, item) => sum + Number(item.debit), 0);
        } else if (account?.type === 'income') {
          // For income, we sum Credits
          achieved_amount = items.reduce((sum, item) => sum + Number(item.credit), 0);
        }
      }

      return {
        ...budget,
        achieved_amount: achieved_amount,
        achieved_percent: budget.committed_amount > 0 ? (achieved_amount / Number(budget.committed_amount)) * 100 : 0,
        amount_to_achieve: Number(budget.committed_amount) - achieved_amount
      };
    }));

    res.json(enrichedBudgets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching budgets' });
  }
});

router.post('/budgets', authenticateToken, async (req, res) => {
  const { name, period_start, period_end, analytic_account_id, planned_amount, notes } = req.body;
  try {
    const newBudget = await prisma.budget.create({
      data: {
        name,
        period_start: new Date(period_start),
        period_end: new Date(period_end),
        analytic_account_id: analytic_account_id ? parseInt(analytic_account_id) : null,
        planned_amount: parseFloat(planned_amount) || 0,
        committed_amount: parseFloat(planned_amount) || 0,
        notes,
        created_by: req.user.userId || req.user.id
      }
    });
    res.status(201).json(newBudget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating budget' });
  }
});

router.put('/budgets/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, period_start, period_end, analytic_account_id, planned_amount, notes, status } = req.body;
  try {
    const updated = await prisma.budget.update({
      where: { id: parseInt(id) },
      data: {
        name,
        period_start: period_start ? new Date(period_start) : undefined,
        period_end: period_end ? new Date(period_end) : undefined,
        analytic_account_id: analytic_account_id ? parseInt(analytic_account_id) : undefined,
        planned_amount: planned_amount ? parseFloat(planned_amount) : undefined,
        committed_amount: planned_amount ? parseFloat(planned_amount) : undefined,
        notes,
        status
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating budget' });
  }
});

// Revise Budget
router.post('/budgets/:id/revise', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { new_committed_amount } = req.body;
  
  try {
    const oldBudget = await prisma.budget.findUnique({ where: { id: parseInt(id) } });
    if (!oldBudget || oldBudget.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed budgets can be revised' });
    }

    const revised = await prisma.$transaction(async (tx) => {
      // Mark old budget as revised
      await tx.budget.update({
        where: { id: parseInt(id) },
        data: { status: 'revised' }
      });

      // Create new budget (copy)
      const newName = oldBudget.name.endsWith(' (Revised)') ? oldBudget.name : `${oldBudget.name} (Revised)`;
      const newBudget = await tx.budget.create({
        data: {
          name: newName,
          period_start: oldBudget.period_start,
          period_end: oldBudget.period_end,
          analytic_account_id: oldBudget.analytic_account_id,
          planned_amount: parseFloat(new_committed_amount),
          committed_amount: parseFloat(new_committed_amount),
          notes: oldBudget.notes,
          status: 'confirmed',
          created_by: req.user.userId || req.user.id
        }
      });
      return newBudget;
    });

    res.json(revised);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error revising budget' });
  }
});

module.exports = router;
