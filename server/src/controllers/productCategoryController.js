import prisma from '../../prisma/client.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.productCategory.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await prisma.productCategory.create({ data: { name } });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
