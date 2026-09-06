import { NextRequest, NextResponse } from 'next/server';
import { updateDb } from '@/lib/db';
import { SchoolPartnership } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      schoolName,
      contactPerson,
      designation,
      mobileNumber,
      email,
      schoolLocation,
      message,
    } = body;

    if (!schoolName || !contactPerson || !designation || !mobileNumber || !email || !schoolLocation) {
      return NextResponse.json(
        { error: 'Please fill in all required fields for school partnership.' },
        { status: 400 }
      );
    }

    const newPartnership: SchoolPartnership = {
      id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      schoolName: String(schoolName).trim(),
      contactPerson: String(contactPerson).trim(),
      designation: String(designation).trim(),
      mobileNumber: String(mobileNumber).trim(),
      email: String(email).trim().toLowerCase(),
      schoolLocation: String(schoolLocation).trim(),
      message: message ? String(message).trim() : '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    updateDb((db) => {
      db.partnerships.unshift(newPartnership);
    });

    return NextResponse.json({
      success: true,
      message:
        'Thank you! Your school partnership request has been registered. The PRAGATHI AI team will get in touch with you shortly.',
    });
  } catch (error) {
    console.error('Partnership submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit school partnership request.' },
      { status: 500 }
    );
  }
}
