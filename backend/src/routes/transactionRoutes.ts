import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

export const purchaseRoutes = Router();
purchaseRoutes.use(authenticate);
purchaseRoutes.get('/', TransactionController.listPOs);
purchaseRoutes.get('/:id', TransactionController.getPO);
purchaseRoutes.post('/', requireRole([UserRole.ADMIN, UserRole.ACCOUNTANT]), TransactionController.createPO);
purchaseRoutes.post('/:id/confirm', requireRole([UserRole.ADMIN, UserRole.ACCOUNTANT]), TransactionController.confirmPO);
purchaseRoutes.post('/:id/convert-to-bill', requireRole([UserRole.ADMIN, UserRole.ACCOUNTANT]), TransactionController.convertPOToBill);

export const vendorBillRoutes = Router();
vendorBillRoutes.use(authenticate);
vendorBillRoutes.get('/', TransactionController.listBills);
vendorBillRoutes.get('/:id', TransactionController.getBill);
vendorBillRoutes.post('/', requireRole([UserRole.ADMIN, UserRole.ACCOUNTANT]), TransactionController.createBill);
vendorBillRoutes.post('/:id/post', requireRole([UserRole.ADMIN, UserRole.ACCOUNTANT]), TransactionController.postBill);

export const salesRoutes = Router();
salesRoutes.use(authenticate);
salesRoutes.get('/', TransactionController.listSOs);
salesRoutes.get('/:id', TransactionController.getSO);
salesRoutes.post('/', requireRole([UserRole.ADMIN, UserRole.ACCOUNTANT]), TransactionController.createSO);
salesRoutes.post('/:id/confirm', requireRole([UserRole.ADMIN, UserRole.ACCOUNTANT]), TransactionController.confirmSO);
salesRoutes.post('/:id/convert-to-invoice', requireRole([UserRole.ADMIN, UserRole.ACCOUNTANT]), TransactionController.convertSOToInvoice);

export const invoiceRoutes = Router();
invoiceRoutes.use(authenticate);
invoiceRoutes.get('/', TransactionController.listInvoices);
invoiceRoutes.get('/:id', TransactionController.getInvoice);
invoiceRoutes.post('/', requireRole([UserRole.ADMIN, UserRole.ACCOUNTANT]), TransactionController.createInvoice);
invoiceRoutes.put('/:id', requireRole([UserRole.ADMIN, UserRole.ACCOUNTANT]), TransactionController.updateInvoice);
invoiceRoutes.post('/:id/submit-approval', requireRole([UserRole.ADMIN, UserRole.ACCOUNTANT]), TransactionController.submitInvoiceForApproval);
invoiceRoutes.post('/:id/post', requireRole([UserRole.ADMIN, UserRole.ACCOUNTANT]), TransactionController.postInvoice);

export const paymentRoutes = Router();
paymentRoutes.use(authenticate);
paymentRoutes.get('/', TransactionController.listPayments);
paymentRoutes.get('/:id', TransactionController.getPayment);
paymentRoutes.post('/', TransactionController.registerPayment);
