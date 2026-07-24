import { Router, type IRouter } from "express";
import { eq, and, SQL, sum, count, gte, lte } from "drizzle-orm";
import { db, recyclingRecordsTable, usersTable, complexesTable, materialsTable } from "@workspace/db";
import {
  GetReportSummaryQueryParams,
  GetReportSummaryResponse,
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

router.get("/reports/summary", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const parsed = GetReportSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { dateFrom, dateTo, materialId, residentId, complexId } = parsed.data;

  const conditions: SQL[] = [];
  if (dateFrom) conditions.push(gte(recyclingRecordsTable.date, dateFrom));
  if (dateTo) conditions.push(lte(recyclingRecordsTable.date, dateTo));
  if (materialId) conditions.push(eq(recyclingRecordsTable.materialId, materialId));
  if (residentId) conditions.push(eq(recyclingRecordsTable.residentId, residentId));
  if (complexId) conditions.push(eq(recyclingRecordsTable.complexId, complexId));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [records, kgResult, totalResult] = await Promise.all([
    db.select().from(recyclingRecordsTable).where(whereClause).orderBy(recyclingRecordsTable.date),
    db.select({ totalKg: sum(recyclingRecordsTable.weightKg) }).from(recyclingRecordsTable).where(whereClause),
    db.select({ count: count() }).from(recyclingRecordsTable).where(whereClause),
  ]);

  // Load all lookup data
  const [allUsers, allComplexes, allMaterials] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(complexesTable),
    db.select().from(materialsTable),
  ]);

  const userMap: Record<number, string> = {};
  for (const u of allUsers) userMap[u.id] = u.fullName;
  const complexMap: Record<number, string> = {};
  for (const c of allComplexes) complexMap[c.id] = c.name;
  const materialMap: Record<number, string> = {};
  const materialColorMap: Record<number, string> = {};
  for (const m of allMaterials) { materialMap[m.id] = m.name; materialColorMap[m.id] = m.binColor; }

  // Aggregate by material
  const byMaterialMap: Record<number, { totalKg: number; totalRecords: number }> = {};
  const byComplexMap: Record<number, { totalKg: number; totalRecords: number }> = {};
  const byResidentMap: Record<number, { totalKg: number; totalRecords: number }> = {};

  for (const r of records) {
    const kg = parseFloat(r.weightKg);
    if (!byMaterialMap[r.materialId]) byMaterialMap[r.materialId] = { totalKg: 0, totalRecords: 0 };
    byMaterialMap[r.materialId].totalKg += kg;
    byMaterialMap[r.materialId].totalRecords += 1;

    if (!byComplexMap[r.complexId]) byComplexMap[r.complexId] = { totalKg: 0, totalRecords: 0 };
    byComplexMap[r.complexId].totalKg += kg;
    byComplexMap[r.complexId].totalRecords += 1;

    if (!byResidentMap[r.residentId]) byResidentMap[r.residentId] = { totalKg: 0, totalRecords: 0 };
    byResidentMap[r.residentId].totalKg += kg;
    byResidentMap[r.residentId].totalRecords += 1;
  }

  const byMaterial = Object.entries(byMaterialMap).map(([id, v]) => ({
    materialId: parseInt(id),
    materialName: materialMap[parseInt(id)] ?? "Unknown",
    binColor: materialColorMap[parseInt(id)] ?? "gray",
    totalKg: Math.round(v.totalKg * 1000) / 1000,
    totalRecords: v.totalRecords,
  }));

  const byComplex = Object.entries(byComplexMap).map(([id, v]) => ({
    complexId: parseInt(id),
    complexName: complexMap[parseInt(id)] ?? "Unknown",
    totalKg: Math.round(v.totalKg * 1000) / 1000,
    totalRecords: v.totalRecords,
  }));

  const byResident = Object.entries(byResidentMap).map(([id, v]) => ({
    residentId: parseInt(id),
    residentName: userMap[parseInt(id)] ?? "Unknown",
    totalKg: Math.round(v.totalKg * 1000) / 1000,
    totalRecords: v.totalRecords,
  }));

  const enrichedRecords = records.map((r) => ({
    id: r.id,
    residentId: r.residentId,
    residentName: userMap[r.residentId] ?? null,
    complexId: r.complexId,
    complexName: complexMap[r.complexId] ?? null,
    materialId: r.materialId,
    materialName: materialMap[r.materialId] ?? null,
    weightKg: parseFloat(r.weightKg),
    date: r.date,
    observation: r.observation,
    responsibleUserId: r.responsibleUserId,
    responsibleUserName: r.responsibleUserId ? userMap[r.responsibleUserId] ?? null : null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  }));

  res.json(GetReportSummaryResponse.parse({
    totalKg: parseFloat(kgResult[0]?.totalKg ?? "0") || 0,
    totalRecords: totalResult[0].count,
    byMaterial,
    byComplex,
    byResident,
    records: enrichedRecords,
  }));
});

export default router;
