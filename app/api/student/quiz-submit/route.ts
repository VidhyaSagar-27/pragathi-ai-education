import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb } from '@/lib/db';
import { QuizSubmission } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Only authenticated students can submit quizzes' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { quizId, answers } = body; // answers: { [questionId: string]: number }

    if (!quizId || !answers) {
      return NextResponse.json({ error: 'Quiz ID and answers required' }, { status: 400 });
    }

    const db = getDb();
    const quiz = db.quizzes.find((q) => q.id === quizId && q.isPublished);

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found or not currently active' }, { status: 404 });
    }

    let earnedScore = 0;
    const questionResults: Array<{
      questionId: string;
      question: string;
      selectedOptionIndex: number;
      correctOptionIndex: number;
      isCorrect: boolean;
      marksEarned: number;
      marksTotal: number;
      explanation?: string;
    }> = [];

    quiz.questions.forEach((q) => {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctOptionIndex;
      const marksEarned = isCorrect ? q.marks : 0;
      earnedScore += marksEarned;

      questionResults.push({
        questionId: q.id,
        question: q.question,
        selectedOptionIndex: selected,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        marksEarned,
        marksTotal: q.marks,
        explanation: q.explanation,
      });
    });

    const percentage = Math.round((earnedScore / quiz.totalMarks) * 100);
    const passed = earnedScore >= quiz.passingMarks;

    const submission: QuizSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      moduleId: quiz.moduleId,
      studentId: session.userId,
      studentName: session.name,
      answers,
      score: earnedScore,
      totalMarks: quiz.totalMarks,
      percentage,
      passed,
      submittedAt: new Date().toISOString(),
    };

    updateDb((dbState) => {
      // Remove any previous attempt for this quiz if present or prepend new
      dbState.quizSubmissions.unshift(submission);
    });

    return NextResponse.json({
      success: true,
      submission,
      questionResults,
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    return NextResponse.json({ error: 'Failed to process quiz submission' }, { status: 500 });
  }
}
