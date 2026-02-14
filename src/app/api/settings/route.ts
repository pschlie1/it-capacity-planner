import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as settingsService from '@/lib/services/settings';
import { guardMutation } from '@/lib/mutation-guard';

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const settings = await settingsService.getSettings(auth.orgId);
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const auth = await requireAuth('ADMIN');
  if (isAuthError(auth)) return auth;
  const { data, error } = await guardMutation(req);
  if (error) return error;
  const settings = await settingsService.updateSettings(auth.orgId, auth.user.id, data!);
  return NextResponse.json(settings);
}
