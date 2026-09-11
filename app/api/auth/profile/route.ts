import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCacheHeaders });
  }

  const db = await getDb();
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404, headers: noCacheHeaders });
  }

  const { passwordHash, ...safeUser } = user;
  return NextResponse.json({ user: safeUser }, { headers: noCacheHeaders });
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { photoUrl, password, name, phone } = body;

    let updated = false;

    await updateDb((db) => {
      const user = db.users.find((u) => u.id === session.userId);
      if (!user) return;

      if (name && typeof name === 'string') {
        user.name = name.trim();
      }

      if (phone && typeof phone === 'string') {
        user.phone = phone.trim();
      }

      if (photoUrl !== undefined) {
        if (user.role === 'STUDENT') {
          if (!user.studentDetails) {
            user.studentDetails = {
              classGrade: 'Grade 9',
              schoolName: 'Pragathi AI Academy',
              parentName: 'Parent',
              location: 'India',
              group: 'Foundation Batch A',
            };
          }
          user.studentDetails.photoUrl = photoUrl ? String(photoUrl).trim() : undefined;
        } else if (user.role === 'INSTRUCTOR') {
          if (user.instructorDetails) {
            user.instructorDetails.photoUrl = photoUrl ? String(photoUrl).trim() : undefined;
          }
        }
      }

      if (password && typeof password === 'string' && password.length >= 6) {
        const salt = bcrypt.genSaltSync(10);
        user.passwordHash = bcrypt.hashSync(password, salt);
      }

      user.updatedAt = new Date().toISOString();
      updated = true;
    });

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
