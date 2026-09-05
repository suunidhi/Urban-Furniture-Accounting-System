import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import {
  validateLogin,
  validateSignup,
  validateCreateUser,
  validateForgotPassword,
  validateResetPassword,
} from '../validators/auth';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateLogin(req.body);
      const result = await AuthService.login(validated.loginId, validated.password);
      return successResponse(res, result, 'Logged in successfully');
    } catch (error) {
      next(error);
    }
  }

  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateSignup(req.body);
      const result = await AuthService.signup(validated);
      return successResponse(res, result, 'Account created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validated = validateCreateUser(req.body);
      const result = await AuthService.createUser(validated);
      return successResponse(res, result, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateForgotPassword(req.body);
      const result = await AuthService.forgotPassword(validated.loginId, validated.email);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateResetPassword(req.body);
      const result = await AuthService.resetPassword(
        validated.loginId,
        validated.email,
        validated.newPassword
      );
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const user = await AuthService.getMe(req.user.id);
      return successResponse(res, user, 'Current user profile fetched');
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await AuthService.listUsers();
      return successResponse(res, users, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id, 10);
      const { status } = req.body;
      const updated = await AuthService.updateUserStatus(userId, status);
      return successResponse(res, updated, 'User status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
