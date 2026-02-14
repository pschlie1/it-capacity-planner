import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize a string to prevent XSS. Strips all HTML tags.
 */
export function sanitize(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

/**
 * Recursively sanitize all string values in an object.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitize(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === 'string' ? sanitize(item) :
        (item && typeof item === 'object') ? sanitizeObject(item as Record<string, unknown>) : item
      );
    } else if (value && typeof value === 'object') {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
