import { issueCsrfToken } from '@/lib/csrf';

export async function GET() {
  return issueCsrfToken();
}
