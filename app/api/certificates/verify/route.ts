import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const certId = (searchParams.get('id') || '').trim();

  if (!certId) {
    return NextResponse.json({ error: 'Certificate ID or Number is required.' }, { status: 400 });
  }

  const db = await getDb();
  const certs = db.certificates || [];
  const cert = certs.find(
    (c) =>
      c.certificateNumber.toLowerCase() === certId.toLowerCase() ||
      c.id.toLowerCase() === certId.toLowerCase()
  );

  if (!cert) {
    return NextResponse.json(
      { valid: false, message: 'Certificate record not found. Please verify the ID number.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    valid: true,
    certificate: {
      certificateNumber: cert.certificateNumber,
      studentName: cert.studentName,
      programName: cert.programName,
      issueDate: cert.issueDate,
      status: cert.status,
      issuer: 'PRAGATHI AI Academy (Affiliated AI Foundation Program)',
      verifiedAt: new Date().toISOString(),
    },
  });
}
