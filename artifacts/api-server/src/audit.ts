import { db, auditLogsTable } from "@workspace/db";

export async function logAudit(opts: {
  userId?: number | null;
  userFullName: string;
  action: "login" | "create" | "update" | "delete";
  resource: string;
  resourceId?: number | null;
  details?: string | null;
}) {
  try {
    await db.insert(auditLogsTable).values({
      userId: opts.userId ?? null,
      userFullName: opts.userFullName,
      action: opts.action,
      resource: opts.resource,
      resourceId: opts.resourceId ?? null,
      details: opts.details ?? null,
    });
  } catch {
    // Non-blocking — never let audit failure crash the request
  }
}
