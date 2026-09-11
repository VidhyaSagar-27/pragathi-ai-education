import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getDb, noCacheHeaders } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== 'ADMIN' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403, headers: noCacheHeaders });
  }

  const db = await getDb();
  const students = (db.users || []).filter((u) => u.role === 'STUDENT');
  const submissions = db.quizSubmissions || [];
  const assignments = db.assignmentSubmissions || [];

  const studentReports = students.map((stu) => {
    const stuQuizzes = submissions.filter((s) => s.studentId === stu.id);
    const stuAssignments = assignments.filter((a) => a.studentId === stu.id);

    const totalQuizzesAttempted = stuQuizzes.length;
    const passedQuizzes = stuQuizzes.filter((s) => s.passed).length;
    const totalScoreEarned = stuQuizzes.reduce((acc, s) => acc + s.score, 0);
    const totalMaxMarks = stuQuizzes.reduce((acc, s) => acc + s.totalMarks, 0);
    const averagePercentage = totalMaxMarks > 0 ? Math.round((totalScoreEarned / totalMaxMarks) * 100) : 0;

    return {
      id: stu.id,
      name: stu.name,
      email: stu.email,
      phone: stu.phone || 'N/A',
      schoolName: stu.studentDetails?.schoolName || 'N/A',
      classGrade: stu.studentDetails?.classGrade || 'N/A',
      group: stu.studentDetails?.group || 'Foundation Batch A',
      location: stu.studentDetails?.location || 'India',
      photoUrl: stu.studentDetails?.photoUrl || '',
      status: stu.status,
      joinedAt: stu.createdAt,
      totalQuizzesAttempted,
      passedQuizzes,
      averagePercentage,
      totalScoreEarned,
      totalMaxMarks,
      quizzes: stuQuizzes.map((q) => ({
        id: q.id,
        quizTitle: q.quizTitle,
        moduleId: q.moduleId,
        score: q.score,
        totalMarks: q.totalMarks,
        percentage: q.percentage,
        passed: q.passed,
        submittedAt: q.submittedAt,
      })),
      assignments: stuAssignments.map((a) => ({
        id: a.id,
        assignmentTitle: a.assignmentTitle,
        moduleId: a.moduleId,
        score: a.score,
        maxScore: a.maxScore,
        submittedAt: a.submittedAt,
      })),
    };
  });

  const totalExams = submissions.length;
  const passedExams = submissions.filter((s) => s.passed).length;
  const cohortPassRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0;

  return NextResponse.json(
    {
      summary: {
        totalStudents: students.length,
        totalExamsAttempted: totalExams,
        cohortPassRate,
        totalAssignmentsSubmitted: assignments.length,
      },
      reports: studentReports,
    },
    { headers: noCacheHeaders }
  );
}
