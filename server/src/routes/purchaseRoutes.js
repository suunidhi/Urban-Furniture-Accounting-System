import express from 'express';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  confirmPurchaseOrder,
  createBillFromPurchaseOrder
} from '../controllers/purchaseController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getPurchaseOrders)
  .post(protect, restrictTo('admin', 'accountant'), createPurchaseOrder);

router.route('/:id')
  .get(protect, getPurchaseOrderById)
  .put(protect, restrictTo('admin', 'accountant'), updatePurchaseOrder)
  .delete(protect, restrictTo('admin', 'accountant'), deletePurchaseOrder);

router.post('/:id/confirm', protect, restrictTo('admin', 'accountant'), confirmPurchaseOrder);
router.post('/:id/create-bill', protect, restrictTo('admin', 'accountant'), createBillFromPurchaseOrder);

export default router;
