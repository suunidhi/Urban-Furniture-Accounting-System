import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../services/budgetService';
import { successResponse } from '../utils/response';
import { AppValidationError } from '../validators/auth';

const validateCreateBudget = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  }

  if (!data.startDate || typeof data.startDate !== 'string') {
    errors.push({ field: 'startDate', message: 'Start date is required' });
  }

  if (!data.endDate || typeof data.endDate !== 'string') {
    errors.push({ field: 'endDate', message: 'End date is required' });
  }

  const analyticAccountId = Number(data.analyticAccountId);
  if (isNaN(analyticAccountId) || analyticAccountId <= 0 || !Number.isInteger(analyticAccountId)) {
    errors.push({ field: 'analyticAccountId', message: 'Analytic Account ID is required' });
  } else {
    data.analyticAccountId = analyticAccountId;
  }

  if (data.responsibleId !== undefined && data.responsibleId !== null) {
    const responsibleId = Number(data.responsibleId);
    if (isNaN(responsibleId) || responsibleId <= 0 || !Number.isInteger(responsibleId)) {
      errors.push({ field: 'responsibleId', message: 'Responsible ID must be a positive integer' });
    } else {
      data.responsibleId = responsibleId;
    }
  }

  const committedAmount = Number(data.committedAmount);
  if (isNaN(committedAmount) || committedAmount <= 0) {
    errors.push({ field: 'committedAmount', message: 'Committed amount must be a positive number' });
  } else {
    data.committedAmount = committedAmount;
  }

  if (errors.length > 0) throw new AppValidationError(errors);
  return data;
};

const validateReviseBudget = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  const committedAmount = Number(data.committedAmount);
  if (isNaN(committedAmount) || committedAmount <= 0) {
    errors.push({ field: 'committedAmount', message: 'Committed amount must be a positive number' });
  } else {
    data.committedAmount = committedAmount;
  }

  if (errors.length > 0) throw new AppValidationError(errors);
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
