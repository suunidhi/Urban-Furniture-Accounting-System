import express from 'express';
import {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  confirmSalesOrder,
  createInvoiceFromSalesOrder
} from '../controllers/salesController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSalesOrders)
  .post(protect, restrictTo('admin', 'accountant'), createSalesOrder);

router.route('/:id')
  .get(protect, getSalesOrderById)
  .put(protect, restrictTo('admin', 'accountant'), updateSalesOrder)
  .delete(protect, restrictTo('admin', 'accountant'), deleteSalesOrder);

router.post('/:id/confirm', protect, restrictTo('admin', 'accountant'), confirmSalesOrder);
router.post('/:id/create-invoice', protect, restrictTo('admin', 'accountant'), createInvoiceFromSalesOrder);

export default router;
