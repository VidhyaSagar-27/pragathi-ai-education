import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getDatabaseUrl } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const resolvedUrl = getDatabaseUrl();
  const hasDbUrl = Boolean(resolvedUrl);
  const hasAdminPassword = Boolean(
    process.env.ADMIN_INITIAL_PASSWORD ||
    process.env.admin_initial_password ||
    process.env.ADMIN_PASSWORD
  );
  const isVercel = Boolean(process.env.VERCEL);

  // Collect variable key names only (never print values) to diagnose naming discrepancies
  const envKeyNames = Object.keys(process.env)
    .filter(
      (k) =>
        !k.startsWith('npm_') &&
        !k.startsWith('AWS_') &&
        !['PATH', 'HOSTNAME', 'USER', 'HOME', 'PWD', 'SHLVL', 'LANG', '_'].includes(k)
    )
    .sort();

  let dbStatus = 'untested';
  let dbError: string | null = null;
  let rowCount = 0;

  if (hasDbUrl) {
    try {
      const sql = neon(resolvedUrl!);
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
      databaseUrlPrefix: resolvedUrl
        ? resolvedUrl.substring(0, 15) + '...'
        : 'MISSING',
      detectedEnvironmentKeyNames: envKeyNames,
    },
    database: {
      status: dbStatus,
      row1Exists: rowCount > 0,
      error: dbError,
    },
  });
}
