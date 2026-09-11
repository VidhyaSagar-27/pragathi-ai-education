import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, updateDb } from '@/lib/db';
import { QuizSubmission, QuestionResultDetail } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Only authenticated students can submit quizzes' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { quizId, answers } = body; // answers: { [questionId: string]: string | number }

    if (!quizId || !answers) {
      return NextResponse.json({ error: 'Quiz ID and answers required' }, { status: 400 });
    }

    const db = await getDb();
    const quiz = db.quizzes.find((q) => q.id === quizId && q.isPublished);

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found or not currently active' }, { status: 404 });
    }

    let earnedScore = 0;
    const detailedResults: QuestionResultDetail[] = [];

    quiz.questions.forEach((q) => {
      const qType = q.type || 'MCQ';
      const studentAnswer = answers[q.id];
      let isCorrect = false;
      let marksAwarded = 0;
      let feedback = '';

      if (qType === 'MCQ') {
        const selectedIdx = typeof studentAnswer === 'number' ? studentAnswer : parseInt(studentAnswer, 10);
        isCorrect = selectedIdx === q.correctOptionIndex;
        marksAwarded = isCorrect ? q.marks : 0;
        feedback = isCorrect
          ? 'Correct choice!'
          : `Incorrect. Correct option was: ${q.options?.[q.correctOptionIndex ?? 0] || 'Option ' + ((q.correctOptionIndex ?? 0) + 1)}`;
      } else if (qType === 'FILL_IN_BLANK') {
        const cleanAnswer = String(studentAnswer || '').trim().toLowerCase();
        const acceptable = (q.acceptableAnswers && q.acceptableAnswers.length > 0)
          ? q.acceptableAnswers
          : (q.options && q.options.length > 0 ? q.options : [q.modelAnswer || '']);
        
        const isMatch = acceptable.some((acc) => cleanAnswer === acc.trim().toLowerCase());
        isCorrect = isMatch;
        marksAwarded = isCorrect ? q.marks : 0;
        feedback = isCorrect
          ? 'Exact match!'
          : `Acceptable answer(s): ${acceptable.join(', ')}`;
      } else if (qType === 'THEORY') {
        const studentText = String(studentAnswer || '').trim().toLowerCase();
        const keywords = q.theoryKeywords || [];

        if (keywords.length > 0) {
          const matched = keywords.filter((kw) => studentText.includes(kw.trim().toLowerCase()));
          const matchRatio = matched.length / keywords.length;
          // Scale marks by matched keywords
          marksAwarded = Math.round(q.marks * matchRatio);
          if (matched.length > 0 && marksAwarded === 0) marksAwarded = 1;
          isCorrect = marksAwarded >= Math.ceil(q.marks * 0.5);

          const missing = keywords.filter((kw) => !studentText.includes(kw.trim().toLowerCase()));
          feedback = `Matched key concepts: ${matched.length}/${keywords.length} (${matched.join(', ') || 'none'}). ` +
            (missing.length > 0 ? `Key missing concepts: ${missing.join(', ')}.` : 'Excellent conceptual coverage!');
        } else {
          // If no keywords specified, grade on substantive length (>15 words)
          const wordCount = studentText.split(/\s+/).filter(Boolean).length;
          if (wordCount >= 15) {
            marksAwarded = q.marks;
            isCorrect = true;
            feedback = 'Well articulated theoretical answer.';
          } else if (wordCount >= 5) {
            marksAwarded = Math.round(q.marks * 0.6);
            isCorrect = true;
            feedback = 'Good start. Elaborate more with examples for full credit.';
          } else {
            marksAwarded = 0;
            isCorrect = false;
            feedback = 'Answer too brief. Please explain in more detail.';
          }
        }
      } else if (qType === 'ASSIGNMENT') {
        const submissionStr = String(studentAnswer || '').trim();
        if (submissionStr.length > 10) {
          marksAwarded = q.marks;
          isCorrect = true;
          feedback = 'Assignment task submitted successfully.';
        } else {
          marksAwarded = 0;
          isCorrect = false;
          feedback = 'Incomplete assignment response.';
        }
      }

      earnedScore += marksAwarded;
      detailedResults.push({
        questionId: q.id,
        question: q.question,
        type: qType,
        studentAnswer: studentAnswer ?? '',
        isCorrect,
        marksAwarded,
        maxMarks: q.marks,
        feedback,
        modelAnswer: q.modelAnswer || q.explanation,
      });
    });

    const percentage = Math.round((earnedScore / (quiz.totalMarks || 1)) * 100);
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
      detailedResults,
    };

    await updateDb((dbState) => {
      dbState.quizSubmissions.unshift(submission);
    });

    // Send instant exam result notification (SMS/Email)
    try {
      const userObj = db.users.find((u) => u.id === session.userId);
      const recipient = userObj?.email || userObj?.phone || '';
      if (recipient) {
        const { sendExamResultAlert } = await import('@/lib/notifications');
        await sendExamResultAlert(
          recipient,
          session.name,
          quiz.title,
          earnedScore,
          quiz.totalMarks,
          percentage,
          passed
        );
      }
    } catch (notifErr) {
      console.warn('Exam result notification dispatch skipped:', notifErr);
    }

    return NextResponse.json({
      success: true,
      submission,
      questionResults: detailedResults,
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    return NextResponse.json({ error: 'Failed to process quiz submission' }, { status: 500 });
  }
}
