import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  orgId: string;
  orgName: string;
  orgSlug: string;
};

export type AuthResult = {
  user: SessionUser;
  orgId: string;
};

const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export async function requireAuth(minRole?: string): Promise<AuthResult | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (minRole) {
    const userLevel = ROLE_HIERARCHY[session.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    if (userLevel < requiredLevel) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return {
    user: session.user as SessionUser,
    orgId: session.user.orgId,
  };
}

export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

export function hasRole(userRole: string, minRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
}
