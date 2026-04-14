import prisma from '../prisma/client';
import { RentStatus } from '@prisma/client';

/**
 * Dashboard statistics — aggregated financial and operational metrics.
 * Uses parallel queries for optimal performance.
 */
export const getDashboardStats = async () => {
  const [
    propertyCount,
    tenantCount,
    totalRevenue,
    pendingRentCount,
    overdueRentCount,
    recentPayments,
    monthlyRevenue,
  ] = await Promise.all([
    prisma.property.count({ where: { isActive: true } }),
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.rent.count({ where: { status: RentStatus.PENDING } }),
    prisma.rent.count({ where: { status: RentStatus.OVERDUE } }),
    prisma.payment.findMany({
      take: 10,
      orderBy: { paymentDate: 'desc' },
      include: {
        tenant: { select: { id: true, name: true } },
        rent: { select: { generatedMonth: true } },
        createdBy: { select: { name: true } },
      },
    }),
    // Revenue for current month
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        paymentDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  return {
    totalProperties: propertyCount,
    totalTenants: tenantCount,
    totalRevenue: Number(totalRevenue._sum.amount || 0),
    monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
    pendingRents: pendingRentCount,
    overdueRents: overdueRentCount,
    recentPayments,
  };
};
