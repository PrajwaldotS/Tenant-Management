import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, sendResponse } from '../utils/response';

/**
 * Centralized error handler.
 * Catches AppError (business), ZodError (validation), Prisma errors, and unknown errors.
 * Always returns the standard API contract: { success, message, code }
 */
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Log full error in development, redact in production
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err);
  } else {
    console.error('[ERROR]', err.message);
  }

  // 1. Known business/operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // 2. Zod validation errors (in case they bypass the validate middleware)
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({
      success: false,
      message: messages.join('; '),
      code: 'VALIDATION_ERROR',
    });
  }

  // 3. Prisma known errors
  if (err.code === 'P2002') {
    const target = err.meta?.target?.join(', ') || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate value for: ${target}`,
      code: 'DUPLICATE_ERROR',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
      code: 'NOT_FOUND',
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Foreign key constraint violation',
      code: 'FK_VIOLATION',
    });
  }

  // 4. JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'AUTH_ERROR',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired',
      code: 'AUTH_ERROR',
    });
  }

  // 5. Fallback — never leak stack traces to clients
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
  });
};
