import prisma from '../prisma/client';
import { AppError } from '../utils/response';
import { Prisma } from '@prisma/client';

interface CreatePropertyInput {
  buildingName?: string | null;
  unitType: 'SHOP' | 'HOUSE';
  unitName: string;
  address: string;
  ownerId: string;
  managerId?: string | null;
  size?: string | null;
  layoutImage?: string | null;
  images?: string[];
  floor?: number | null;
  googleLocation?: string | null;
  meterNo?: string | null;
  rentIncrement?: number | null;
  rentIncrementType?: 'PERCENTAGE' | 'AMOUNT' | null;
}

interface UpdatePropertyInput {
  buildingName?: string | null;
  unitType?: 'SHOP' | 'HOUSE';
  unitName?: string;
  address?: string;
  managerId?: string | null;
  isActive?: boolean;
  size?: string | null;
  layoutImage?: string | null;
  images?: string[];
  floor?: number | null;
  googleLocation?: string | null;
  meterNo?: string | null;
  rentIncrement?: number | null;
  rentIncrementType?: 'PERCENTAGE' | 'AMOUNT' | null;
}

const PROPERTY_INCLUDE = {
  owner: { select: { id: true, name: true, email: true } },
  manager: { select: { id: true, name: true, email: true } },
  _count: { select: { tenants: { where: { isActive: true } } } },
};

export const createProperty = async (data: CreatePropertyInput) => {
  // Verify owner exists and is ADMIN
  const owner = await prisma.user.findUnique({ where: { id: data.ownerId } });
  if (!owner) {
    throw new AppError('Owner not found', 404, 'NOT_FOUND');
  }
  if (owner.role !== 'ADMIN') {
    throw new AppError('Only users with ADMIN role can be property owners', 400, 'BUSINESS_RULE_ERROR');
  }

  // Verify manager role if assigned
  if (data.managerId) {
    const manager = await prisma.user.findUnique({ where: { id: data.managerId } });
    if (!manager) {
      throw new AppError('Manager not found', 404, 'NOT_FOUND');
    }
    if (manager.role !== 'MANAGER' && manager.role !== 'ADMIN') {
      throw new AppError('Assigned user must have MANAGER or ADMIN role', 400, 'BUSINESS_RULE_ERROR');
    }
    if (!manager.isActive) {
      throw new AppError('Cannot assign an inactive user as manager', 400, 'BUSINESS_RULE_ERROR');
    }
  }

  return prisma.property.create({
    data: {
      buildingName: data.buildingName || null,
      unitType: data.unitType,
      unitName: data.unitName,
      address: data.address,
      ownerId: data.ownerId,
      managerId: data.managerId || null,
      size: data.size || null,
      layoutImage: data.layoutImage || null,
      images: data.images || [],
      floor: data.floor ?? null,
      googleLocation: data.googleLocation || null,
      meterNo: data.meterNo || null,
      rentIncrement: data.rentIncrement ?? null,
      rentIncrementType: data.rentIncrementType || null,
    },
    include: PROPERTY_INCLUDE,
  });
};

export const getProperties = async (
  user: { id: string; role: string },
  page: number = 1,
  limit: number = 10,
) => {
  const skip = (page - 1) * limit;
  const where: Prisma.PropertyWhereInput = { isActive: true };

  // RBAC: Managers only see their assigned properties
  if (user.role === 'MANAGER') {
    where.managerId = user.id;
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      include: PROPERTY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.property.count({ where }),
  ]);

  return { properties, total, page, limit };
};

export const getPropertyById = async (id: string, user: { id: string; role: string }) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: PROPERTY_INCLUDE,
  });

  if (!property || !property.isActive) {
    throw new AppError('Property not found', 404, 'NOT_FOUND');
  }

  // RBAC: Managers can only view their own assigned properties
  if (user.role === 'MANAGER' && property.managerId !== user.id) {
    throw new AppError('You do not have access to this property', 403, 'PERMISSION_ERROR');
  }

  return property;
};

export const updateProperty = async (id: string, data: UpdatePropertyInput, user: { id: string; role: string }) => {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) {
    throw new AppError('Property not found', 404, 'NOT_FOUND');
  }

  // RBAC: Only admin or the assigned manager can update
  if (user.role === 'MANAGER' && property.managerId !== user.id) {
    throw new AppError('You do not have permission to update this property', 403, 'PERMISSION_ERROR');
  }

  // Validate new manager if being changed
  if (data.managerId) {
    const newManager = await prisma.user.findUnique({ where: { id: data.managerId } });
    if (!newManager || (newManager.role !== 'MANAGER' && newManager.role !== 'ADMIN')) {
      throw new AppError('Invalid manager assignment', 400, 'BUSINESS_RULE_ERROR');
    }
  }

  return prisma.property.update({
    where: { id },
    data,
    include: PROPERTY_INCLUDE,
  });
};
