import { Router, type IRouter } from "express";
import { and, count, desc, gte, ilike, lte, SQL, eq } from "drizzle-orm";
import { db, auditLogsTable } from "@workspace/db";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

async function requireAdmin(req: any, res: any): Promise<any | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const user = await getUserFromToken(authHeader.slice(7));
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return null; }
  if (user.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return null; }
  return user;
}

router.get("/audit-logs", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const {
    search,
    action,
    resource,
    dateFrom,
    dateTo,
    page = "1",
    pageSize = "20",
  } = req.query as Record<string, string>;

  const p = parseInt(page) || 1;
  const ps = Math.min(parseInt(pageSize) || 20, 100);
  const offset = (p - 1) * ps;

  const conditions: SQL[] = [];
  if (search) conditions.push(ilike(auditLogsTable.userFullName, `%${search}%`));
  if (action) conditions.push(eq(auditLogsTable.action, action));
  if (resource) conditions.push(eq(auditLogsTable.resource, resource));
  if (dateFrom) conditions.push(gte(auditLogsTable.createdAt, new Date(dateFrom)));
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(auditLogsTable.createdAt, end));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, totalResult] = await Promise.all([
    db.select().from(auditLogsTable).where(where).orderBy(desc(auditLogsTable.createdAt)).limit(ps).offset(offset),
    db.select({ count: count() }).from(auditLogsTable).where(where),
  ]);

  res.json({
    data: logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      userFullName: l.userFullName,
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId,
      details: l.details,
      createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
    })),
    total: totalResult[0].count,
    page: p,
    pageSize: ps,
  });
});

export default router;
