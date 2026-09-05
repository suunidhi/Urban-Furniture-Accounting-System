import express from 'express';
import {
  getVendorBills,
  getVendorBillById,
  createVendorBill,
  updateVendorBill,
  deleteVendorBill,
  postVendorBill
} from '../controllers/billController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getVendorBills)
  .post(protect, restrictTo('admin', 'accountant'), createVendorBill);

router.route('/:id')
  .get(protect, getVendorBillById)
  .put(protect, restrictTo('admin', 'accountant'), updateVendorBill)
  .delete(protect, restrictTo('admin', 'accountant'), deleteVendorBill);

router.post('/:id/post', protect, restrictTo('admin', 'accountant'), postVendorBill);

export default router;
