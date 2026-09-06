import { Request, Response, NextFunction } from 'express';
import { AccountingService } from '../services/accountingService';
import { successResponse } from '../utils/response';
import { ValidationError } from '../middleware/errorHandler';

const validateManualEntry = (data: any) => {
  const errors: any[] = [];
  
  if (!data.date) errors.push({ path: ['date'], message: 'Date is required' });
  if (!data.journalId || isNaN(Number(data.journalId)) || Number(data.journalId) <= 0) {
    errors.push({ path: ['journalId'], message: 'Valid journal ID is required' });
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length < 2) {
    errors.push({ path: ['items'], message: 'At least 2 items are required for double-entry bookkeeping' });
  } else {
    data.items.forEach((item: any, index: number) => {
      if (!item.accountId || isNaN(Number(item.accountId)) || Number(item.accountId) <= 0) {
        errors.push({ path: [`items.${index}.accountId`], message: 'Account ID is required' });
      }
      if (item.debit === undefined || isNaN(Number(item.debit)) || Number(item.debit) < 0) {
        errors.push({ path: [`items.${index}.debit`], message: 'Debit must be non-negative' });
      }
      if (item.credit === undefined || isNaN(Number(item.credit)) || Number(item.credit) < 0) {
        errors.push({ path: [`items.${index}.credit`], message: 'Credit must be non-negative' });
      }
    });
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export class AccountingController {
  static async listJournalEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const { journalId, status, search, startDate, endDate } = req.query as any;
      const entries = await AccountingService.listJournalEntries({
        journalId: journalId ? parseInt(journalId, 10) : undefined,
        status,
        search,
        startDate,
        endDate,
      });
      return successResponse(res, entries, 'Journal entries retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getJournalEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const entry = await AccountingService.getJournalEntry(id);
      return successResponse(res, entry, 'Journal entry details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createManualJournalEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateManualEntry(req.body);
      const entry = await AccountingService.createManualJournalEntry(validated);
      return successResponse(res, entry, 'Manual journal entry posted successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}
