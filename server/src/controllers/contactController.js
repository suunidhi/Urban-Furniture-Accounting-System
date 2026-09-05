import prisma from '../../prisma/client.js';

export const getContacts = async (req, res) => {
  try {
    const { type, search } = req.query;
    const where = { status: 'active' };

    if (type && type !== 'all') where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } }
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getContactById = async (req, res) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: Number(req.params.id) }
    });
    if (contact) res.json(contact);
    else res.status(404).json({ message: 'Contact not found' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createContact = async (req, res) => {
  try {
    const { name, type, email, mobile, address_line, city, state, pincode } = req.body;

    // Build image path if file was uploaded
    const profile_image = req.file
      ? `/uploads/contacts/${req.file.filename}`
      : undefined;

    const contact = await prisma.contact.create({
      data: {
        name,
        type: type || 'customer',
        email: email || null,
        mobile: mobile || null,
        address_line: address_line || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        profile_image,
        status: 'active'
      }
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const updateContact = async (req, res) => {
  try {
    // Admin-only check
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can edit contacts' });
    }

    const { name, type, email, mobile, address_line, city, state, pincode, status } = req.body;

    const data = { name, type, email, mobile, address_line, city, state, pincode, status };

    // If a new image was uploaded, update it
    if (req.file) {
      data.profile_image = `/uploads/contacts/${req.file.filename}`;
    }

    const contact = await prisma.contact.update({
      where: { id: Number(req.params.id) },
      data
    });

    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const archiveContact = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can archive contacts' });
    }
    const contact = await prisma.contact.update({
      where: { id: Number(req.params.id) },
      data: { status: 'archived' }
    });
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
