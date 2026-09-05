import { Request, Response, NextFunction } from 'express';
import { AccountingService } from '../services/accountingService';
import { successResponse } from '../utils/response';
import { AppValidationError } from '../validators/auth';

const validateManualEntry = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  if (!data.date || typeof data.date !== 'string') {
    errors.push({ field: 'date', message: 'Date is required' });
  }

  const journalId = Number(data.journalId);
  if (isNaN(journalId) || journalId <= 0 || !Number.isInteger(journalId)) {
    errors.push({ field: 'journalId', message: 'Journal ID must be a positive integer' });
  } else {
    data.journalId = journalId;
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length < 2) {
    errors.push({ field: 'items', message: 'At least 2 items (debit and credit) are required' });
  } else {
    data.items.forEach((item: any, index: number) => {
      const accountId = Number(item.accountId);
      if (isNaN(accountId) || accountId <= 0 || !Number.isInteger(accountId)) {
        errors.push({ field: `items[${index}].accountId`, message: 'Account ID must be a positive integer' });
      } else {
        item.accountId = accountId;
      }

      if (item.partnerId !== undefined && item.partnerId !== null) {
        const partnerId = Number(item.partnerId);
        if (isNaN(partnerId) || partnerId <= 0 || !Number.isInteger(partnerId)) {
          errors.push({ field: `items[${index}].partnerId`, message: 'Partner ID must be a positive integer' });
        } else {
          item.partnerId = partnerId;
        }
      }

      if (item.analyticAccountId !== undefined && item.analyticAccountId !== null) {
        const analyticAccountId = Number(item.analyticAccountId);
        if (isNaN(analyticAccountId) || analyticAccountId <= 0 || !Number.isInteger(analyticAccountId)) {
          errors.push({ field: `items[${index}].analyticAccountId`, message: 'Analytic Account ID must be a positive integer' });
        } else {
          item.analyticAccountId = analyticAccountId;
        }
      }

      const debit = Number(item.debit);
      if (isNaN(debit) || debit < 0) {
        errors.push({ field: `items[${index}].debit`, message: 'Debit must be a non-negative number' });
      } else {
        item.debit = debit;
      }

      const credit = Number(item.credit);
      if (isNaN(credit) || credit < 0) {
        errors.push({ field: `items[${index}].credit`, message: 'Credit must be a non-negative number' });
      } else {
        item.credit = credit;
      }
    });
  }

  if (errors.length > 0) throw new AppValidationError(errors);
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
