import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, generateNextRollNumber, noCacheHeaders } from '@/lib/db';
import { User, UserRole, UserStatus } from '@/lib/db/types';
import { triggerAutomationEvent } from '@/lib/automation/engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  const { searchParams } = new URL(req.url);
  let role = searchParams.get('role');

  // Instructors are scoped to viewing students
  if (session.role === 'INSTRUCTOR') {
    role = 'STUDENT';
  }

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

    const isStudent = role === 'STUDENT';

    if (!name || (!isStudent && !email) || !role) {
      return NextResponse.json(
        { error: 'Name and role are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;
    const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : undefined;
    const db = await getDb();

    if (cleanEmail && db.users.some((u) => u.email && u.email.toLowerCase() === cleanEmail)) {
      return NextResponse.json(
        { error: 'A user with this email address already exists.' },
        { status: 400 }
      );
    }

    const rawPassword = password || cleanPhone || 'Pragathi2026!';
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(rawPassword, salt);

    let rollNumber: string | undefined = undefined;
    let enrichedStudentDetails = studentDetails;

    if (isStudent) {
      rollNumber = studentDetails?.rollNumber || (await generateNextRollNumber());
      enrichedStudentDetails = {
        ...studentDetails,
        rollNumber,
        studentId: rollNumber,
        studentCode: rollNumber,
        mustChangePassword: true,
      };
    }

    const newUser: User = {
      id: `usr_${role.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash,
      role: role as UserRole,
      status: 'ACTIVE',
      phone: cleanPhone,
      rollNumber,
      mustChangePassword: isStudent,
      studentDetails: isStudent ? enrichedStudentDetails : undefined,
      instructorDetails: role === 'INSTRUCTOR' ? instructorDetails : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await updateDb((dbState) => {
      dbState.users.push(newUser);
    });

    if (isStudent && cleanPhone) {
      const origin = req.nextUrl?.origin || 'https://pragathi-ai-education.vercel.app';
      const channels: ('WHATSAPP' | 'EMAIL')[] = cleanEmail ? ['WHATSAPP', 'EMAIL'] : ['WHATSAPP'];
      triggerAutomationEvent({
        event: 'CREDENTIALS_DISPATCH',
        studentId: rollNumber,
        studentName: newUser.name,
        recipientMobile: cleanPhone,
        recipientEmail: cleanEmail,
        performedBy: session.name || session.email || 'Admin',
        channels,
        metadata: {
          role: 'STUDENT',
          rollNumber,
          loginEmail: rollNumber,
          temporaryPassword: cleanPhone,
          classGrade: enrichedStudentDetails?.classGrade || '10',
          schoolName: enrichedStudentDetails?.schoolName || '',
          origin,
          portalUrl: `${origin}/login?email=${encodeURIComponent(rollNumber || '')}&role=STUDENT`,
        },
      }).catch((err) => console.warn('Auto-dispatch error on student creation:', err));
    }

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
        const stuRoll = userToDelete.rollNumber || userToDelete.studentDetails?.rollNumber || userToDelete.studentDetails?.studentId;
        dbState.registrations = (dbState.registrations || []).filter((r) => {
          if (stuRoll && r.studentId === stuRoll) return false;
          if (r.id === userToDelete.id) return false;
          if (userToDelete.email && r.email?.toLowerCase() === userToDelete.email.toLowerCase()) return false;
          return true;
        });
        dbState.quizSubmissions = (dbState.quizSubmissions || []).filter(
          (q) => q.studentId !== id && q.studentId !== stuRoll
        );
      }
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' }, { headers: noCacheHeaders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500, headers: noCacheHeaders });
  }
}
