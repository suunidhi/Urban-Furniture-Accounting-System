const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, contact_id: user.contact_id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userRole = role || 'accountant';

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        role: userRole,
      }
    });

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        contact_id: null
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    delete user.password_hash;

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        contact_id: true,
        is_active: true,
        created_at: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ message: 'Server error fetching user data' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    await prisma.user.update({
      where: { email },
      data: {
        reset_token: otp,
        reset_expires: expires
      }
    });

    res.json({ message: 'OTP sent to email successfully', otp: otp });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        reset_token: otp,
        reset_expires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        reset_token: otp,
        reset_expires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email },
      data: {
        password_hash: hashedPassword,
        reset_token: null,
        reset_expires: null
      }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  signup,
  login,
  me,
  forgotPassword,
  verifyOTP,
  resetPassword
};
