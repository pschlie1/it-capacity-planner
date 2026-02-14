/**
 * Client-side CSRF helper.
 * Fetches a CSRF token from /api/csrf and caches it.
 * Provides a `csrfFetch` wrapper that includes the token on mutation requests.
 */

let cachedToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const res = await fetch('/api/csrf');
  const data = await res.json();
  cachedToken = data.csrfToken;
  return cachedToken!;
}

/**
 * Fetch wrapper that automatically includes CSRF token on mutation methods.
 */
export async function csrfFetch(url: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (!isMutation) {
    return fetch(url, init);
  }

  const token = await getCsrfToken();
  const headers = new Headers(init?.headers);
  headers.set('x-csrf-token', token);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...init, headers });

  // If CSRF token was rejected (403), refresh and retry once
  if (res.status === 403) {
    cachedToken = null;
    const newToken = await getCsrfToken();
    headers.set('x-csrf-token', newToken);
    return fetch(url, { ...init, headers });
  }

  return res;
}

/** Invalidate the cached token (e.g., on logout) */
export function clearCsrfToken(): void {
  cachedToken = null;
}
