import { Request, Response, NextFunction } from 'express';
import { PurchaseService } from '../services/purchaseService';
import { SalesService } from '../services/salesService';
import { PaymentService } from '../services/paymentService';
import {
  validatePurchaseOrder,
  validateVendorBill,
  validateSalesOrder,
  validateCustomerInvoice,
  validatePaymentRegistration,
} from '../validators/transactions';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export class TransactionController {
  // ==================== PURCHASE ORDERS ====================
  static async listPOs(req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = req.query as { search?: string };
      const pos = await PurchaseService.listPOs(search);
      return successResponse(res, pos, 'Purchase orders retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getPO(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const po = await PurchaseService.getPO(id);
      return successResponse(res, po, 'Purchase order details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createPO(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validatePurchaseOrder(req.body);
      const po = await PurchaseService.createPO(validated as any);
      return successResponse(res, po, 'Purchase order created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async confirmPO(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const po = await PurchaseService.confirmPO(id);
      return successResponse(res, po, 'Purchase order confirmed');
    } catch (error) {
      next(error);
    }
  }

  static async convertPOToBill(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const bill = await PurchaseService.convertPOToBill(id);
      return successResponse(res, bill, 'Purchase order converted to Vendor Bill successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // ==================== VENDOR BILLS ====================
  static async listBills(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query as any;
      let vendorId = req.query.vendorId ? parseInt(req.query.vendorId as string, 10) : undefined;

      // Contact user isolation
      if (req.user?.role === 'CONTACT_USER') {
        if (!req.user.contactId) {
          return successResponse(res, [], 'No associated bills');
        }
        vendorId = req.user.contactId;
      }

      const bills = await PurchaseService.listBills({ status, vendorId, search });
      return successResponse(res, bills, 'Vendor bills retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getBill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const bill = await PurchaseService.getBill(id);

      // Contact user isolation
      if (req.user?.role === 'CONTACT_USER' && req.user.contactId !== bill.vendorId) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own bills.' });
      }

      return successResponse(res, bill, 'Vendor bill details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createBill(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateVendorBill(req.body);
      const bill = await PurchaseService.createBill(validated as any);
      return successResponse(res, bill, 'Vendor bill created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async postBill(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const postedBill = await PurchaseService.postBill(id);
      return successResponse(res, postedBill, 'Vendor bill confirmed and posted to General Ledger');
    } catch (error) {
      next(error);
    }
  }

  // ==================== SALES ORDERS ====================
  static async listSOs(req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = req.query as { search?: string };
      const sos = await SalesService.listSOs(search);
      return successResponse(res, sos, 'Sales orders retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getSO(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const so = await SalesService.getSO(id);
      return successResponse(res, so, 'Sales order details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createSO(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateSalesOrder(req.body);
      const so = await SalesService.createSO(validated as any);
      return successResponse(res, so, 'Sales order created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async confirmSO(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const so = await SalesService.confirmSO(id);
      return successResponse(res, so, 'Sales order confirmed');
    } catch (error) {
      next(error);
    }
  }

  static async convertSOToInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const invoice = await SalesService.convertSOToInvoice(id);
      return successResponse(res, invoice, 'Sales order converted to Customer Invoice successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // ==================== CUSTOMER INVOICES ====================
  static async listInvoices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query as any;
      let customerId = req.query.customerId ? parseInt(req.query.customerId as string, 10) : undefined;

      // Contact user isolation (PRD / Excalidraw requirement)
      if (req.user?.role === 'CONTACT_USER') {
        if (!req.user.contactId) {
          return successResponse(res, [], 'No associated invoices');
        }
        customerId = req.user.contactId;
      }

      const invoices = await SalesService.listInvoices({ status, customerId, search });
      return successResponse(res, invoices, 'Customer invoices retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const invoice = await SalesService.getInvoice(id);

      // Contact user isolation
      if (req.user?.role === 'CONTACT_USER' && req.user.contactId !== invoice.customerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own invoices.' });
      }

      return successResponse(res, invoice, 'Customer invoice details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = validateCustomerInvoice(req.body);
      const invoice = await SalesService.createInvoice(validated as any);
      return successResponse(res, invoice, 'Customer invoice created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async postInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const postedInvoice = await SalesService.postInvoice(id);
      return successResponse(res, postedInvoice, 'Customer invoice confirmed and posted to General Ledger');
    } catch (error) {
      next(error);
    }
  }

  // ==================== PAYMENTS ====================
  static async listPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type, search } = req.query as any;
      let partnerId = req.query.partnerId ? parseInt(req.query.partnerId as string, 10) : undefined;

      // Contact user isolation
      if (req.user?.role === 'CONTACT_USER') {
        if (!req.user.contactId) {
          return successResponse(res, [], 'No payments');
        }
        partnerId = req.user.contactId;
      }

      const payments = await PaymentService.listPayments({ type, partnerId, search });
      return successResponse(res, payments, 'Payments retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const payment = await PaymentService.getPayment(id);

      if (req.user?.role === 'CONTACT_USER' && req.user.contactId !== payment.partnerId) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own payments.' });
      }

      return successResponse(res, payment, 'Payment details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async registerPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validated = validatePaymentRegistration(req.body);

      // Contact user security check: contact can only pay for themselves
      if (req.user?.role === 'CONTACT_USER') {
        if (req.user.contactId !== validated.partnerId) {
          return res.status(403).json({ success: false, message: 'Forbidden: You can only register payments for your own account.' });
        }
      }

      const invoiceId = validated.invoiceId || validated.customerInvoiceId || null;
      const billId = validated.billId || validated.vendorBillId || null;

      const payment = await PaymentService.registerPayment({
        ...validated,
        invoiceId,
        billId,
      } as any);
      return successResponse(res, payment, 'Payment registered and posted atomically to General Ledger', 201);
    } catch (error) {
      next(error);
    }
  }
}
