import { Router, type IRouter } from "express";
import { eq, and, SQL, count, sum, gte, lte } from "drizzle-orm";
import { db, recyclingRecordsTable, usersTable, complexesTable, materialsTable } from "@workspace/db";
import {
  ListRecordsQueryParams,
  CreateRecordBody,
  GetRecordParams,
  UpdateRecordParams,
  UpdateRecordBody,
  DeleteRecordParams,
  ListRecordsResponse,
  GetRecordResponse,
  CreateRecordResponse,
  UpdateRecordResponse,
  GetTotalKgQueryParams,
  GetTotalKgResponse,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

async function requireAuth(req: any, res: any): Promise<any | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const user = await getUserFromToken(authHeader.slice(7));
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return user;
}

async function enrichRecord(r: any) {
  const [resident] = await db.select().from(usersTable).where(eq(usersTable.id, r.residentId));
  const [complex] = await db.select().from(complexesTable).where(eq(complexesTable.id, r.complexId));
  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, r.materialId));
  let responsibleUserName: string | null = null;
  if (r.responsibleUserId) {
    const [ru] = await db.select().from(usersTable).where(eq(usersTable.id, r.responsibleUserId));
    responsibleUserName = ru?.fullName ?? null;
  }
  return {
    id: r.id,
    residentId: r.residentId,
    residentName: resident?.fullName ?? null,
    complexId: r.complexId,
    complexName: complex?.name ?? null,
    materialId: r.materialId,
    materialName: material?.name ?? null,
    weightKg: parseFloat(r.weightKg),
    date: r.date,
    observation: r.observation,
    responsibleUserId: r.responsibleUserId,
    responsibleUserName,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  };
}

router.get("/records/total-kg", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const parsed = GetTotalKgQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { complexId, materialId, residentId } = parsed.data;

  const conditions: SQL[] = [];
  if (complexId) conditions.push(eq(recyclingRecordsTable.complexId, complexId));
  if (materialId) conditions.push(eq(recyclingRecordsTable.materialId, materialId));
  if (residentId) conditions.push(eq(recyclingRecordsTable.residentId, residentId));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [result] = await db.select({ totalKg: sum(recyclingRecordsTable.weightKg) }).from(recyclingRecordsTable).where(whereClause);
  res.json(GetTotalKgResponse.parse({ totalKg: parseFloat(result?.totalKg ?? "0") || 0 }));
});

router.get("/records", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const parsed = ListRecordsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { residentId, complexId, materialId, dateFrom, dateTo, page = 1, pageSize = 20 } = parsed.data;

  const conditions: SQL[] = [];
  if (residentId) conditions.push(eq(recyclingRecordsTable.residentId, residentId));
  if (complexId) conditions.push(eq(recyclingRecordsTable.complexId, complexId));
  if (materialId) conditions.push(eq(recyclingRecordsTable.materialId, materialId));
  if (dateFrom) conditions.push(gte(recyclingRecordsTable.date, dateFrom));
  if (dateTo) conditions.push(lte(recyclingRecordsTable.date, dateTo));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [records, totalResult, kgResult] = await Promise.all([
    db.select().from(recyclingRecordsTable).where(whereClause).limit(pageSize).offset(offset).orderBy(recyclingRecordsTable.createdAt),
    db.select({ count: count() }).from(recyclingRecordsTable).where(whereClause),
    db.select({ totalKg: sum(recyclingRecordsTable.weightKg) }).from(recyclingRecordsTable).where(whereClause),
  ]);

  // Batch load related data
  const residentIds = [...new Set(records.map((r) => r.residentId))];
  const complexIds = [...new Set(records.map((r) => r.complexId))];
  const materialIds = [...new Set(records.map((r) => r.materialId))];
  const responsibleIds = [...new Set(records.map((r) => r.responsibleUserId).filter(Boolean))] as number[];

  const [residents, complexes, materials, responsibleUsers] = await Promise.all([
    residentIds.length > 0 ? db.select().from(usersTable) : Promise.resolve([]),
    complexIds.length > 0 ? db.select().from(complexesTable) : Promise.resolve([]),
    materialIds.length > 0 ? db.select().from(materialsTable) : Promise.resolve([]),
    responsibleIds.length > 0 ? db.select().from(usersTable) : Promise.resolve([]),
  ]);

  const residentMap: Record<number, string> = {};
  for (const u of residents) residentMap[u.id] = u.fullName;
  const complexMap: Record<number, string> = {};
  for (const c of complexes) complexMap[c.id] = c.name;
  const materialMap: Record<number, string> = {};
  for (const m of materials) materialMap[m.id] = m.name;
  const responsibleMap: Record<number, string> = {};
  for (const u of responsibleUsers) responsibleMap[u.id] = u.fullName;

  const data = records.map((r) => ({
    id: r.id,
    residentId: r.residentId,
    residentName: residentMap[r.residentId] ?? null,
    complexId: r.complexId,
    complexName: complexMap[r.complexId] ?? null,
    materialId: r.materialId,
    materialName: materialMap[r.materialId] ?? null,
    weightKg: parseFloat(r.weightKg),
    date: r.date,
    observation: r.observation,
    responsibleUserId: r.responsibleUserId,
    responsibleUserName: r.responsibleUserId ? responsibleMap[r.responsibleUserId] ?? null : null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  }));

  res.json(ListRecordsResponse.parse({
    data,
    total: totalResult[0].count,
    page,
    pageSize,
    totalKg: parseFloat(kgResult[0]?.totalKg ?? "0") || 0,
  }));
});

router.post("/records", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const parsed = CreateRecordBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [record] = await db.insert(recyclingRecordsTable).values({ ...parsed.data, weightKg: String(parsed.data.weightKg) }).returning();
  res.status(201).json(CreateRecordResponse.parse(await enrichRecord(record)));
});

router.get("/records/:id", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const params = GetRecordParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [record] = await db.select().from(recyclingRecordsTable).where(eq(recyclingRecordsTable.id, params.data.id));
  if (!record) { res.status(404).json({ error: "Record not found" }); return; }
  res.json(GetRecordResponse.parse(await enrichRecord(record)));
});

router.patch("/records/:id", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const params = UpdateRecordParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const body = UpdateRecordBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const updateData: any = { ...body.data };
  if (updateData.weightKg !== undefined) updateData.weightKg = String(updateData.weightKg);
  const [record] = await db.update(recyclingRecordsTable).set(updateData).where(eq(recyclingRecordsTable.id, params.data.id)).returning();
  if (!record) { res.status(404).json({ error: "Record not found" }); return; }
  res.json(UpdateRecordResponse.parse(await enrichRecord(record)));
});

router.delete("/records/:id", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const params = DeleteRecordParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [r] = await db.delete(recyclingRecordsTable).where(eq(recyclingRecordsTable.id, params.data.id)).returning();
  if (!r) { res.status(404).json({ error: "Record not found" }); return; }
  res.sendStatus(204);
});

export default router;
