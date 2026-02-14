import { prisma } from '../db';

export async function createAuditLog(params: {
  orgId: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  changes?: any;
}) {
  return prisma.auditLog.create({
    data: {
      orgId: params.orgId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      changes: params.changes || undefined,
    },
  });
}
