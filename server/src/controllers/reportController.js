import prisma from '../../prisma/client.js';

/**
 * Balance Sheet: Assets vs Liabilities + Capital
 * Calculates net balance per account from all posted journal items.
 */
export const getBalanceSheet = async (req, res) => {
  try {
    const { date } = req.query; // optional as-of date
    const asOf = date ? new Date(date) : new Date();

    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        type: { in: ['asset', 'liability', 'capital'] },
        is_active: true
      },
      include: {
        journalItems: {
          where: {
            journalEntry: {
              state: 'posted',
              date: { lte: asOf }
            }
          }
        }
      },
      orderBy: [{ type: 'asc' }, { code: 'asc' }]
    });

    const groups = { asset: [], liability: [], capital: [] };

    for (const account of accounts) {
      const totalDebit = account.journalItems.reduce((s, i) => s + parseFloat(i.debit || 0), 0);
      const totalCredit = account.journalItems.reduce((s, i) => s + parseFloat(i.credit || 0), 0);

      // Asset: net = debit - credit (normal debit balance)
      // Liability / Capital: net = credit - debit (normal credit balance)
      const net = account.type === 'asset'
        ? totalDebit - totalCredit
        : totalCredit - totalDebit;

      if (net !== 0 || account.journalItems.length > 0) {
        groups[account.type].push({
          id: account.id,
          code: account.code,
          name: account.name,
          debit: totalDebit,
          credit: totalCredit,
          net
        });
      }
    }

    const totalAssets = groups.asset.reduce((s, a) => s + a.net, 0);
    const totalLiabilities = groups.liability.reduce((s, a) => s + a.net, 0);
    const totalCapital = groups.capital.reduce((s, a) => s + a.net, 0);

    res.json({
      as_of: asOf,
      assets: groups.asset,
      liabilities: groups.liability,
      capital: groups.capital,
      totals: {
        assets: totalAssets,
        liabilities: totalLiabilities,
        capital: totalCapital,
        liabilities_and_capital: totalLiabilities + totalCapital
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Profit & Loss: Income vs Expenses for a period
 */
export const getProfitAndLoss = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = to ? new Date(to) : new Date();

    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        type: { in: ['income', 'expense'] },
        is_active: true
      },
      include: {
        journalItems: {
          where: {
            journalEntry: {
              state: 'posted',
              date: { gte: fromDate, lte: toDate }
            }
          }
        }
      },
      orderBy: [{ type: 'asc' }, { code: 'asc' }]
    });

    const income = [];
    const expenses = [];

    for (const account of accounts) {
      const totalDebit = account.journalItems.reduce((s, i) => s + parseFloat(i.debit || 0), 0);
      const totalCredit = account.journalItems.reduce((s, i) => s + parseFloat(i.credit || 0), 0);

      // Income: normal credit balance
      // Expense: normal debit balance
      const net = account.type === 'income'
        ? totalCredit - totalDebit
        : totalDebit - totalCredit;

      const entry = { id: account.id, code: account.code, name: account.name, debit: totalDebit, credit: totalCredit, net };

      if (account.type === 'income') income.push(entry);
      else expenses.push(entry);
    }

    const totalIncome = income.reduce((s, a) => s + a.net, 0);
    const totalExpenses = expenses.reduce((s, a) => s + a.net, 0);
    const netProfit = totalIncome - totalExpenses;

    res.json({
      period: { from: fromDate, to: toDate },
      income,
      expenses,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        net_profit: netProfit
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Budget Report: Planned vs Committed vs Achieved for all budgets in period
 */
export const getBudgetReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    const where = {};
    if (from) where.period_start = { gte: new Date(from) };
    if (to) where.period_end = { lte: new Date(to) };

    const budgets = await prisma.budget.findMany({
      where: { ...where, status: { not: 'cancelled' } },
      include: {
        analyticAccount: true,
        responsiblePerson: { select: { id: true, name: true } }
      },
      orderBy: { period_start: 'asc' }
    });

    const rows = await Promise.all(budgets.map(async (b) => {
      const planned = parseFloat(b.planned_amount || 0);

      // Achieved: sum of debit journal items on the analytic account in the period
      let achieved = 0;
      if (b.analytic_account_id) {
        const items = await prisma.journalItem.findMany({
          where: {
            analytic_account_id: b.analytic_account_id,
            journalEntry: {
              state: 'posted',
              date: { gte: b.period_start, lte: b.period_end }
            }
          }
        });
        achieved = items.reduce((s, i) => s + parseFloat(i.debit || 0), 0);
      }

      // Committed: confirmed/billed POs in the period
      const pos = await prisma.purchaseOrder.findMany({
        where: {
          status: { in: ['confirmed', 'billed'] },
          date: { gte: b.period_start, lte: b.period_end }
        }
      });
      const committed = pos.reduce((s, p) => s + parseFloat(p.total || 0), 0);

      const variance = planned - achieved;
      const utilization = planned > 0 ? (achieved / planned) * 100 : 0;

      return {
        id: b.id,
        name: b.name,
        period_start: b.period_start,
        period_end: b.period_end,
        analytic_account: b.analyticAccount?.name || '—',
        responsible_person: b.responsiblePerson?.name || '—',
        status: b.status,
        planned,
        committed,
        achieved,
        variance,
        utilization_pct: utilization,
        over_budget: achieved > planned
      };
    }));

    const totals = {
      planned: rows.reduce((s, r) => s + r.planned, 0),
      committed: rows.reduce((s, r) => s + r.committed, 0),
      achieved: rows.reduce((s, r) => s + r.achieved, 0),
      variance: rows.reduce((s, r) => s + r.variance, 0)
    };

    res.json({ rows, totals, generated_at: new Date() });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
