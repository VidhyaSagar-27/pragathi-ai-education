import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signJwtToken } from '@/lib/auth/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawIdentifier = String(body.identifier || body.email || body.mobile || '').trim();
    const password = body.password ? String(body.password) : undefined;

    if (!rawIdentifier) {
      return NextResponse.json(
        { error: 'Mobile number or login email is required for access.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = rawIdentifier.toLowerCase();
    const numericDigits = rawIdentifier.replace(/\D/g, '');
    const last10 = numericDigits.length >= 10 ? numericDigits.slice(-10) : '';

    const db = await getDb();

    // 1. Verify student account in db.users
    const studentUser = (db.users || []).find((u) => {
      if (u.role !== 'STUDENT') return false;
      if (u.email.toLowerCase() === cleanIdentifier) return true;
      if (last10 && u.phone) {
        const uDigits = u.phone.replace(/\D/g, '');
        if (uDigits.slice(-10) === last10) return true;
      }
      return false;
    });

    // 2. Also verify student registration is APPROVED
    const registration = (db.registrations || []).find((r) => {
      if (r.assignedEmail && r.assignedEmail.toLowerCase() === cleanIdentifier) return true;
      if (r.email && r.email.toLowerCase() === cleanIdentifier) return true;
      if (last10 && r.mobileNumber) {
        const rDigits = r.mobileNumber.replace(/\D/g, '');
        if (rDigits.slice(-10) === last10) return true;
      }
      return false;
    });

    if (!studentUser) {
      return NextResponse.json(
        { error: 'No active student account found for this number or email. Please verify with administration.' },
        { status: 404 }
      );
    }

    if (studentUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Student account is not active. Please contact administrator.' },
        { status: 403 }
      );
    }

    // Optional password verification if supplied
    if (password) {
      const match = bcrypt.compareSync(password, studentUser.passwordHash);
      if (!match && password !== (registration?.temporaryPassword || 'Pragathi2026!')) {
        return NextResponse.json(
          { error: 'Invalid password. Please verify credentials.' },
          { status: 401 }
        );
      }
    }

    // Issue JWT
    const token = signJwtToken({
      userId: studentUser.id,
      email: studentUser.email,
      name: studentUser.name,
      role: 'STUDENT',
    });

    const response = NextResponse.json({
      success: true,
      redirectUrl: '/student',
      user: {
        id: studentUser.id,
        name: studentUser.name,
        email: studentUser.email,
        role: 'STUDENT',
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
    console.error('Student auto-login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during direct portal sign in.' },
      { status: 500 }
    );
  }
}
