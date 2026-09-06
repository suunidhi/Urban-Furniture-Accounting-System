import { Request, Response, NextFunction } from 'express';
import { OCRService } from '../services/ocrService';
import { successResponse } from '../utils/response';
import { ValidationError } from '../middleware/errorHandler';

export class OCRController {
  static async parseDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string' || text.length < 5) {
        throw new ValidationError([{ path: ['text'], message: 'Text must be at least 5 characters' }]);
      }
      const parsed = await OCRService.parseDocument(text);
      return successResponse(res, parsed, 'Document parsed successfully');
    } catch (error) {
      next(error);
    }
  }
}
