import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth';
import { AppError } from '../utils/response';

/**
 * JWT authentication middleware.
 * CRITICAL FIX: Uses next(error) instead of throw.
 * Express does NOT catch synchronous throws in middleware — they crash the process.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Unauthorized: No token provided', 401, 'AUTH_ERROR'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AppError('Unauthorized: Malformed token', 401, 'AUTH_ERROR'));
    }

    const decoded: TokenPayload = verifyToken(token);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error: any) {
    // verifyToken throws on invalid/expired tokens — forward to error handler
    return next(new AppError('Unauthorized: Invalid or expired token', 401, 'AUTH_ERROR'));
  }
};

/**
 * Role-based access control middleware.
 * Must be used AFTER authMiddleware in the chain.
 */
export const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized: Authentication required', 401, 'AUTH_ERROR'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(
        `Forbidden: Role '${req.user.role}' does not have access to this resource`,
        403,
        'PERMISSION_ERROR',
      ));
    }
    next();
  };
};
