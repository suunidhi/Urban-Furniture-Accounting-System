import prisma from '../../prisma/client.js';

export const getAnalyticAccounts = async (req, res) => {
  try {
    const analyticAccounts = await prisma.analyticAccount.findMany({
      where: { is_active: true }
    });
    res.json(analyticAccounts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createAnalyticAccount = async (req, res) => {
  try {
    const { name, type } = req.body;
    const account = await prisma.analyticAccount.create({
      data: { name, type }
    });
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
