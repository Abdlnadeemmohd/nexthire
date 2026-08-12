import { prisma } from "@/lib/prisma";

export async function logAuditEvent(
  actorId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        actorId,
        action,
        resourceType,
        resourceId,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  } catch (err) {
    console.warn("Audit event logging failed:", err);
  }
}
