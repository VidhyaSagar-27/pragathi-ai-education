import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasAdminPassword = Boolean(process.env.ADMIN_INITIAL_PASSWORD);
  const isVercel = Boolean(process.env.VERCEL);

  let dbStatus = 'untested';
  let dbError: string | null = null;
  let rowCount = 0;

  if (hasDbUrl) {
    try {
      const sql = neon(process.env.DATABASE_URL!);
      const rows = await sql`SELECT id FROM app_database WHERE id = 1`;
      rowCount = rows.length;
      dbStatus = 'connected';
    } catch (err: any) {
      dbStatus = 'failed';
      dbError = err?.message || String(err);
    }
  }

  return NextResponse.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    environment: {
      isVercel,
      hasDatabaseUrl: hasDbUrl,
      hasAdminInitialPassword: hasAdminPassword,
      databaseUrlPrefix: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.substring(0, 15) + '...'
        : 'MISSING',
    },
    database: {
      status: dbStatus,
      row1Exists: rowCount > 0,
      error: dbError,
    },
  });
}
