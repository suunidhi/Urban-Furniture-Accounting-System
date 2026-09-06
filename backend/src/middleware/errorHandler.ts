import { Request, Response, NextFunction } from 'express';


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

export class ValidationError extends AppError {
  errors: { path: string[]; message: string }[];
  
  constructor(errors: { path: string[]; message: string }[]) {
    super('Validation Error', 400);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[Error Handler]:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof ValidationError) {
    const errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({
      success: false,
      message: errorMessages,
      errors: err.errors,
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};
