import express from 'express';
import { getCategories, createCategory } from '../controllers/productCategoryController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCategories)
  .post(protect, restrictTo('admin', 'accountant'), createCategory);

export default router;
