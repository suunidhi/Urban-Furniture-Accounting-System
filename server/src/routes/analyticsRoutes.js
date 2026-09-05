import express from 'express';
import {
  getKPIs,
  getRevenueVsExpenses,
  getTopCustomers,
  getTopVendors,
  getRecentActivity,
  getMonthlySales
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/kpis', protect, getKPIs);
router.get('/revenue-vs-expenses', protect, getRevenueVsExpenses);
router.get('/top-customers', protect, getTopCustomers);
router.get('/top-vendors', protect, getTopVendors);
router.get('/recent-activity', protect, getRecentActivity);
router.get('/monthly-sales', protect, getMonthlySales);

export default router;
