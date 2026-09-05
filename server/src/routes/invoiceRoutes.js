import express from 'express';
import {
  getCustomerInvoices,
  getCustomerInvoiceById,
  createCustomerInvoice,
  updateCustomerInvoice,
  deleteCustomerInvoice,
  postCustomerInvoice
} from '../controllers/invoiceController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCustomerInvoices)
  .post(protect, restrictTo('admin', 'accountant'), createCustomerInvoice);

router.route('/:id')
  .get(protect, getCustomerInvoiceById)
  .put(protect, restrictTo('admin', 'accountant'), updateCustomerInvoice)
  .delete(protect, restrictTo('admin', 'accountant'), deleteCustomerInvoice);

router.post('/:id/post', protect, restrictTo('admin', 'accountant'), postCustomerInvoice);

export default router;
