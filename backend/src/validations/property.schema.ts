import { z } from 'zod';

export const createPropertySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Property name is required' }).min(2, 'Name must be at least 2 characters').trim(),
    address: z.string({ required_error: 'Address is required' }).min(5, 'Address must be at least 5 characters').trim(),
    ownerId: z.string({ required_error: 'Owner ID is required' }).uuid('Invalid Owner ID format'),
    managerId: z.string().uuid('Invalid Manager ID format').optional().nullable(),
  }),
});

export const updatePropertySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').trim().optional(),
    address: z.string().min(5, 'Address must be at least 5 characters').trim().optional(),
    managerId: z.string().uuid('Invalid Manager ID format').optional().nullable(),
    isActive: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
  params: z.object({
    id: z.string().uuid('Invalid property ID format'),
  }),
});
