import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb } from '@/lib/db';
import { Quiz, QuizQuestion } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get('moduleId');
  const quizId = searchParams.get('id');

  const db = getDb();
  let quizzes = db.quizzes;

  if (session?.role === 'STUDENT' || !session) {
    quizzes = quizzes.filter((q) => q.isPublished);
  }

  if (moduleId) {
    quizzes = quizzes.filter((q) => q.moduleId === Number(moduleId));
  }

  if (quizId) {
    const singleQuiz = quizzes.find((q) => q.id === quizId);
    if (!singleQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // If student is taking the quiz, don't leak the correct answer index!
    if (session?.role === 'STUDENT' || !session) {
      const sanitizedQuiz = {
        ...singleQuiz,
        questions: singleQuiz.questions.map(({ correctOptionIndex, explanation, ...q }) => q),
      };
      return NextResponse.json({ quiz: sanitizedQuiz });
    }

    return NextResponse.json({ quiz: singleQuiz });
  }

  // If student listing quizzes, sanitize questions
  if (session?.role === 'STUDENT' || !session) {
    const sanitizedQuizzes = quizzes.map((q) => ({
      ...q,
      questions: q.questions.map(({ correctOptionIndex, explanation, ...rest }) => rest),
    }));
    return NextResponse.json({ quizzes: sanitizedQuizzes });
  }

  return NextResponse.json({ quizzes });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      moduleId,
      instructions,
      timeLimitMinutes,
      passingMarks,
      questions,
      isPublished,
    } = body;

    if (!title || !moduleId || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Title, Module, and at least one Question are required.' },
        { status: 400 }
      );
    }

    let calculatedTotal = 0;
    const formattedQuestions: QuizQuestion[] = questions.map((q: any, idx: number) => {
      const marks = Number(q.marks) || 1;
      calculatedTotal += marks;
      return {
        id: q.id || `q_${Date.now()}_${idx}`,
        question: String(q.question).trim(),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        correctOptionIndex: Number(q.correctOptionIndex) || 0,
        marks,
        explanation: q.explanation ? String(q.explanation).trim() : undefined,
      };
    });

    const newQuiz: Quiz = {
      id: `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: String(title).trim(),
      moduleId: Number(moduleId),
      instructions: instructions ? String(instructions).trim() : 'Answer all questions carefully.',
      timeLimitMinutes: Number(timeLimitMinutes) || 15,
      totalMarks: calculatedTotal,
      passingMarks: Number(passingMarks) || Math.ceil(calculatedTotal * 0.5),
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      questions: formattedQuestions,
      createdBy: session.userId,
      creatorName: session.name,
      createdAt: new Date().toISOString(),
    };

    updateDb((dbState) => {
      dbState.quizzes.unshift(newQuiz);
    });

    return NextResponse.json({ success: true, quiz: newQuiz });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      id,
      title,
      moduleId,
      instructions,
      timeLimitMinutes,
      passingMarks,
      questions,
      isPublished,
    } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    updateDb((dbState) => {
      const quiz = dbState.quizzes.find((q) => q.id === id);
      if (quiz) {
        if (title) quiz.title = String(title).trim();
        if (moduleId) quiz.moduleId = Number(moduleId);
        if (instructions !== undefined) quiz.instructions = String(instructions).trim();
        if (timeLimitMinutes) quiz.timeLimitMinutes = Number(timeLimitMinutes);
        if (passingMarks) quiz.passingMarks = Number(passingMarks);
        if (isPublished !== undefined) quiz.isPublished = Boolean(isPublished);

        if (Array.isArray(questions)) {
          let calculatedTotal = 0;
          quiz.questions = questions.map((q: any, idx: number) => {
            const marks = Number(q.marks) || 1;
            calculatedTotal += marks;
            return {
              id: q.id || `q_${Date.now()}_${idx}`,
              question: String(q.question).trim(),
              options: Array.isArray(q.options) ? q.options.map(String) : [],
              correctOptionIndex: Number(q.correctOptionIndex) || 0,
              marks,
              explanation: q.explanation ? String(q.explanation).trim() : undefined,
            };
          });
          quiz.totalMarks = calculatedTotal;
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  updateDb((dbState) => {
    dbState.quizzes = dbState.quizzes.filter((q) => q.id !== id);
  });

  return NextResponse.json({ success: true });
}
