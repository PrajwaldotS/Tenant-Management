import { z } from 'zod';

export const createTenantSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Tenant name is required' }).min(2, 'Name must be at least 2 characters').trim(),
    phone: z.string({ required_error: 'Phone is required' })
      .length(10, 'Phone must be exactly 10 digits')
      .regex(/^\d{10}$/, 'Phone must contain only digits'),
    propertyId: z.string({ required_error: 'Property ID is required' }).uuid('Invalid Property ID format'),
    rentAmount: z.number({ required_error: 'Rent amount is required' }).positive('Rent amount must be positive'),
    moveInDate: z.string({ required_error: 'Move-in date is required' }).refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'Invalid date format. Use ISO 8601 (YYYY-MM-DD)' },
    ),
  }),
});

export const updateTenantSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').trim().optional(),
    phone: z.string().length(10).regex(/^\d{10}$/, 'Phone must contain only digits').optional(),
    rentAmount: z.number().positive('Rent amount must be positive').optional(),
    isActive: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
  params: z.object({
    id: z.string().uuid('Invalid tenant ID format'),
  }),
});
