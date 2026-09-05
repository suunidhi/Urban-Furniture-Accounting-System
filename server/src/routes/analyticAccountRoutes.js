import express from 'express';
import { getAnalyticAccounts, createAnalyticAccount } from '../controllers/analyticAccountController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAnalyticAccounts)
  .post(protect, restrictTo('admin', 'accountant'), createAnalyticAccount);

export default router;
