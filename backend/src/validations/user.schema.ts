import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────
export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address').trim().toLowerCase(),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  }),
});

// ── Create User ───────────────────────────────────────
export const createUserSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters').trim(),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address').trim().toLowerCase(),
    password: z.string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters')
      .max(128, 'Password must not exceed 128 characters'),
    role: z.enum(['ADMIN', 'MANAGER', 'COLLECTOR'], {
      errorMap: () => ({ message: 'Role must be ADMIN, MANAGER, or COLLECTOR' }),
    }),
  }),
});

// ── Toggle User Status ────────────────────────────────
export const updateStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive is required' }),
  }),
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

// ── Shared: pagination and sorting query params ───────
export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort: z.string().optional(),
  }).passthrough(), // allow additional filter params
});
