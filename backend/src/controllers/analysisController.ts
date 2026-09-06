import { Request, Response } from 'express';
import { AnalysisService } from '../services/analysisService';

export class AnalysisController {
  static async getProductAnalysis(req: Request, res: Response) {
    try {
      const { timeRange = '1m', type = 'income', categoryId, productId } = req.query;
      const data = await AnalysisService.getProductAnalysis(
        timeRange as string, 
        type as string, 
        categoryId ? Number(categoryId) : undefined, 
        productId ? Number(productId) : undefined
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getCustomerAnalysis(req: Request, res: Response) {
    try {
      const { timeRange = '1m', type = 'income' } = req.query;
      const data = await AnalysisService.getCustomerAnalysis(
        timeRange as string, 
        type as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getFreestyleAnalysis(req: Request, res: Response) {
    try {
      const { startDate, endDate, type = 'all' } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
      }
      
      const data = await AnalysisService.getFreestyleAnalysis(
        startDate as string, 
        endDate as string, 
        type as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
