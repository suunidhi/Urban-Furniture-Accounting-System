import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../services/budgetService';
import { successResponse } from '../utils/response';
import { ValidationError } from '../middleware/errorHandler';

const validateCreateBudget = (data: any) => {
  const errors: any[] = [];
  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    errors.push({ path: ['name'], message: 'Name must be at least 2 characters' });
  }
  if (!data.startDate) errors.push({ path: ['startDate'], message: 'Start date is required' });
  if (!data.endDate) errors.push({ path: ['endDate'], message: 'End date is required' });
  if (!data.analyticAccountId || isNaN(Number(data.analyticAccountId))) {
    errors.push({ path: ['analyticAccountId'], message: 'Analytic account is required' });
  }
  if (!data.committedAmount || isNaN(Number(data.committedAmount)) || Number(data.committedAmount) <= 0) {
    errors.push({ path: ['committedAmount'], message: 'Committed amount must be greater than zero' });
  }
  
  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

const validateReviseBudget = (data: any) => {
  const errors: any[] = [];
  if (!data.committedAmount || isNaN(Number(data.committedAmount)) || Number(data.committedAmount) <= 0) {
    errors.push({ path: ['committedAmount'], message: 'Committed amount must be greater than zero' });
  }
  
  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export class BudgetController {
  static async listBudgets(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query as any;
      const budgets = await BudgetService.listBudgets({ status, search });
      return successResponse(res, budgets, 'Budgets retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getBudget(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const budget = await BudgetService.getBudget(id);
      return successResponse(res, budget, 'Budget details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createBudget(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateCreateBudget(req.body);
      const budget = await BudgetService.createBudget(validated);
      return successResponse(res, budget, 'Budget created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async confirmBudget(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const budget = await BudgetService.confirmBudget(id);
      return successResponse(res, budget, 'Budget confirmed');
    } catch (error) {
      next(error);
    }
  }

  static async reviseBudget(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const validated = validateReviseBudget(req.body);
      const revision = await BudgetService.reviseBudget(id, validated);
      return successResponse(res, revision, 'Budget revised successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}
