import { Router, type IRouter } from "express";
import { eq, count, sum, sql } from "drizzle-orm";
import { db, usersTable, complexesTable, materialsTable, eventsTable, recyclingRecordsTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetDashboardMonthlyStatsQueryParams,
  GetDashboardMonthlyStatsResponse,
  GetDashboardRecentActivityQueryParams,
  GetDashboardRecentActivityResponse,
  GetDashboardMaterialBreakdownResponse,
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

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;

  const [residents, complexes, materials, events, records, kgResult] = await Promise.all([
    db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "resident")),
    db.select({ count: count() }).from(complexesTable),
    db.select({ count: count() }).from(materialsTable),
    db.select({ count: count() }).from(eventsTable),
    db.select({ count: count() }).from(recyclingRecordsTable),
    db.select({ totalKg: sum(recyclingRecordsTable.weightKg) }).from(recyclingRecordsTable),
  ]);

  res.json(GetDashboardStatsResponse.parse({
    totalResidents: residents[0].count,
    totalComplexes: complexes[0].count,
    totalMaterials: materials[0].count,
    totalEvents: events[0].count,
    totalRecords: records[0].count,
    totalKgRecycled: parseFloat(kgResult[0]?.totalKg ?? "0") || 0,
  }));
});

router.get("/dashboard/monthly-stats", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const parsed = GetDashboardMonthlyStatsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const year = parsed.data.year ?? new Date().getFullYear();

  const rows = await db.execute(sql`
    SELECT
      EXTRACT(MONTH FROM date::date)::integer AS month,
      EXTRACT(YEAR FROM date::date)::integer AS year,
      COALESCE(SUM(weight_kg), 0)::float AS total_kg,
      COUNT(*)::integer AS total_records
    FROM recycling_records
    WHERE EXTRACT(YEAR FROM date::date) = ${year}
    GROUP BY month, year
    ORDER BY month
  `);

  const result = (rows as unknown as any[]).map((r: any) => ({
    month: parseInt(r.month),
    year: parseInt(r.year),
    monthLabel: MONTH_LABELS[parseInt(r.month) - 1],
    totalKg: parseFloat(r.total_kg),
    totalRecords: parseInt(r.total_records),
  }));

  res.json(GetDashboardMonthlyStatsResponse.parse(result));
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const parsed = GetDashboardRecentActivityQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const limit = parsed.data.limit ?? 10;

  const records = await db
    .select()
    .from(recyclingRecordsTable)
    .orderBy(recyclingRecordsTable.createdAt)
    .limit(limit);

  const residentIds = [...new Set(records.map((r) => r.residentId))];
  const materialIds = [...new Set(records.map((r) => r.materialId))];

  const [residents, materials] = await Promise.all([
    residentIds.length > 0 ? db.select().from(usersTable) : Promise.resolve([]),
    materialIds.length > 0 ? db.select().from(materialsTable) : Promise.resolve([]),
  ]);

  const residentMap: Record<number, string> = {};
  for (const u of residents) residentMap[u.id] = u.fullName;
  const materialMap: Record<number, string> = {};
  for (const m of materials) materialMap[m.id] = m.name;

  const activities = records.map((r) => ({
    id: r.id,
    type: "recycling_record",
    description: `Reciclaje registrado: ${materialMap[r.materialId] ?? "Material"} - ${r.weightKg} kg`,
    residentName: residentMap[r.residentId] ?? null,
    materialName: materialMap[r.materialId] ?? null,
    weightKg: parseFloat(r.weightKg),
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  }));

  res.json(GetDashboardRecentActivityResponse.parse(activities));
});

router.get("/dashboard/material-breakdown", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;

  const rows = await db.execute(sql`
    SELECT
      rr.material_id,
      m.name AS material_name,
      m.bin_color,
      COALESCE(SUM(rr.weight_kg), 0)::float AS total_kg,
      COUNT(rr.id)::integer AS total_records
    FROM recycling_records rr
    JOIN materials m ON m.id = rr.material_id
    GROUP BY rr.material_id, m.name, m.bin_color
    ORDER BY total_kg DESC
  `);

  const result = (rows as unknown as any[]).map((r: any) => ({
    materialId: parseInt(r.material_id),
    materialName: r.material_name,
    binColor: r.bin_color,
    totalKg: parseFloat(r.total_kg),
    totalRecords: parseInt(r.total_records),
  }));

  res.json(GetDashboardMaterialBreakdownResponse.parse(result));
});

export default router;
