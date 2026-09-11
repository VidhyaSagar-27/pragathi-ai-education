import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signJwtToken } from '@/lib/auth/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawIdentifier = String(body.identifier || body.email || body.phone || '').trim();
    const { password } = body;

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { error: 'Email or mobile number, and password are required' },
        { status: 400 }
      );
    }

    const requestedRole = body.role ? String(body.role).toUpperCase().trim() : null;

    const cleanIdentifier = rawIdentifier.toLowerCase();
    const numericDigits = rawIdentifier.replace(/\D/g, '');

    const db = await getDb();
    const matchedUsers = db.users.filter((u) => {
      // 1. Match by email
      if (u.email.toLowerCase() === cleanIdentifier) return true;

      // 2. Match by phone number
      if (numericDigits.length >= 7 && u.phone) {
        const userDigits = u.phone.replace(/\D/g, '');
        if (userDigits === numericDigits) return true;
        if (
          userDigits.length >= 10 &&
          numericDigits.length >= 10 &&
          userDigits.slice(-10) === numericDigits.slice(-10)
        ) {
          return true;
        }
      }

      return false;
    });

    if (matchedUsers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email/phone number or password' },
        { status: 401 }
      );
    }

    // Smart role-aware authentication:
    // 1. Try matching requested role first
    let user: any = null;
    if (requestedRole) {
      const candidate = matchedUsers.find((u) => u.role === requestedRole);
      if (candidate && bcrypt.compareSync(password, candidate.passwordHash)) {
        user = candidate;
      }
    }

    // 2. Fallback: check other accounts matching this identifier if the password matches
    if (!user) {
      user = matchedUsers.find((u) => bcrypt.compareSync(password, u.passwordHash));
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email/phone number or password' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact the administrator.' },
        { status: 403 }
      );
    }

    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    const message = error?.message?.includes('DATABASE_URL')
      ? 'Database configuration error: DATABASE_URL is not configured in Vercel environment variables.'
      : 'An unexpected error occurred during login';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
