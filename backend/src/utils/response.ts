import { Response } from 'express';

// Standardized pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Response envelope — matches the API contract exactly
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  data: T = null as any,
  message: string = '',
): Response => {
  const body: ApiResponse<T> = { success };
  if (data !== null && data !== undefined) body.data = data;
  if (message) body.message = message;
  return res.status(statusCode).json(body);
};

export const sendPaginatedResponse = <T>(
  res: Response,
  statusCode: number,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = '',
): Response => {
  const body: ApiResponse<T[]> = {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
};

// Typed error class with the error code from the API contract
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Distinguishes expected errors from programming bugs
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
