import express from 'express';
import {
  getPayments,
  getPaymentById,
  createVendorPayment
} from '../controllers/paymentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getPayments)
  .post(protect, restrictTo('admin', 'accountant'), createVendorPayment);

router.route('/:id')
  .get(protect, getPaymentById);

export default router;
