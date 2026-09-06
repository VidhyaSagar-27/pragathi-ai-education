import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { User, UserRole, UserStatus } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');

  const db = await getDb();
  let users = db.users || [];

  if (role) {
    users = users.filter((u) => u.role === role);
  }

  // Sanitize passwordHash before returning
  const safeUsers = users.map(({ passwordHash, ...safe }) => safe);
  return NextResponse.json({ users: safeUsers }, { headers: noCacheHeaders });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role,
      phone,
      studentDetails,
      instructorDetails,
    } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const db = await getDb();

    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return NextResponse.json(
        { error: 'A user with this email address already exists.' },
        { status: 400 }
      );
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser: User = {
      id: `usr_${role.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash,
      role: role as UserRole,
      status: 'ACTIVE',
      phone: phone ? String(phone).trim() : undefined,
      studentDetails: role === 'STUDENT' ? studentDetails : undefined,
      instructorDetails: role === 'INSTRUCTOR' ? instructorDetails : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await updateDb((dbState) => {
      dbState.users.push(newUser);
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, email, password, status, phone, studentDetails, instructorDetails } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let updatedUser: User | null = null;

    await updateDb((dbState) => {
      const index = dbState.users.findIndex((u) => u.id === id);
      if (index === -1) return;

      const current = dbState.users[index];

      if (name) current.name = String(name).trim();
      if (email) current.email = String(email).trim().toLowerCase();
      if (status) current.status = status as UserStatus;
      if (phone !== undefined) current.phone = phone;
      if (studentDetails) current.studentDetails = { ...current.studentDetails, ...studentDetails };
      if (instructorDetails) current.instructorDetails = { ...current.instructorDetails, ...instructorDetails };

      if (password && password.trim().length >= 6) {
        const salt = bcrypt.genSaltSync(10);
        current.passwordHash = bcrypt.hashSync(password, salt);
      }

      current.updatedAt = new Date().toISOString();
      updatedUser = current;
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { passwordHash: _, ...safeUser } = updatedUser as User;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (id === 'usr_admin_master') {
      return NextResponse.json(
        { error: 'The Master Administrator account cannot be deleted.' },
        { status: 400 }
      );
    }

    await updateDb((dbState) => {
      const userToDelete = dbState.users.find((u) => u.id === id);
      dbState.users = (dbState.users || []).filter((u) => u.id !== id);
      if (userToDelete && userToDelete.role === 'STUDENT') {
        dbState.registrations = (dbState.registrations || []).filter(
          (r) =>
            r.email?.toLowerCase() !== userToDelete.email.toLowerCase() &&
            (!userToDelete.phone || r.mobileNumber !== userToDelete.phone)
        );
        dbState.quizSubmissions = (dbState.quizSubmissions || []).filter((q) => q.studentId !== id);
      }
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' }, { headers: noCacheHeaders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500, headers: noCacheHeaders });
  }
}
