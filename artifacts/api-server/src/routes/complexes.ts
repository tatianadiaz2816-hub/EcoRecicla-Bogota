import { Router, type IRouter } from "express";
import { eq, ilike, and, SQL, count } from "drizzle-orm";
import { db, complexesTable } from "@workspace/db";
import {
  ListComplexesQueryParams,
  CreateComplexBody,
  GetComplexParams,
  UpdateComplexParams,
  UpdateComplexBody,
  DeleteComplexParams,
  ListComplexesResponse,
  GetComplexResponse,
  CreateComplexResponse,
  UpdateComplexResponse,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

async function requireAuth(req: any, res: any): Promise<any | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const user = await getUserFromToken(authHeader.slice(7));
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return user;
}

function buildComplexResponse(c: any) {
  return {
    id: c.id,
    name: c.name,
    address: c.address,
    neighborhood: c.neighborhood,
    administrator: c.administrator,
    phone: c.phone,
    email: c.email,
    status: c.status,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  };
}

router.get("/complexes", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const parsed = ListComplexesQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { search, status, page = 1, pageSize = 20 } = parsed.data;

  const conditions: SQL[] = [];
  if (search) conditions.push(ilike(complexesTable.name, `%${search}%`));
  if (status) conditions.push(eq(complexesTable.status, status));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [complexes, totalResult] = await Promise.all([
    db.select().from(complexesTable).where(whereClause).limit(pageSize).offset(offset),
    db.select({ count: count() }).from(complexesTable).where(whereClause),
  ]);

  res.json(ListComplexesResponse.parse({ data: complexes.map(buildComplexResponse), total: totalResult[0].count, page, pageSize }));
});

router.post("/complexes", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const parsed = CreateComplexBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [complex] = await db.insert(complexesTable).values(parsed.data).returning();
  res.status(201).json(CreateComplexResponse.parse(buildComplexResponse(complex)));
});

router.get("/complexes/:id", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const params = GetComplexParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [complex] = await db.select().from(complexesTable).where(eq(complexesTable.id, params.data.id));
  if (!complex) { res.status(404).json({ error: "Complex not found" }); return; }
  res.json(GetComplexResponse.parse(buildComplexResponse(complex)));
});

router.patch("/complexes/:id", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const params = UpdateComplexParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const body = UpdateComplexBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [complex] = await db.update(complexesTable).set(body.data).where(eq(complexesTable.id, params.data.id)).returning();
  if (!complex) { res.status(404).json({ error: "Complex not found" }); return; }
  res.json(UpdateComplexResponse.parse(buildComplexResponse(complex)));
});

router.delete("/complexes/:id", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const params = DeleteComplexParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [c] = await db.delete(complexesTable).where(eq(complexesTable.id, params.data.id)).returning();
  if (!c) { res.status(404).json({ error: "Complex not found" }); return; }
  res.sendStatus(204);
});

export default router;
