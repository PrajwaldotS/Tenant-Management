import { z } from 'zod';

export const createPropertySchema = z.object({
  body: z.object({
    buildingName: z.string().trim().optional().nullable(),
    unitType: z.enum(['SHOP', 'HOUSE'], { required_error: 'Unit type is required (SHOP or HOUSE)' }),
    unitName: z.string({ required_error: 'Unit name is required' }).min(1, 'Unit name is required').trim(),
    address: z.string({ required_error: 'Address is required' }).min(5, 'Address must be at least 5 characters').trim(),
    ownerId: z.string({ required_error: 'Owner ID is required' }).uuid('Invalid Owner ID format'),
    managerId: z.string().uuid('Invalid Manager ID format').optional().nullable(),
    size: z.string().trim().optional().nullable(),
    // layoutImage & images are handled by multer file upload, not JSON body
    floor: z.coerce.number().int('Floor must be a whole number').optional().nullable(),
    googleLocation: z.string().url('Invalid Google Maps URL').optional().nullable().or(z.literal('')),
    meterNo: z.string().trim().optional().nullable(),
    rentIncrement: z.coerce.number().min(0, 'Increment must be >= 0').optional().nullable(),
    rentIncrementType: z.enum(['PERCENTAGE', 'AMOUNT']).optional().nullable(),
  }),
});

export const updatePropertySchema = z.object({
  body: z.object({
    buildingName: z.string().trim().optional().nullable(),
    unitType: z.enum(['SHOP', 'HOUSE']).optional(),
    unitName: z.string().min(1, 'Unit name is required').trim().optional(),
    address: z.string().min(5, 'Address must be at least 5 characters').trim().optional(),
    managerId: z.string().uuid('Invalid Manager ID format').optional().nullable(),
    isActive: z.boolean().optional(),
    size: z.string().trim().optional().nullable(),
    // layoutImage & images are handled by multer file upload, not JSON body
    floor: z.coerce.number().int('Floor must be a whole number').optional().nullable(),
    googleLocation: z.string().url('Invalid Google Maps URL').optional().nullable().or(z.literal('')),
    meterNo: z.string().trim().optional().nullable(),
    rentIncrement: z.coerce.number().min(0, 'Increment must be >= 0').optional().nullable(),
    rentIncrementType: z.enum(['PERCENTAGE', 'AMOUNT']).optional().nullable(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
  params: z.object({
    id: z.string().uuid('Invalid property ID format'),
  }),
});
