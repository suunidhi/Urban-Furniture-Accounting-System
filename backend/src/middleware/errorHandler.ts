import { Request, Response, NextFunction } from 'express';
import { AppValidationError } from '../validators/auth';

export class AppError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode = 400, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[Error Handler]:', err);

  if (err instanceof AppValidationError) {
    const errorMessages = err.errors.map((e) => `${e.field || 'field'}: ${e.message}`).join(', ');
    return res.status(400).json({
      success: false,
      message: errorMessages,
      errors: err.errors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};
