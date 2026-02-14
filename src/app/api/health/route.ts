import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { status: string; ms?: number; error?: string }> = {};
  const start = Date.now();

  // DB connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', ms: Date.now() - dbStart };
  } catch (err) {
    checks.database = { status: 'error', error: err instanceof Error ? err.message : 'Unknown' };
    logger.error({ err }, 'Health check: database failed');
  }

  // Check org count (basic data integrity)
  try {
    const orgCount = await prisma.organization.count();
    checks.data = { status: orgCount > 0 ? 'ok' : 'warn', ms: Date.now() - start };
  } catch (err) {
    checks.data = { status: 'error', error: err instanceof Error ? err.message : 'Unknown' };
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok');
  const totalMs = Date.now() - start;

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseMs: totalMs,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
