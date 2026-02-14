import { NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';

// ============================================
// Rate Limiting (in-memory, per-IP)
// ============================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute per IP for AI endpoints

export function checkRateLimit(ip: string, maxRequests = RATE_LIMIT_MAX_REQUESTS): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  return { allowed: entry.count <= maxRequests, remaining };
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  });
}, 300_000);

export function getRateLimitResponse() {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': '60' } }
  );
}

// ============================================
// Zod Validation Helper
// ============================================
export async function validateBody<T>(req: Request, schema: ZodSchema<T>): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return {
        error: NextResponse.json(
          { error: 'Validation error', details: result.error.flatten().fieldErrors },
          { status: 400 }
        ),
      };
    }
    return { data: result.data };
  } catch {
    return {
      error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }
}

// ============================================
// Safe Error Response (no stack traces)
// ============================================
export function safeErrorResponse(error: unknown, context: string) {
  console.error(`[${context}]`, error instanceof Error ? error.message : error);
  return NextResponse.json(
    { error: `${context} failed. Please try again.` },
    { status: 500 }
  );
}

// ============================================
// Get client IP from request
// ============================================
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}
