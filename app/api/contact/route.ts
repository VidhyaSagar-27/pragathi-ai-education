import { NextRequest, NextResponse } from 'next/server';
import { updateDb } from '@/lib/db';
import { ContactMessage } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const newMessage: ContactMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      subject: subject ? String(subject).trim() : 'General Inquiry',
      message: String(message).trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    await updateDb((db) => {
      db.messages.unshift(newMessage);
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for contacting PRAGATHI AI! Your message has been received.',
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact message.' },
      { status: 500 }
    );
  }
}
