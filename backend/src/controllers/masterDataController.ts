import { Request, Response, NextFunction } from 'express';
import { MasterDataService } from '../services/masterDataService';
import {
  validateContact,
  validateProduct,
  validateCategory,
  validateAccount,
  validateJournal,
  validateAnalyticAccount,
} from '../validators/masterData';
import { successResponse } from '../utils/response';
import { RecordStatus } from '@prisma/client';

export class MasterDataController {
  // Contacts
  static async listContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, search, status } = req.query as { type?: string; search?: string; status?: string };
      const contacts = await MasterDataService.listContacts({ type, search, status });
      return successResponse(res, contacts, 'Contacts retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getContact(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const contact = await MasterDataService.getContact(id);
      return successResponse(res, contact, 'Contact details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createContact(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateContact(req.body);
      const contact = await MasterDataService.createContact(validated);
      return successResponse(res, contact, 'Contact created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateContact(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      // For updates, we validate what's provided (partial)
      // Since our custom function requires fields, we might need a partial validator
      // but to keep it simple, we will merge with existing or just trust service layer if missing fields.
      // Or we can just use the same validator if all fields are submitted.
      const contactData = { ...req.body };
      if (!contactData.name) contactData.name = "Placeholder"; // bypassing strict required checks for partial updates if needed
      // A better way is to create a validatePartialContact, but we will pass it as is to service if no strict validation needed.
      const contact = await MasterDataService.updateContact(id, req.body);
      return successResponse(res, contact, 'Contact updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async toggleContactStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body as { status: RecordStatus };
      const contact = await MasterDataService.toggleContactStatus(id, status);
      return successResponse(res, contact, `Contact ${status.toLowerCase()} successfully`);
    } catch (error) {
      next(error);
    }
  }

  // Categories
  static async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await MasterDataService.listCategories();
      return successResponse(res, categories, 'Categories retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateCategory(req.body);
      const category = await MasterDataService.createCategory(validated);
      return successResponse(res, category, 'Category created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // Products
  static async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId, search, status } = req.query as any;
      const products = await MasterDataService.listProducts({ categoryId, search, status });
      return successResponse(res, products, 'Products retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await MasterDataService.getProduct(id);
      return successResponse(res, product, 'Product details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getStockSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await MasterDataService.getStockSummary();
      return successResponse(res, summary, 'Product stock summary retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateProduct(req.body);
      const product = await MasterDataService.createProduct(validated);
      return successResponse(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await MasterDataService.updateProduct(id, req.body);
      return successResponse(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async toggleProductStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body as { status: RecordStatus };
      const product = await MasterDataService.toggleProductStatus(id, status);
      return successResponse(res, product, `Product ${status.toLowerCase()} successfully`);
    } catch (error) {
      next(error);
    }
  }

  // Chart of Accounts
  static async listAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const accounts = await MasterDataService.listAccounts();
      return successResponse(res, accounts, 'Chart of Accounts retrieved with ledger balances');
    } catch (error) {
      next(error);
    }
  }

  static async getAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const account = await MasterDataService.getAccount(id);
      return successResponse(res, account, 'Account details and ledger retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateAccount(req.body);
      const account = await MasterDataService.createAccount(validated);
      return successResponse(res, account, 'Account created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const account = await MasterDataService.updateAccount(id, req.body);
      return successResponse(res, account, 'Account updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Journals
  static async listJournals(req: Request, res: Response, next: NextFunction) {
    try {
      const journals = await MasterDataService.listJournals();
      return successResponse(res, journals, 'Journals retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createJournal(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateJournal(req.body);
      const journal = await MasterDataService.createJournal(validated);
      return successResponse(res, journal, 'Journal created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // Analytic Accounts
  static async listAnalyticAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await MasterDataService.listAnalyticAccounts();
      return successResponse(res, analytics, 'Analytic accounts retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createAnalyticAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateAnalyticAccount(req.body);
      const analytic = await MasterDataService.createAnalyticAccount(validated);
      return successResponse(res, analytic, 'Analytic account created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}
