import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { sendResponse, AppError } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Reset the entire database (destructive operation).
 * 
 * Security:
 * - Requires ADMIN role (enforced by route middleware)
 * - Requires a master key password from environment variable
 * - Preserves all User accounts
 * - Deletes: Payment → Rent → Tenant → Property (in FK order)
 */
export const resetDatabase = asyncHandler(async (req: Request, res: Response) => {
  const { masterKey } = req.body;

  if (!masterKey) {
    throw new AppError('Master key is required', 400, 'VALIDATION_ERROR');
  }

  const envMasterKey = process.env.MASTER_RESET_KEY;
  if (!envMasterKey) {
    throw new AppError('System reset is not configured. Contact your system administrator.', 500, 'CONFIG_ERROR');
  }

  if (masterKey !== envMasterKey) {
    throw new AppError('Invalid master key. Database reset denied.', 403, 'AUTH_ERROR');
  }

  // Execute deletions in correct FK dependency order using a transaction
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.rent.deleteMany(),
    prisma.tenant.deleteMany(),
    prisma.property.deleteMany(),
  ]);

  return sendResponse(res, 200, true, {
    deletedTables: ['Payment', 'Rent', 'Tenant', 'Property'],
    preservedTables: ['User'],
  }, 'Database has been reset successfully. All user accounts have been preserved.');
});
