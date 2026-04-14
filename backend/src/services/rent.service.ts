import prisma from '../prisma/client';
import { AppError } from '../utils/response';
import { RentStatus, Prisma } from '@prisma/client';

/**
 * Generates monthly rent records for all active tenants.
 *
 * FIX: The original code had two critical issues:
 * 1. Hardcoded rent amount (500) — now reads from tenant.rentAmount
 * 2. N+1 query pattern (1 query per tenant) — now uses batch upsert inside a transaction
 */
export const generateMonthlyRents = async (month: string, dueDate: Date) => {
  // Validate month format
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new AppError('Month must be in YYYY-MM format', 400, 'VALIDATION_ERROR');
  }

  const activeTenants = await prisma.tenant.findMany({
    where: { isActive: true },
    select: { id: true, rentAmount: true, name: true },
  });

  if (activeTenants.length === 0) {
    return { generated: 0, skipped: 0, results: [] };
  }

  // Check which rents already exist for this month (single query instead of N queries)
  const existingRents = await prisma.rent.findMany({
    where: {
      generatedMonth: month,
      tenantId: { in: activeTenants.map((t) => t.id) },
    },
    select: { tenantId: true },
  });

  const existingTenantIds = new Set(existingRents.map((r) => r.tenantId));
  const tenantsToGenerate = activeTenants.filter((t) => !existingTenantIds.has(t.id));

  // Skip tenants with zero rent amount
  const validTenants = tenantsToGenerate.filter((t) => Number(t.rentAmount) > 0);
  const skippedZeroRent = tenantsToGenerate.length - validTenants.length;

  if (validTenants.length === 0) {
    return {
      generated: 0,
      skipped: existingTenantIds.size,
      skippedZeroRent,
      results: [],
    };
  }

  // Batch create inside a transaction
  const results = await prisma.$transaction(
    validTenants.map((tenant) =>
      prisma.rent.create({
        data: {
          tenantId: tenant.id,
          generatedMonth: month,
          dueDate,
          amount: tenant.rentAmount,
          status: RentStatus.PENDING,
        },
      }),
    ),
  );

  return {
    generated: results.length,
    skipped: existingTenantIds.size,
    skippedZeroRent,
    results,
  };
};

export const getRents = async (
  filters: { tenantId?: string; status?: string; month?: string },
  page: number = 1,
  limit: number = 10,
) => {
  const skip = (page - 1) * limit;
  const where: Prisma.RentWhereInput = {};

  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.status) where.status = filters.status as RentStatus;
  if (filters.month) where.generatedMonth = filters.month;

  const [rents, total] = await Promise.all([
    prisma.rent.findMany({
      where,
      skip,
      take: limit,
      include: {
        tenant: { select: { id: true, name: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.rent.count({ where }),
  ]);

  return { rents, total, page, limit };
};

export const getRentById = async (id: string) => {
  const rent = await prisma.rent.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, name: true } },
      payments: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { paymentDate: 'desc' },
      },
    },
  });
  if (!rent) {
    throw new AppError('Rent record not found', 404, 'NOT_FOUND');
  }
  return rent;
};

/**
 * Marks overdue rents. Can be called by a daily cron job or manually by Admin.
 * Only transitions PENDING → OVERDUE (not PARTIAL, as partial payments show good faith).
 */
export const markOverdueRents = async () => {
  const now = new Date();
  const result = await prisma.rent.updateMany({
    where: {
      status: RentStatus.PENDING,
      dueDate: { lt: now },
    },
    data: { status: RentStatus.OVERDUE },
  });
  return { markedOverdue: result.count };
};
