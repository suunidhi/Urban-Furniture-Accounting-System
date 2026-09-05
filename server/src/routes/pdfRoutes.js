import express from 'express';
import { generateInvoicePDF, generateBillPDF, generatePurchaseOrderPDF } from '../controllers/pdfController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/invoice/:id', protect, generateInvoicePDF);
router.get('/bill/:id', protect, generateBillPDF);
router.get('/purchase-order/:id', protect, generatePurchaseOrderPDF);

export default router;
