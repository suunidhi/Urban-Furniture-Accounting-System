import prisma from '../../prisma/client.js';

export const getPurchaseOrders = async (req, res) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        vendor: true,
        lines: {
          include: { product: true }
        },
        vendorBills: true,
        creator: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getPurchaseOrderById = async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        vendor: true,
        lines: {
          include: { product: true }
        },
        vendorBills: true,
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!po) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json(po);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createPurchaseOrder = async (req, res) => {
  try {
    const { vendor_id, date, notes, lines } = req.body;
    
    if (!vendor_id) {
      return res.status(400).json({ message: 'Vendor is required' });
    }

    if (!lines || lines.length === 0) {
      return res.status(400).json({ message: 'At least one order line is required' });
    }

    // Generate PO Number
    const count = await prisma.purchaseOrder.count();
    const po_number = `PO-${String(count + 1).padStart(5, '0')}`;

    let total = 0;
    const poLines = lines.map(line => {
      const qty = parseFloat(line.quantity) || 1;
      const price = parseFloat(line.unit_price) || 0;
      const subtotal = qty * price;
      total += subtotal;
      return {
        product_id: line.product_id ? Number(line.product_id) : null,
        description: line.description || '',
        quantity: qty,
        unit_price: price,
        subtotal
      };
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        po_number,
        vendor_id: Number(vendor_id),
        date: new Date(date || new Date()),
        notes: notes || null,
        total,
        created_by: req.user.id,
        lines: {
          create: poLines
        }
      },
      include: {
        vendor: true,
        lines: {
          include: { product: true }
        }
      }
    });

    res.status(201).json(po);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const updatePurchaseOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { vendor_id, date, notes, lines } = req.body;

    const existingPo = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existingPo) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (existingPo.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft purchase orders can be edited' });
    }

    let total = 0;
    const poLines = (lines || []).map(line => {
      const qty = parseFloat(line.quantity) || 1;
      const price = parseFloat(line.unit_price) || 0;
      const subtotal = qty * price;
      total += subtotal;
      return {
        product_id: line.product_id ? Number(line.product_id) : null,
        description: line.description || '',
        quantity: qty,
        unit_price: price,
        subtotal
      };
    });

    // Delete existing lines and re-create
    await prisma.purchaseOrderLine.deleteMany({ where: { po_id: id } });

    const updatedPo = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        vendor_id: vendor_id ? Number(vendor_id) : existingPo.vendor_id,
        date: date ? new Date(date) : existingPo.date,
        notes: notes !== undefined ? notes : existingPo.notes,
        total,
        lines: {
          create: poLines
        }
      },
      include: {
        vendor: true,
        lines: {
          include: { product: true }
        }
      }
    });

    res.json(updatedPo);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existingPo = await prisma.purchaseOrder.findUnique({ where: { id } });
    
    if (!existingPo) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (existingPo.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft purchase orders can be deleted' });
    }

    await prisma.purchaseOrder.delete({ where: { id } });
    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const confirmPurchaseOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });

    if (!po) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    const updatedPo = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'confirmed' },
      include: {
        vendor: true,
        lines: {
          include: { product: true }
        }
      }
    });
    res.json(updatedPo);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createBillFromPurchaseOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { lines: true, vendor: true }
    });

    if (!po) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // Generate Bill Number
    const count = await prisma.vendorBill.count();
    const bill_number = `BILL-${String(count + 1).padStart(5, '0')}`;

    const billLines = po.lines.map(line => ({
      product_id: line.product_id,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      subtotal: line.subtotal
    }));

    const bill = await prisma.vendorBill.create({
      data: {
        bill_number,
        vendor_id: po.vendor_id,
        po_id: po.id,
        invoice_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
        total: po.total,
        paid_amount: 0,
        outstanding_amount: po.total,
        status: 'draft',
        created_by: req.user.id,
        lines: {
          create: billLines
        }
      },
      include: {
        vendor: true,
        lines: {
          include: { product: true }
        }
      }
    });

    // Update PO status to billed
    await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'billed' }
    });

    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
