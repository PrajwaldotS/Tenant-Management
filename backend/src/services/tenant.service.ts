import prisma from '../prisma/client';
import { AppError } from '../utils/response';
import { Prisma } from '@prisma/client';

interface CreateTenantInput {
  name: string;
  phone: string;
  propertyId: string;
  rentAmount: number;
  moveInDate: string;
}

interface UpdateTenantInput {
  name?: string;
  phone?: string;
  rentAmount?: number;
  isActive?: boolean;
}

const TENANT_INCLUDE = {
  property: { select: { id: true, name: true, address: true } },
};

export const createTenant = async (data: CreateTenantInput) => {
  // Verify property exists and is active
  const property = await prisma.property.findUnique({ where: { id: data.propertyId } });
  if (!property) {
    throw new AppError('Property not found', 404, 'NOT_FOUND');
  }
  if (!property.isActive) {
    throw new AppError('Cannot add tenant to a deactivated property', 400, 'BUSINESS_RULE_ERROR');
  }

  return prisma.tenant.create({
    data: {
      name: data.name,
      phone: data.phone,
      propertyId: data.propertyId,
      rentAmount: data.rentAmount,
      moveInDate: new Date(data.moveInDate),
    },
    include: TENANT_INCLUDE,
  });
};

export const getTenants = async (
  propertyId?: string,
  page: number = 1,
  limit: number = 10,
  includeInactive: boolean = false,
) => {
  const skip = (page - 1) * limit;
  const where: Prisma.TenantWhereInput = {};
  if (propertyId) where.propertyId = propertyId;
  if (!includeInactive) where.isActive = true;

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      include: TENANT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tenant.count({ where }),
  ]);

  return { tenants, total, page, limit };
};

export const getTenantById = async (id: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      ...TENANT_INCLUDE,
      rents: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });
  if (!tenant) {
    throw new AppError('Tenant not found', 404, 'NOT_FOUND');
  }
  return tenant;
};

export const updateTenant = async (id: string, data: UpdateTenantInput) => {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    throw new AppError('Tenant not found', 404, 'NOT_FOUND');
  }

  return prisma.tenant.update({
    where: { id },
    data,
    include: TENANT_INCLUDE,
  });
};
