import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/signup', AuthController.signup);
router.post('/verify-signup-otp', AuthController.verifySignupOtp);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.get('/me', authenticate, AuthController.getMe);

// Admin-only user management
router.post('/create-user', authenticate, requireRole([UserRole.ADMIN]), AuthController.createUser);
router.get('/users', authenticate, requireRole([UserRole.ADMIN]), AuthController.listUsers);
router.patch('/users/:id/status', authenticate, requireRole([UserRole.ADMIN]), AuthController.updateUserStatus);

export default router;
