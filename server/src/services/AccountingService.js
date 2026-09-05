import prisma from '../../prisma/client.js';

class AccountingService {
  /**
   * Validates and creates a balanced double-entry journal entry.
   * @param {Object} data - The journal entry data including items
   * @param {Object} tx - Optional Prisma transaction client
   * @returns {Promise<Object>} The created journal entry
   */
  async createJournalEntry(data, tx = prisma) {
    const { journal_id, date, reference, source_type, source_id, created_by, items } = data;

    // Validate that we have at least 2 items
    if (!items || items.length < 2) {
      throw new Error('A journal entry must have at least two items.');
    }

    // Calculate total debit and total credit
    let totalDebit = 0;
    let totalCredit = 0;

    for (const item of items) {
      const debit = parseFloat(item.debit || 0);
      const credit = parseFloat(item.credit || 0);

      if (debit > 0 && credit > 0) {
        throw new Error('A single journal item cannot have both debit and credit.');
      }

      totalDebit += debit;
      totalCredit += credit;
    }

    // Use a small epsilon to handle floating point/decimal comparison safely
    const epsilon = 0.0001;
    if (Math.abs(totalDebit - totalCredit) > epsilon) {
      throw new Error(`Double-entry accounting mismatch: Total Debit (${totalDebit.toFixed(2)}) does not equal Total Credit (${totalCredit.toFixed(2)}).`);
    }

    // Create the entry inside the transaction
    const journalEntry = await tx.journalEntry.create({
      data: {
        journal_id,
        date: new Date(date),
        reference,
        source_type,
        source_id,
        total_debit: totalDebit,
        total_credit: totalCredit,
        created_by,
        state: 'posted', // For simplicity, we post immediately. In a real system, might be draft first.
        items: {
          create: items.map(item => ({
            account_id: item.account_id,
            analytic_account_id: item.analytic_account_id || null,
            debit: parseFloat(item.debit || 0),
            credit: parseFloat(item.credit || 0),
            description: item.description
          }))
        }
      },
      include: {
        items: true
      }
    });

    return journalEntry;
  }
}

export default new AccountingService();
