import prisma from '../prisma/client';
import { hashPassword } from '../utils/auth';
import { AppError } from '../utils/response';
import { Prisma } from '@prisma/client';

// Fields safe to return to the client (never expose password)
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'COLLECTOR';
}

export const createUser = async (data: CreateUserInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new AppError('User with this email already exists', 409, 'DUPLICATE_ERROR');
  }

  const hashedPassword = await hashPassword(data.password);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
    select: USER_SELECT,
  });
};

/**
 * Returns ALL users (including deactivated) so Admin can manage them.
 * The original only returned isActive:true which hid deactivated users.
 */
export const getAllUsers = async (page: number = 1, limit: number = 10, includeInactive: boolean = true) => {
  const skip = (page - 1) * limit;
  const where: Prisma.UserWhereInput = includeInactive ? {} : { isActive: true };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  return user;
};

export const toggleUserStatus = async (id: string, isActive: boolean) => {
  // Verify user exists before updating
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: USER_SELECT,
  });
};
