import prisma from '../../prisma/client.js';

export const getProducts = async (req, res) => {
  try {
    const { search, type } = req.query;
    const where = { status: 'active' };
    if (type && type !== 'all') where.type = type;
    if (search) where.name = { contains: search };

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { category: true }
    });
    if (product) res.json(product);
    else res.status(404).json({ message: 'Product not found' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, type, sales_price, cost_price, category_id } = req.body;

    const image = req.file ? `/uploads/products/${req.file.filename}` : undefined;

    const product = await prisma.product.create({
      data: {
        name,
        type: type || 'goods',
        sales_price: parseFloat(sales_price) || 0,
        cost_price: parseFloat(cost_price) || 0,
        category_id: category_id ? Number(category_id) : null,
        image,
        status: 'active'
      },
      include: { category: true }
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can edit products' });
    }

    const { name, type, sales_price, cost_price, category_id, status } = req.body;
    const data = {
      name,
      type,
      sales_price: parseFloat(sales_price) || 0,
      cost_price: parseFloat(cost_price) || 0,
      category_id: category_id ? Number(category_id) : null,
      status
    };

    if (req.file) data.image = `/uploads/products/${req.file.filename}`;

    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data,
      include: { category: true }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const archiveProduct = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can archive products' });
    }
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: { status: 'archived' }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
