import prisma from '../prisma/client';
import { AppError } from '../utils/response';
import { RentStatus, Prisma } from '@prisma/client';

interface CreatePaymentInput {
  amount: number;
  rentId: string;
  tenantId: string;
  method: 'CASH' | 'UPI' | 'BANK';
  referenceId?: string;
  followUpDate?: Date | string | null;
}

/**
 * Processes a payment inside a Prisma interactive transaction.
 *
 * Workflow:
 * 1. Fetch rent + existing payments (locked by transaction)
 * 2. Validate: rent exists, rent belongs to tenant, not already PAID
 * 3. Validate: amount <= remaining balance (overpayment rejection)
 * 4. Create payment record
 * 5. Update rent status atomically (PARTIAL or PAID)
 */
export const processPayment = async (data: CreatePaymentInput, collectorId: string) => {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch rent with all its payments
    const rent = await tx.rent.findUnique({
      where: { id: data.rentId },
      include: { payments: { select: { amount: true } } },
    });

    if (!rent) {
      throw new AppError('Rent record not found', 404, 'NOT_FOUND');
    }

    // 2. Verify tenant-rent relationship
    if (rent.tenantId !== data.tenantId) {
      throw new AppError('This rent does not belong to the specified tenant', 400, 'BUSINESS_RULE_ERROR');
    }

    // 3. Reject payment on already-PAID rent
    if (rent.status === RentStatus.PAID) {
      throw new AppError('This rent is already fully paid', 400, 'BUSINESS_RULE_ERROR');
    }

    // 4. Calculate remaining balance and check overpayment
    const totalPaid = rent.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Number(rent.amount) - totalPaid;

    if (data.amount > balance) {
      throw new AppError(
        `Overpayment rejected. Remaining balance is ₹${balance.toFixed(2)}. You attempted ₹${data.amount.toFixed(2)}.`,
        400,
        'BUSINESS_RULE_ERROR',
      );
    }

    // 5. Create the payment
    const payment = await tx.payment.create({
      data: {
        amount: data.amount,
        tenantId: data.tenantId,
        rentId: data.rentId,
        method: data.method,
        referenceId: data.referenceId || null,
        createdById: collectorId,
      },
      include: {
        tenant: { select: { name: true } },
        rent: { select: { generatedMonth: true } },
        createdBy: { select: { name: true } },
      },
    });

    // 6. Update rent status
    const newTotalPaid = totalPaid + data.amount;
    const newStatus = newTotalPaid >= Number(rent.amount)
      ? RentStatus.PAID
      : RentStatus.PARTIAL;

    await tx.rent.update({
      where: { id: rent.id },
      data: { 
        status: newStatus,
        followUpDate: newStatus === RentStatus.PAID ? null : (data.followUpDate ? new Date(data.followUpDate) : undefined),
      },
    });

    return {
      payment,
      rentStatus: newStatus,
      remainingBalance: Number(rent.amount) - newTotalPaid,
    };
  });
};

export const getPaymentHistory = async (
  filters: { tenantId?: string; method?: string },
  page: number = 1,
  limit: number = 10,
) => {
  const skip = (page - 1) * limit;
  const where: Prisma.PaymentWhereInput = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.method) where.method = filters.method as any;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      include: {
        tenant: { select: { id: true, name: true } },
        rent: { select: { generatedMonth: true, amount: true, status: true, followUpDate: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, total, page, limit };
};
