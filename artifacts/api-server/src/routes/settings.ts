import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
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

// Default settings
const DEFAULTS: Record<string, string> = {
  orgName: "EcoRecicla Bogotá",
  orgAddress: "Calle 26 # 69-76, Bogotá, Colombia",
  orgPhone: "+57 601 000 0000",
  orgEmail: "contacto@ecorecicla.gov.co",
  logoUrl: "",
};

router.get("/settings", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  const user = await getUserFromToken(authHeader.slice(7));
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rows = await db.select().from(settingsTable);
  const result: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) result[row.key] = row.value;
  res.json(result);
});

router.patch("/settings", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const updates = req.body as Record<string, string>;
  const allowed = Object.keys(DEFAULTS);

  for (const [key, value] of Object.entries(updates)) {
    if (!allowed.includes(key)) continue;
    const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
    if (existing.length > 0) {
      await db.update(settingsTable).set({ value: String(value) }).where(eq(settingsTable.key, key));
    } else {
      await db.insert(settingsTable).values({ key, value: String(value) });
    }
  }

  const rows = await db.select().from(settingsTable);
  const result: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) result[row.key] = row.value;
  res.json(result);
});

export default router;
