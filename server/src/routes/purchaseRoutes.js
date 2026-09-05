const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const prisma = require('../db');

// List Purchase Orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        vendor: true,
        lines: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching purchase orders' });
  }
});

// Create Purchase Order
router.post('/', authenticateToken, async (req, res) => {
  const { vendor_id, lines } = req.body;
  // lines = [{ product_id, description, quantity, unit_price }]
  
  try {
    // Generate PO Number
    const count = await prisma.purchaseOrder.count();
    const po_number = `PO${String(count + 1).padStart(5, '0')}`;

    const newPO = await prisma.$transaction(async (tx) => {
      // Create PO Header
      const po = await tx.purchaseOrder.create({
        data: {
          po_number,
          vendor_id: parseInt(vendor_id),
          date: req.body.date ? new Date(req.body.date) : new Date(),
          status: 'draft',
          created_by: req.user.id
        }
      });

      // Create Lines and calculate totals
      let amount_untaxed = 0;
      const lineCreates = lines.map(line => {
        const qty = parseFloat(line.quantity || 0);
        const price = parseFloat(line.unit_price || 0);
        const subtotal = qty * price;
        amount_untaxed += subtotal;
        
        return {
          po_id: po.id,
          product_id: parseInt(line.product_id),
          analytic_account_id: line.analytic_account_id ? parseInt(line.analytic_account_id) : null,
          description: line.description || '',
          quantity: qty,
          unit_price: price,
          subtotal: subtotal
        };
      });

      await tx.purchaseOrderLine.createMany({ data: lineCreates });
      
      // Update PO Totals
      const updatedPO = await tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          total: amount_untaxed
        },
        include: { lines: true, vendor: true }
      });

      return updatedPO;
    });

    res.status(201).json(newPO);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating purchase order' });
  }
});

// Confirm PO -> Purchase
router.post('/:id/confirm', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.purchaseOrder.update({
      where: { id: parseInt(id) },
      data: { status: 'confirmed' }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error confirming PO' });
  }
});

module.exports = router;
