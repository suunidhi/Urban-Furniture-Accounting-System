import { Request, Response, NextFunction } from 'express';
import { OCRService } from '../services/ocrService';
import { successResponse } from '../utils/response';
import { AppValidationError } from '../validators/auth';

const validateOcr = (data: any) => {
  if (!data.text || typeof data.text !== 'string' || data.text.length < 5) {
    throw new AppValidationError([{ field: 'text', message: 'Text must be at least 5 characters' }]);
  }
  return data;
};

export class OCRController {
  static async parseDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { text } = validateOcr(req.body);
      const parsed = await OCRService.parseDocument(text);
      return successResponse(res, parsed, 'Document parsed successfully');
    } catch (error) {
      next(error);
    }
  }
}
