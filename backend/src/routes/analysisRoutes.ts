import { Router } from 'express';
import { AnalysisController } from '../controllers/analysisController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/product', AnalysisController.getProductAnalysis);
router.get('/customer', AnalysisController.getCustomerAnalysis);
router.get('/freestyle', AnalysisController.getFreestyleAnalysis);

export default router;
