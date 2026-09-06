import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb } from '@/lib/db';
import { User, StudentRegistration } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  return NextResponse.json({ registrations: db.registrations });
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, action, initialPassword, customEmail } = body;

    if (!id || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Registration ID and valid action (APPROVE/REJECT) are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const reg = db.registrations.find((r) => r.id === id);
    if (!reg) {
      return NextResponse.json({ error: 'Registration application not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      const studentEmail = (
        customEmail ||
        reg.email ||
        `${reg.studentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@pragathiai.student`
      ).trim().toLowerCase();

      // Check if student user already exists
      const existingUser = db.users.find((u) => u.email.toLowerCase() === studentEmail);
      if (existingUser) {
        return NextResponse.json(
          { error: `A user with email ${studentEmail} already exists.` },
          { status: 400 }
        );
      }

      const rawPassword = initialPassword || 'Pragathi2026!';
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(rawPassword, salt);

      const newStudentUser: User = {
        id: `usr_stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: reg.studentName,
        email: studentEmail,
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
        phone: reg.mobileNumber,
        studentDetails: {
          classGrade: reg.classGrade,
          schoolName: reg.schoolName,
          parentName: reg.parentName,
          location: reg.location,
          group: 'Foundation Batch A',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      updateDb((dbState) => {
        const item = dbState.registrations.find((r) => r.id === id);
        if (item) item.status = 'APPROVED';
        dbState.users.push(newStudentUser);
      });

      return NextResponse.json({
        success: true,
        message: 'Registration approved and student account created.',
        createdStudent: {
          email: studentEmail,
          temporaryPassword: rawPassword,
          name: reg.studentName,
        },
      });
    } else {
      updateDb((dbState) => {
        const item = dbState.registrations.find((r) => r.id === id);
        if (item) item.status = 'REJECTED';
      });

      return NextResponse.json({
        success: true,
        message: 'Registration application rejected.',
      });
    }
  } catch (error) {
    console.error('Registration action error:', error);
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  updateDb((dbState) => {
    dbState.registrations = dbState.registrations.filter((r) => r.id !== id);
  });

  return NextResponse.json({ success: true });
}
