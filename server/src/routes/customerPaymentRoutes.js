import express from 'express';
import { getCustomerPayments, createCustomerPayment } from '../controllers/customerPaymentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCustomerPayments)
  .post(protect, restrictTo('admin', 'accountant'), createCustomerPayment);

export default router;
