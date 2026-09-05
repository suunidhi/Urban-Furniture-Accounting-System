const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const prisma = require('../db');
const bcrypt = require('bcryptjs');

// List contacts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { status: 'active' }
    });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching contacts' });
  }
});

// Create contact
router.post('/', authenticateToken, async (req, res) => {
  const { name, type, email, mobile, address_line, city, state, pincode } = req.body;
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create contact
      const newContact = await tx.contact.create({
        data: {
          name, type, email, mobile, address_line, city, state, pincode
        }
      });
      
      // Auto-create user for contact if email is provided
      if (email) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('contact123', salt);
        
        await tx.user.create({
          data: {
            name,
            email,
            password_hash: hashedPassword,
            role: 'contact',
            contact_id: newContact.id
          }
        });
      }
      
      return newContact;
    });

    res.status(201).json({ message: 'Contact created successfully', id: result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating contact' });
  }
});

module.exports = router;
