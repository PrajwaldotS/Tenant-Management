import prisma from '../prisma/client';
import { comparePassword, generateToken } from '../utils/auth';
import { AppError } from '../utils/response';

/**
 * Authenticates a user and returns a JWT token.
 * 
 * Security notes:
 * - Always checks password even if user doesn't exist (timing-attack mitigation)
 * - Checks isActive AFTER password validation to avoid leaking user existence
 */
export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always run bcrypt compare even if user is null — prevents timing attacks
  // that reveal whether an email exists in the system
  const dummyHash = '$2b$12$000000000000000000000000000000000000000000000000000000';
  const isValidPassword = await comparePassword(password, user?.password ?? dummyHash);

  if (!user || !isValidPassword) {
    throw new AppError('Invalid email or password', 401, 'AUTH_ERROR');
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated. Contact your administrator.', 403, 'AUTH_ERROR');
  }

  const token = generateToken({ id: user.id, role: user.role });

  // Update last login timestamp (fire-and-forget, non-blocking)
  prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  }).catch((err: any) => console.error('Failed to update lastLoginAt:', err.message));

  // Strip password from response
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};
