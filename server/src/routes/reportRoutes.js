import express from 'express';
import { getBalanceSheet, getProfitAndLoss, getBudgetReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/balance-sheet', protect, getBalanceSheet);
router.get('/profit-loss', protect, getProfitAndLoss);
router.get('/budget', protect, getBudgetReport);

export default router;
