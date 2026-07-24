import { Router, type IRouter } from "express";
import { eq, count, sum, sql, and } from "drizzle-orm";
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

  // Use query builder with sql`` expressions to avoid raw execute() result shape issues
  const rows = await db
    .select({
      month: sql<number>`EXTRACT(MONTH FROM ${recyclingRecordsTable.date}::date)::integer`,
      year:  sql<number>`EXTRACT(YEAR  FROM ${recyclingRecordsTable.date}::date)::integer`,
      totalKg: sql<number>`COALESCE(SUM(${recyclingRecordsTable.weightKg}), 0)::float`,
      totalRecords: sql<number>`COUNT(*)::integer`,
    })
    .from(recyclingRecordsTable)
    .where(sql`EXTRACT(YEAR FROM ${recyclingRecordsTable.date}::date) = ${year}`)
    .groupBy(
      sql`EXTRACT(MONTH FROM ${recyclingRecordsTable.date}::date)`,
      sql`EXTRACT(YEAR  FROM ${recyclingRecordsTable.date}::date)`,
    )
    .orderBy(sql`EXTRACT(MONTH FROM ${recyclingRecordsTable.date}::date)`);

  const result = rows.map((r) => ({
    month: Number(r.month),
    year:  Number(r.year),
    monthLabel: MONTH_LABELS[Number(r.month) - 1],
    totalKg: Number(r.totalKg),
    totalRecords: Number(r.totalRecords),
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

  const rows = await db
    .select({
      materialId:   materialsTable.id,
      materialName: materialsTable.name,
      binColor:     materialsTable.binColor,
      totalKg:      sql<number>`COALESCE(SUM(${recyclingRecordsTable.weightKg}), 0)::float`,
      totalRecords: sql<number>`COUNT(${recyclingRecordsTable.id})::integer`,
    })
    .from(recyclingRecordsTable)
    .innerJoin(materialsTable, eq(materialsTable.id, recyclingRecordsTable.materialId))
    .groupBy(recyclingRecordsTable.materialId, materialsTable.id, materialsTable.name, materialsTable.binColor)
    .orderBy(sql`SUM(${recyclingRecordsTable.weightKg}) DESC`);

  const result = rows.map((r) => ({
    materialId:   r.materialId,
    materialName: r.materialName,
    binColor:     r.binColor,
    totalKg:      Number(r.totalKg),
    totalRecords: Number(r.totalRecords),
  }));

  res.json(GetDashboardMaterialBreakdownResponse.parse(result));
});

router.get("/dashboard/weekly-stats", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;

  const now = new Date();
  // ISO week: Monday = start
  const dow = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon … 6=Sun
  const thisMonStart = new Date(now); thisMonStart.setDate(now.getDate() - dow); thisMonStart.setHours(0, 0, 0, 0);
  const thisSunEnd  = new Date(thisMonStart); thisSunEnd.setDate(thisMonStart.getDate() + 7);
  const lastMonStart = new Date(thisMonStart); lastMonStart.setDate(thisMonStart.getDate() - 7);
  const lastSunEnd   = new Date(thisMonStart); // same as thisMonStart

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [thisWeekRows, lastWeekRows, monthResidents, totalResidents, weeklyBreakdown] = await Promise.all([
    // This week kg + records
    db.select({
      totalKg:      sql<number>`COALESCE(SUM(${recyclingRecordsTable.weightKg}), 0)::float`,
      totalRecords: sql<number>`COUNT(*)::integer`,
    }).from(recyclingRecordsTable)
      .where(sql`${recyclingRecordsTable.date}::date >= ${thisMonStart.toISOString()}::date AND ${recyclingRecordsTable.date}::date < ${thisSunEnd.toISOString()}::date`),

    // Last week kg + records
    db.select({
      totalKg:      sql<number>`COALESCE(SUM(${recyclingRecordsTable.weightKg}), 0)::float`,
      totalRecords: sql<number>`COUNT(*)::integer`,
    }).from(recyclingRecordsTable)
      .where(sql`${recyclingRecordsTable.date}::date >= ${lastMonStart.toISOString()}::date AND ${recyclingRecordsTable.date}::date < ${lastSunEnd.toISOString()}::date`),

    // Distinct residents who recycled this month
    db.select({ cnt: sql<number>`COUNT(DISTINCT ${recyclingRecordsTable.residentId})::integer` })
      .from(recyclingRecordsTable)
      .where(sql`${recyclingRecordsTable.date}::date >= ${monthStart.toISOString()}::date AND ${recyclingRecordsTable.date}::date < ${monthEnd.toISOString()}::date`),

    // Total active residents
    db.select({ cnt: count() }).from(usersTable).where(eq(usersTable.role, "resident")),

    // Weekly kg breakdown for current month (ISO week number)
    db.select({
      week:         sql<number>`EXTRACT(WEEK FROM ${recyclingRecordsTable.date}::date)::integer`,
      totalKg:      sql<number>`COALESCE(SUM(${recyclingRecordsTable.weightKg}), 0)::float`,
      totalRecords: sql<number>`COUNT(*)::integer`,
    }).from(recyclingRecordsTable)
      .where(sql`${recyclingRecordsTable.date}::date >= ${monthStart.toISOString()}::date AND ${recyclingRecordsTable.date}::date < ${monthEnd.toISOString()}::date`)
      .groupBy(sql`EXTRACT(WEEK FROM ${recyclingRecordsTable.date}::date)`)
      .orderBy(sql`EXTRACT(WEEK FROM ${recyclingRecordsTable.date}::date)`),
  ]);

  const thisKg   = Number(thisWeekRows[0]?.totalKg ?? 0);
  const lastKg   = Number(lastWeekRows[0]?.totalKg ?? 0);
  const weekTrend = lastKg === 0 ? null : Math.round(((thisKg - lastKg) / lastKg) * 100);

  const activeResidents  = Number(monthResidents[0]?.cnt ?? 0);
  const totalRes         = Number(totalResidents[0]?.cnt ?? 0);
  const participationRate = totalRes > 0 ? Math.round((activeResidents / totalRes) * 100) : 0;

  // Label weeks as "Sem 1", "Sem 2", etc relative to position in month
  const sorted = [...weeklyBreakdown].sort((a, b) => Number(a.week) - Number(b.week));
  const weeklyData = sorted.map((row, idx) => ({
    label: `Sem ${idx + 1}`,
    totalKg: Number(row.totalKg),
    totalRecords: Number(row.totalRecords),
  }));

  res.json({
    thisWeekKg:       thisKg,
    thisWeekRecords:  Number(thisWeekRows[0]?.totalRecords ?? 0),
    lastWeekKg:       lastKg,
    lastWeekRecords:  Number(lastWeekRows[0]?.totalRecords ?? 0),
    weekTrendPct:     weekTrend,
    activeResidentsThisMonth: activeResidents,
    totalResidents:   totalRes,
    participationRate,
    weeklyBreakdown:  weeklyData,
  });
});

export default router;
