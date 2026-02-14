import { NextResponse } from 'next/server';
import { validateCsrf } from './csrf';
import { sanitizeObject } from './sanitize';

/**
 * Guard for mutation endpoints: validates CSRF and sanitizes body.
 * Returns { data } on success or { error } on failure.
 */
export async function guardMutation<T extends Record<string, unknown>>(
  req: Request
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  // Validate CSRF
  const csrfError = await validateCsrf(req);
  if (csrfError) return { error: csrfError };

  // Parse and sanitize body
  let body: T;
  try {
    body = await req.json();
  } catch {
    return { error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) };
  }

  const sanitized = sanitizeObject(body as Record<string, unknown>) as T;
  return { data: sanitized };
}
