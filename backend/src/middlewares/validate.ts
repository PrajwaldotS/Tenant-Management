import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/response';

/**
 * Zod validation middleware factory.
 * Validates req.body, req.query, and req.params against the provided schema.
 * On failure, returns structured field-level validation errors.
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace request data with the parsed (and coerced) values
      req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const fieldErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: fieldErrors,
        });
      }
      next(error);
    }
  };
};
