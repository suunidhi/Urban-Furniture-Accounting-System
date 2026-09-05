import express from 'express';
import { upload, extractFromDocument } from '../controllers/ocrController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/extract', protect, upload.single('document'), extractFromDocument);

export default router;
