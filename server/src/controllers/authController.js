import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma/client.js';

const generateToken = (id, role, contactId) => {
  return jwt.sign({ id, role, contactId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ── Password validation ──────────────────────────────────────────────────────
// >8 chars, at least one lowercase, one uppercase, one special character
const validatePassword = (password) => {
  if (!password || password.length <= 8) return 'Password must be more than 8 characters';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character';
  return null;
};

// ── Login Id validation ─────────────────────────────────────────────────────
// Unique, 6-12 chars
const validateLoginId = (login_id) => {
  if (!login_id) return 'Login Id is required';
  if (login_id.length < 6 || login_id.length > 12) return 'Login Id must be between 6 and 12 characters';
  return null;
};

// ── POST /api/auth/login ─────────────────────────────────────────────────────
// Accepts login_id + password
export const login = async (req, res) => {
  try {
    const { login_id, password } = req.body;

    if (!login_id || !password) {
      return res.status(400).json({ message: 'Invalid Login Id or Password' });
    }

    const user = await prisma.user.findUnique({ where: { login_id } });

    if (user && user.is_active && (await bcrypt.compare(password, user.password_hash))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        login_id: user.login_id,
        role: user.role,
        contact_id: user.contact_id,
        token: generateToken(user.id, user.role, user.contact_id),
      });
    } else {
      res.status(401).json({ message: 'Invalid Login Id or Password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
// Public signup → creates a contact-role user (invoice portal)
export const signup = async (req, res) => {
  try {
    const { login_id, email, password, confirm_password } = req.body;

    // Validate login_id
    const loginIdErr = validateLoginId(login_id);
    if (loginIdErr) return res.status(400).json({ message: loginIdErr });

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Validate password
    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ message: passErr });

    if (password !== confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check for duplicates
    const existingLoginId = await prisma.user.findUnique({ where: { login_id } });
    if (existingLoginId) return res.status(400).json({ message: 'Login Id already exists' });

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) return res.status(400).json({ message: 'Email Id already registered' });

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: login_id, // default name = login id; can be updated later
        email,
        login_id,
        password_hash,
        role: 'contact', // public signup = limited contact/portal user
      },
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      login_id: user.login_id,
      role: user.role,
      token: generateToken(user.id, user.role, null),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── POST /api/auth/users ───────────────────────────────────────────────────────
// Admin-only: Create an Accountant or Admin user
export const createUser = async (req, res) => {
  try {
    const { name, login_id, email, role, password, confirm_password } = req.body;

    // Only admins can create users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can create users' });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    const loginIdErr = validateLoginId(login_id);
    if (loginIdErr) return res.status(400).json({ message: loginIdErr });

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ message: passErr });

    if (password !== confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!['accountant', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingLoginId = await prisma.user.findUnique({ where: { login_id } });
    if (existingLoginId) return res.status(400).json({ message: 'Login Id already exists' });

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) return res.status(400).json({ message: 'Email Id already registered' });

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name: name.trim(), email, login_id, password_hash, role },
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      login_id: user.login_id,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, login_id: true, role: true, contact_id: true }
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
