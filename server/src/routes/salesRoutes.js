const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const prisma = require('../db');

// List Sales Orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const sos = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        lines: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(sos);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sales orders' });
  }
});

// Create Sales Order (or Quotation)
router.post('/', authenticateToken, async (req, res) => {
  const { customer_id, expected_date, lines } = req.body;
  
  try {
    // Generate SO Number
    const count = await prisma.salesOrder.count();
    const so_number = `SO${String(count + 1).padStart(5, '0')}`;

    const newSO = await prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.create({
        data: {
          so_number,
          customer_id: parseInt(customer_id),
          date: req.body.date ? new Date(req.body.date) : new Date(),
          status: 'draft',
          created_by: req.user.id
        }
      });

      let amount_untaxed = 0;
      const lineCreates = lines.map(line => {
        const qty = parseFloat(line.quantity || 0);
        const price = parseFloat(line.unit_price || 0);
        const subtotal = qty * price;
        amount_untaxed += subtotal;
        
        return {
          so_id: so.id,
          product_id: parseInt(line.product_id),
          analytic_account_id: line.analytic_account_id ? parseInt(line.analytic_account_id) : null,
          description: line.description || '',
          quantity: qty,
          unit_price: price,
          subtotal: subtotal
        };
      });

      await tx.salesOrderLine.createMany({ data: lineCreates });
      
      const updatedSO = await tx.salesOrder.update({
        where: { id: so.id },
        data: {
          subtotal: amount_untaxed,
          total: amount_untaxed // Simplified, no tax yet
        },
        include: { lines: true, customer: true }
      });

      return updatedSO;
    });

    res.status(201).json(newSO);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating sales order' });
  }
});

// Confirm Quotation -> Sales Order
router.post('/:id/confirm', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.findUnique({
        where: { id: parseInt(id) },
        include: { lines: true }
      });

      // Check and update stock
      for (const line of so.lines) {
        if (line.product_id) {
          const product = await tx.product.findUnique({ where: { id: line.product_id } });
          const stock = Number(product.stock);
          const reqQty = Number(line.quantity);
          if (stock < reqQty) {
            const lacking = reqQty - stock;
            throw new Error(`You don't have enough stock for "${product.name}". You need ${reqQty}, but only have ${stock} in stock. You are lacking ${lacking} item(s).`);
          }
          
          await tx.product.update({
            where: { id: line.product_id },
            data: { stock: Number(product.stock) - Number(line.quantity) }
          });
        }
      }

      return tx.salesOrder.update({
        where: { id: parseInt(id) },
        data: { status: 'confirmed' }
      });
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Error confirming order' });
  }
});

module.exports = router;
