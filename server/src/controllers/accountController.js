import prisma from '../../prisma/client.js';

export const getAccounts = async (req, res) => {
  try {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { is_active: true },
      orderBy: { code: 'asc' }
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { code, name, type, parent_id } = req.body;
    const account = await prisma.chartOfAccount.create({
      data: {
        code,
        name,
        type,
        parent_id: parent_id ? Number(parent_id) : null
      }
    });
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
