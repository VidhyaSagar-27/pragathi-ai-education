import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { CertificateItem } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  let certificates = (db.certificates || []).filter((c) => c.studentId === session.userId);
  const submissions = (db.quizSubmissions || []).filter((s) => s.studentId === session.userId && s.passed);

  // Auto-award certificate if student has passed any exam and doesn't have a certificate yet
  if (submissions.length > 0 && certificates.length === 0) {
    const newCert: CertificateItem = {
      id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: session.userId,
      studentName: session.name,
      certificateNumber: `PAI-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      programName: 'PRAGATHI AI Foundation Program: Foundations of AI & Machine Learning',
      issueDate: new Date().toISOString().slice(0, 10),
      status: 'ISSUED',
    };

    await updateDb((dbState) => {
      if (!dbState.certificates) dbState.certificates = [];
      dbState.certificates.unshift(newCert);
    });

    certificates = [newCert];
  }

  return NextResponse.json({ certificates }, { headers: noCacheHeaders });
}
