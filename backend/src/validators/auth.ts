import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const loginSchema = z.object({
  loginId: z.string().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    loginId: z
      .string()
      .min(6, 'Login ID must be at least 6 characters')
      .max(12, 'Login ID cannot exceed 12 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Login ID can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['ADMIN', 'ACCOUNTANT', 'CONTACT_USER']).default('ACCOUNTANT'),
    password: z
      .string()
      .min(8, 'Password must be more than 8 characters')
      .regex(
        passwordRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, and one special character'
      ),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const createUserSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    loginId: z
      .string()
      .min(6, 'Login ID must be at least 6 characters')
      .max(12, 'Login ID cannot exceed 12 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Login ID can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['ADMIN', 'ACCOUNTANT', 'CONTACT_USER']),
    contactId: z.number().optional().nullable(),
    password: z
      .string()
      .min(8, 'Password must be more than 8 characters')
      .regex(
        passwordRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, and one special character'
      ),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  loginId: z.string().min(1, 'Login ID is required'),
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z
  .object({
    loginId: z.string().min(1, 'Login ID is required'),
    email: z.string().email('Invalid email address'),
    newPassword: z
      .string()
      .min(8, 'Password must be more than 8 characters')
      .regex(
        passwordRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, and one special character'
      ),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
