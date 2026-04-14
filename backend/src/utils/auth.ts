import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

export interface TokenPayload {
  id: string;
  role: string;
}

/**
 * Lazy getter for JWT_SECRET.
 * This MUST be called at runtime (not module-load time) because
 * dotenv.config() in index.ts hasn't run yet when this module is imported.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('FATAL: JWT_SECRET environment variable is not set.');
    process.exit(1);
  }
  return secret;
}

export const generateToken = (payload: TokenPayload): string => {
  const secret = getJwtSecret();
  const expiresIn = (process.env.JWT_EXPIRES_IN || '1d') as string;
  const options: SignOptions = { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): TokenPayload => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret) as TokenPayload;
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const comparePassword = async (password: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(password, hashed);
};
