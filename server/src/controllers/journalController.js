import prisma from '../../prisma/client.js';

export const getJournals = async (req, res) => {
  try {
    const journals = await prisma.journal.findMany({
      where: { is_active: true }
    });
    res.json(journals);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createJournal = async (req, res) => {
  try {
    const { name, type, default_debit_account_id, default_credit_account_id } = req.body;
    const journal = await prisma.journal.create({
      data: {
        name,
        type,
        default_debit_account_id: default_debit_account_id ? Number(default_debit_account_id) : null,
        default_credit_account_id: default_credit_account_id ? Number(default_credit_account_id) : null
      }
    });
    res.status(201).json(journal);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
