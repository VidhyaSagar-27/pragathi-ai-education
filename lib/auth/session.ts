import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { verifyJwtToken, TokenPayload } from './jwt';
import { getDb } from '../db';
import { User, UserRole } from '../db/types';

export const AUTH_COOKIE_NAME = 'pragathi_ai_auth_token';

export async function getServerSession(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJwtToken(token);
}

export function getSessionFromRequest(req: NextRequest): TokenPayload | null {
  const token =
    req.cookies.get(AUTH_COOKIE_NAME)?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) return null;
  return verifyJwtToken(token);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession();
  if (!session) return null;

  const db = getDb();
  const user = db.users.find((u) => u.id === session.userId && u.status === 'ACTIVE');
  return user || null;
}

export function requireRole(session: TokenPayload | null, allowedRoles: UserRole[]): boolean {
  if (!session) return false;
  return allowedRoles.includes(session.role);
}
