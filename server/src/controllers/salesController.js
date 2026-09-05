import prisma from '../../prisma/client.js';

export const getSalesOrders = async (req, res) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        lines: { include: { product: true } },
        customerInvoices: true,
        creator: { select: { id: true, name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getSalesOrderById = async (req, res) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        customer: true,
        lines: { include: { product: true } },
        customerInvoices: true,
        creator: { select: { id: true, name: true } }
      }
    });
    if (!order) return res.status(404).json({ message: 'Sales order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createSalesOrder = async (req, res) => {
  try {
    const { customer_id, date, notes, lines } = req.body;

    if (!customer_id) return res.status(400).json({ message: 'Customer is required' });
    if (!lines || lines.length === 0) return res.status(400).json({ message: 'At least one order line is required' });

    const count = await prisma.salesOrder.count();
    const so_number = `SO-${String(count + 1).padStart(5, '0')}`;

    let subtotal = 0;
    let tax_amount = 0;

    const soLines = lines.map(line => {
      const qty = parseFloat(line.quantity) || 1;
      const price = parseFloat(line.unit_price) || 0;
      const tax_rate = parseFloat(line.tax_rate) || 0;
      const lineSub = qty * price;
      const lineTax = lineSub * (tax_rate / 100);
      subtotal += lineSub;
      tax_amount += lineTax;
      return {
        product_id: line.product_id ? Number(line.product_id) : null,
        description: line.description || '',
        quantity: qty,
        unit_price: price,
        tax_rate,
        subtotal: lineSub,
        tax_amount: lineTax,
        total: lineSub + lineTax
      };
    });

    const total = subtotal + tax_amount;

    const order = await prisma.salesOrder.create({
      data: {
        so_number,
        customer_id: Number(customer_id),
        date: new Date(date || new Date()),
        notes: notes || null,
        subtotal,
        tax_amount,
        total,
        created_by: req.user.id,
        lines: { create: soLines }
      },
      include: {
        customer: true,
        lines: { include: { product: true } }
      }
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const updateSalesOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { customer_id, date, notes, lines } = req.body;

    const existing = await prisma.salesOrder.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Sales order not found' });
    if (existing.status !== 'draft') return res.status(400).json({ message: 'Only draft sales orders can be edited' });

    let subtotal = 0;
    let tax_amount = 0;

    const soLines = (lines || []).map(line => {
      const qty = parseFloat(line.quantity) || 1;
      const price = parseFloat(line.unit_price) || 0;
      const tax_rate = parseFloat(line.tax_rate) || 0;
      const lineSub = qty * price;
      const lineTax = lineSub * (tax_rate / 100);
      subtotal += lineSub;
      tax_amount += lineTax;
      return {
        product_id: line.product_id ? Number(line.product_id) : null,
        description: line.description || '',
        quantity: qty,
        unit_price: price,
        tax_rate,
        subtotal: lineSub,
        tax_amount: lineTax,
        total: lineSub + lineTax
      };
    });

    await prisma.salesOrderLine.deleteMany({ where: { so_id: id } });

    const updated = await prisma.salesOrder.update({
      where: { id },
      data: {
        customer_id: customer_id ? Number(customer_id) : existing.customer_id,
        date: date ? new Date(date) : existing.date,
        notes: notes !== undefined ? notes : existing.notes,
        subtotal,
        tax_amount,
        total: subtotal + tax_amount,
        lines: { create: soLines }
      },
      include: {
        customer: true,
        lines: { include: { product: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const deleteSalesOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.salesOrder.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Sales order not found' });
    if (existing.status !== 'draft') return res.status(400).json({ message: 'Only draft sales orders can be deleted' });
    await prisma.salesOrder.delete({ where: { id } });
    res.json({ message: 'Sales order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const confirmSalesOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.salesOrder.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ message: 'Sales order not found' });
    if (order.status !== 'draft') return res.status(400).json({ message: 'Order is already confirmed' });

    const updated = await prisma.salesOrder.update({
      where: { id },
      data: { status: 'confirmed' },
      include: {
        customer: true,
        lines: { include: { product: true } }
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createInvoiceFromSalesOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { lines: true, customer: true }
    });

    if (!order) return res.status(404).json({ message: 'Sales order not found' });
    if (order.status !== 'confirmed') return res.status(400).json({ message: 'Only confirmed sales orders can be invoiced' });

    const count = await prisma.customerInvoice.count();
    const invoice_number = `INV-${String(count + 1).padStart(5, '0')}`;

    const invoiceLines = order.lines.map(line => ({
      product_id: line.product_id,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      tax_rate: line.tax_rate,
      subtotal: line.subtotal,
      tax_amount: line.tax_amount,
      total: line.total
    }));

    const invoice = await prisma.customerInvoice.create({
      data: {
        invoice_number,
        customer_id: order.customer_id,
        so_id: order.id,
        invoice_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        total: order.total,
        paid_amount: 0,
        outstanding_amount: order.total,
        status: 'draft',
        created_by: req.user.id,
        lines: { create: invoiceLines }
      },
      include: {
        customer: true,
        lines: { include: { product: true } }
      }
    });

    await prisma.salesOrder.update({
      where: { id },
      data: { status: 'invoiced' }
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
