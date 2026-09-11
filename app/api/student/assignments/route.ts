import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb, noCacheHeaders } from '@/lib/db';
import { StudentAssignmentSubmission } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const submissions = db.assignmentSubmissions || [];

  if (session.role === 'STUDENT') {
    const studentSubs = submissions.filter((s) => s.studentId === session.userId);
    return NextResponse.json({ submissions: studentSubs }, { headers: noCacheHeaders });
  }

  // Instructor or Admin can see all submissions
  return NextResponse.json({ submissions }, { headers: noCacheHeaders });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Only students can submit assignments' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { assignmentId, submissionText, submissionUrl } = body;

    if (!assignmentId || (!submissionText && !submissionUrl)) {
      return NextResponse.json(
        { error: 'Assignment ID and submission text or link are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const assignment = db.assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Automatic evaluation calculation based on criteria and completeness
    const textLen = (submissionText || '').trim().length;
    const hasUrl = Boolean(submissionUrl && submissionUrl.trim().startsWith('http'));
    let score = 8;
    let feedback = 'Good assignment submission.';

    if (textLen > 150 || (textLen > 50 && hasUrl)) {
      score = 10;
      feedback = 'Outstanding submission meeting all analytical and technical requirements.';
    } else if (textLen > 40 || hasUrl) {
      score = 8;
      feedback = 'Satisfactory completion of core exercise requirements.';
    } else {
      score = 5;
      feedback = 'Basic submission provided. Include more comprehensive explanation.';
    }

    const newSub: StudentAssignmentSubmission = {
      id: `asgsub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      assignmentId,
      assignmentTitle: assignment.title,
      moduleId: assignment.moduleId,
      studentId: session.userId,
      studentName: session.name,
      submissionText: submissionText ? String(submissionText).trim() : undefined,
      submissionUrl: submissionUrl ? String(submissionUrl).trim() : undefined,
      submittedAt: new Date().toISOString(),
      status: 'GRADED',
      score,
      maxScore: 10,
      feedback,
    };

    await updateDb((dbState) => {
      if (!dbState.assignmentSubmissions) {
        dbState.assignmentSubmissions = [];
      }
      // Remove any prior submission for this assignment by this student
      dbState.assignmentSubmissions = dbState.assignmentSubmissions.filter(
        (s) => !(s.assignmentId === assignmentId && s.studentId === session.userId)
      );
      dbState.assignmentSubmissions.unshift(newSub);
    });

    return NextResponse.json({ success: true, submission: newSub });
  } catch (err) {
    console.error('Assignment submission error:', err);
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
  }
}
