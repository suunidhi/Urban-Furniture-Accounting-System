import express from 'express';
import {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  confirmBudget,
  cancelBudget,
  recalculateBudget,
  getBudgetSummary
} from '../controllers/budgetController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', protect, getBudgetSummary);

router.route('/')
  .get(protect, getBudgets)
  .post(protect, restrictTo('admin', 'accountant'), createBudget);

router.route('/:id')
  .get(protect, getBudgetById)
  .put(protect, restrictTo('admin', 'accountant'), updateBudget)
  .delete(protect, restrictTo('admin', 'accountant'), deleteBudget);

router.post('/:id/confirm', protect, restrictTo('admin', 'accountant'), confirmBudget);
router.post('/:id/cancel', protect, restrictTo('admin', 'accountant'), cancelBudget);
router.post('/:id/recalculate', protect, restrictTo('admin', 'accountant'), recalculateBudget);

export default router;
