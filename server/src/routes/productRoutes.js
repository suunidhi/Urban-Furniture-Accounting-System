import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, archiveProduct } from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { imageUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();
const upload = imageUpload('products');

router.route('/')
  .get(protect, getProducts)
  .post(protect, upload.single('image'), createProduct);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, upload.single('image'), updateProduct);

router.route('/:id/archive')
  .patch(protect, archiveProduct);

export default router;
