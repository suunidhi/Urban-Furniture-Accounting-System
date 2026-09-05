import prisma from '../../prisma/client.js';

/**
 * Calculates budget actuals:
 * - committed_amount: sum of posted vendor bill lines for the analytic account in the period
 * - achieved_amount:  sum of debit journal items for the analytic account in the period
 */
async function calculateBudgetActuals(budget) {
  const { analytic_account_id, period_start, period_end } = budget;

  if (!analytic_account_id) {
    return { committed_amount: 0, achieved_amount: 0 };
  }

  // Achieved: actual posted journal items with this analytic account in the period
  const journalItems = await prisma.journalItem.findMany({
    where: {
      analytic_account_id,
      journalEntry: {
        state: 'posted',
        date: {
          gte: new Date(period_start),
          lte: new Date(period_end)
        }
      }
    }
  });

  const achieved_amount = journalItems.reduce((sum, item) => sum + parseFloat(item.debit || 0), 0);

  // Committed: posted vendor bills in the period (source_type = vendor_bill) linked via journal entries
  // We look at purchase order totals (confirmed/billed) within the period as "committed"
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      status: { in: ['confirmed', 'billed'] },
      date: {
        gte: new Date(period_start),
        lte: new Date(period_end)
      }
    }
  });

  const committed_amount = purchaseOrders.reduce((sum, po) => sum + parseFloat(po.total || 0), 0);

  return { committed_amount, achieved_amount };
}

export const getBudgets = async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      include: {
        analyticAccount: true,
        responsiblePerson: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getBudgetById = async (req, res) => {
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        analyticAccount: true,
        responsiblePerson: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } }
      }
    });

    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    // Enrich with live calculation
    const actuals = await calculateBudgetActuals(budget);
    res.json({ ...budget, ...actuals });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createBudget = async (req, res) => {
  try {
    const { name, period_start, period_end, analytic_account_id, responsible_person_id, planned_amount, notes } = req.body;

    if (!name) return res.status(400).json({ message: 'Budget name is required' });
    if (!period_start || !period_end) return res.status(400).json({ message: 'Period start and end dates are required' });
    if (new Date(period_start) >= new Date(period_end)) {
      return res.status(400).json({ message: 'Period start must be before period end' });
    }

    const budget = await prisma.budget.create({
      data: {
        name,
        period_start: new Date(period_start),
        period_end: new Date(period_end),
        analytic_account_id: analytic_account_id ? Number(analytic_account_id) : null,
        responsible_person_id: responsible_person_id ? Number(responsible_person_id) : null,
        planned_amount: parseFloat(planned_amount) || 0,
        committed_amount: 0,
        achieved_amount: 0,
        status: 'draft',
        notes: notes || null,
        created_by: req.user.id
      },
      include: {
        analyticAccount: true,
        responsiblePerson: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Budget not found' });
    if (existing.status === 'cancelled') return res.status(400).json({ message: 'Cancelled budgets cannot be edited' });

    const { name, period_start, period_end, analytic_account_id, responsible_person_id, planned_amount, notes, status } = req.body;

    const updated = await prisma.budget.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        period_start: period_start ? new Date(period_start) : existing.period_start,
        period_end: period_end ? new Date(period_end) : existing.period_end,
        analytic_account_id: analytic_account_id !== undefined ? (analytic_account_id ? Number(analytic_account_id) : null) : existing.analytic_account_id,
        responsible_person_id: responsible_person_id !== undefined ? (responsible_person_id ? Number(responsible_person_id) : null) : existing.responsible_person_id,
        planned_amount: planned_amount !== undefined ? parseFloat(planned_amount) : existing.planned_amount,
        notes: notes !== undefined ? notes : existing.notes,
        status: status ?? existing.status
      },
      include: {
        analyticAccount: true,
        responsiblePerson: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Budget not found' });
    if (existing.status !== 'draft') return res.status(400).json({ message: 'Only draft budgets can be deleted' });
    await prisma.budget.delete({ where: { id } });
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const confirmBudget = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Budget not found' });
    if (existing.status !== 'draft') return res.status(400).json({ message: 'Only draft budgets can be confirmed' });

    const updated = await prisma.budget.update({
      where: { id },
      data: { status: 'confirmed' },
      include: {
        analyticAccount: true,
        responsiblePerson: { select: { id: true, name: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const cancelBudget = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Budget not found' });

    const updated = await prisma.budget.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        analyticAccount: true,
        responsiblePerson: { select: { id: true, name: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Recalculates and syncs committed + achieved amounts for a budget from live data.
 */
export const recalculateBudget = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    const { committed_amount, achieved_amount } = await calculateBudgetActuals(budget);

    const updated = await prisma.budget.update({
      where: { id },
      data: { committed_amount, achieved_amount },
      include: {
        analyticAccount: true,
        responsiblePerson: { select: { id: true, name: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Returns all budgets enriched with live calculated actuals.
 */
export const getBudgetSummary = async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: { status: { not: 'cancelled' } },
      include: {
        analyticAccount: true,
        responsiblePerson: { select: { id: true, name: true } }
      },
      orderBy: { period_start: 'desc' }
    });

    const enriched = await Promise.all(
      budgets.map(async (b) => {
        const actuals = await calculateBudgetActuals(b);
        const planned = parseFloat(b.planned_amount);
        const committed = actuals.committed_amount;
        const achieved = actuals.achieved_amount;
        const remaining = planned - achieved;
        const utilization = planned > 0 ? (achieved / planned) * 100 : 0;

        return {
          ...b,
          committed_amount: committed,
          achieved_amount: achieved,
          remaining_amount: remaining,
          utilization_pct: utilization
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
