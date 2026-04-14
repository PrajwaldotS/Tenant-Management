import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler to automatically catch errors and forward them to Express.
 * Eliminates repetitive try/catch blocks in every controller.
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
