import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '../db/types';

const JWT_SECRET = process.env.JWT_SECRET || 'pragathi_ai_super_secure_jwt_secret_key_2026_foundation';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export function signJwtToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  expiresIn: SignOptions['expiresIn'] = '7d'
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwtToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}
