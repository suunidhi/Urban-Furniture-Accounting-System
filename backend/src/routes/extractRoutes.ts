import { Router } from 'express';
import multer from 'multer';
import { ExtractController } from '../controllers/extractController';
import { authenticate, requireRole } from '../middleware/auth';

export const extractRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

extractRoutes.use(authenticate);

// Only ADMIN can access the extraction route
extractRoutes.post(
  '/pdf',
  requireRole(['ADMIN']),
  upload.single('file'),
  ExtractController.extractFromPdf
);
