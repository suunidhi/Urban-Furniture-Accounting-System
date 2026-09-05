import express from 'express';
import { getAccounts, createAccount } from '../controllers/accountController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAccounts)
  .post(protect, restrictTo('admin', 'accountant'), createAccount);

export default router;
