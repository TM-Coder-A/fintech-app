import { prisma } from "@/lib/prisma";

type AuditMetadata = Record<
  string,
  string | number | boolean | null
>;

type AuditInput = {
  request: Request;
  action: string;
  success?: boolean;
  userId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: AuditMetadata;
};

export async function writeAuditLog({
  request,
  action,
  success = true,
  userId = null,
  entityType,
  entityId,
  metadata,
}: AuditInput) {
  try {
    const forwardedFor =
      request.headers.get(
        "x-forwarded-for"
      );

    const ipAddress =
      forwardedFor
        ?.split(",")[0]
        ?.trim() ||
      request.headers.get(
        "x-real-ip"
      ) ||
      null;

    const userAgent =
      request.headers.get(
        "user-agent"
      );

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        success,
        entityType,
        entityId,
        ipAddress,
        userAgent,
        metadata:
          metadata ?? undefined,
      },
    });
  } catch (error) {
    /*
     * Audit logging should not turn a
     * successful user operation into a
     * failed operation during development.
     */
    console.error(
      "Audit logging error:",
      error
    );
  }
}
