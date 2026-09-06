import { NextRequest, NextResponse } from 'next/server';
import { updateDb } from '@/lib/db';
import { StudentRegistration } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentName,
      classGrade,
      schoolName,
      parentName,
      mobileNumber,
      email,
      location,
    } = body;

    if (!studentName || !classGrade || !schoolName || !parentName || !mobileNumber || !location) {
      return NextResponse.json(
        { error: 'Please fill in all required registration fields.' },
        { status: 400 }
      );
    }

    const cleanPhone = String(mobileNumber).trim();
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Please provide a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    const newRegistration: StudentRegistration = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentName: String(studentName).trim(),
      classGrade: String(classGrade).trim(),
      schoolName: String(schoolName).trim(),
      parentName: String(parentName).trim(),
      mobileNumber: cleanPhone,
      email: email ? String(email).trim() : undefined,
      location: String(location).trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    await updateDb((db) => {
      db.registrations.unshift(newRegistration);
    });

    return NextResponse.json({
      success: true,
      message:
        'Registration successfully submitted! Your application has been sent to PRAGATHI AI administrators for review. You will receive an update once approved.',
      registrationId: newRegistration.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred while saving your registration.' },
      { status: 500 }
    );
  }
}
