import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be positive'),
    rentId: z.string({ required_error: 'Rent ID is required' }).uuid('Invalid Rent ID format'),
    tenantId: z.string({ required_error: 'Tenant ID is required' }).uuid('Invalid Tenant ID format'),
    method: z.enum(['CASH', 'UPI', 'BANK'], {
      errorMap: () => ({ message: 'Method must be CASH, UPI, or BANK' }),
    }),
    referenceId: z.string().trim().optional(),
  }),
});
