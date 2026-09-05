import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { UserRole, RecordStatus } from '@prisma/client';

export class AuthService {
  static async login(loginId: string, password: string) {
    // Exact error message required by mockup and PRD: "Invalid Login Id or Password"
    const user = await prisma.user.findFirst({
      where: {
        loginId: loginId.trim(),
        status: RecordStatus.ACTIVE,
      },
      include: {
        contact: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid Login Id or Password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid Login Id or Password', 401);
    }

    const token = jwt.sign(
      {
        id: user.id,
        loginId: user.loginId,
        email: user.email,
        role: user.role,
        contactId: user.contactId,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash, ...sanitizedUser } = user;

    return {
      token,
      user: sanitizedUser,
    };
  }

  static async signup(data: {
    name: string;
    loginId: string;
    email: string;
    password: string;
    role?: UserRole;
  }) {
    // Check login ID uniqueness
    const existingLogin = await prisma.user.findUnique({
      where: { loginId: data.loginId.trim() },
    });
    if (existingLogin) {
      throw new AppError('Login ID is already taken. Please choose another.', 400);
    }

    // Check email uniqueness
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      throw new AppError('Email address is already registered in the system.', 400);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const assignedRole = data.role || UserRole.ACCOUNTANT;

    // If signing up as CONTACT_USER, link or create contact record
    let linkedContactId: number | null = null;
    if (assignedRole === UserRole.CONTACT_USER) {
      const existingContact = await prisma.contact.findFirst({
        where: { email: normalizedEmail },
      });
      if (existingContact) {
        linkedContactId = existingContact.id;
      } else {
        const newContact = await prisma.contact.create({
          data: {
            name: data.name.trim(),
            email: normalizedEmail,
            type: 'CUSTOMER',
            status: RecordStatus.ACTIVE,
          },
        });
        linkedContactId = newContact.id;
      }
    }

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        loginId: data.loginId.trim(),
        email: normalizedEmail,
        passwordHash,
        role: assignedRole,
        contactId: linkedContactId,
        status: RecordStatus.ACTIVE,
      },
      include: {
        contact: true,
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        loginId: user.loginId,
        email: user.email,
        role: user.role,
        contactId: user.contactId,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...sanitizedUser } = user;

    return {
      token,
      user: sanitizedUser,
    };
  }

  static async createUser(data: {
    name: string;
    loginId: string;
    email: string;
    password: string;
    role: UserRole;
    contactId?: number | null;
  }) {
    const existingLogin = await prisma.user.findUnique({
      where: { loginId: data.loginId.trim() },
    });
    if (existingLogin) {
      throw new AppError('Login ID is already in use.', 400);
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email.trim().toLowerCase() },
    });
    if (existingEmail) {
      throw new AppError('Email address is already in use.', 400);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        loginId: data.loginId.trim(),
        email: data.email.trim().toLowerCase(),
        passwordHash,
        role: data.role,
        contactId: data.contactId || null,
        status: RecordStatus.ACTIVE,
      },
      include: {
        contact: true,
      },
    });

    const { passwordHash: _, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  static async forgotPassword(loginId: string, email: string) {
    const user = await prisma.user.findFirst({
      where: {
        loginId: loginId.trim(),
        email: email.trim().toLowerCase(),
        status: RecordStatus.ACTIVE,
      },
    });

    if (!user) {
      throw new AppError('No active user account found matching the provided Login ID and Email.', 404);
    }

    return {
      message: 'User verified. You may proceed to reset your password.',
    };
  }

  static async resetPassword(loginId: string, email: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        loginId: loginId.trim(),
        email: email.trim().toLowerCase(),
      },
    });

    if (!user) {
      throw new AppError('No account found matching the provided Login ID and Email.', 404);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return {
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  }

  static async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        contact: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  static async listUsers() {
    const users = await prisma.user.findMany({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        role: true,
        status: true,
        contactId: true,
        contact: {
          select: { id: true, name: true, type: true },
        },
        createdAt: true,
      },
    });
    return users;
  }

  static async updateUserStatus(userId: number, status: RecordStatus) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });
    return user;
  }
}
