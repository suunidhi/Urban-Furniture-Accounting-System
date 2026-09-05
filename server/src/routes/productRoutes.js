const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const prisma = require('../db');

// List products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      include: { category: true }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Create product
router.post('/', authenticateToken, async (req, res) => {
  const { name, type, sales_price, cost_price, category_id } = req.body;
  try {
    const newProduct = await prisma.product.create({
      data: {
        name,
        type,
        sales_price: parseFloat(sales_price || 0),
        cost_price: parseFloat(cost_price || 0),
        category_id: category_id ? parseInt(category_id) : null
      }
    });
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Update product
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, type, sales_price, cost_price, category_id, status } = req.body;
  try {
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        sales_price: parseFloat(sales_price || 0),
        cost_price: parseFloat(cost_price || 0),
        category_id: category_id ? parseInt(category_id) : null,
        status
      }
    });
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete (archive) product
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.update({
      where: { id: parseInt(id) },
      data: { status: 'archived' }
    });
    res.json({ message: 'Product archived' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error archiving product' });
  }
});

// List categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.productCategory.findMany();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Create category
router.post('/categories', authenticateToken, async (req, res) => {
  const { name } = req.body;
  try {
    const newCat = await prisma.productCategory.create({ data: { name } });
    res.status(201).json(newCat);
  } catch (err) {
    res.status(500).json({ message: 'Error creating category' });
  }
});

module.exports = router;
