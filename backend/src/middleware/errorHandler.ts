import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Custom application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.statusCode >= 500 ? 'Internal Server Error' : 'Application Error',
      message: err.message,
    });
    return;
  }

  // Unexpected errors
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

