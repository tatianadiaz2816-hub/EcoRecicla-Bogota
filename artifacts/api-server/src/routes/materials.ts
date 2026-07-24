import { Router, type IRouter } from "express";
import { eq, ilike, and, SQL, count } from "drizzle-orm";
import { db, materialsTable } from "@workspace/db";
import {
  ListMaterialsQueryParams,
  CreateMaterialBody,
  GetMaterialParams,
  UpdateMaterialParams,
  UpdateMaterialBody,
  DeleteMaterialParams,
  ListMaterialsResponse,
  GetMaterialResponse,
  CreateMaterialResponse,
  UpdateMaterialResponse,
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

function buildMaterialResponse(m: any) {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    recyclingInstructions: m.recyclingInstructions,
    binColor: m.binColor,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
  };
}

router.get("/materials", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const parsed = ListMaterialsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { search, page = 1, pageSize = 20 } = parsed.data;

  const conditions: SQL[] = [];
  if (search) conditions.push(ilike(materialsTable.name, `%${search}%`));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [materials, totalResult] = await Promise.all([
    db.select().from(materialsTable).where(whereClause).limit(pageSize).offset(offset),
    db.select({ count: count() }).from(materialsTable).where(whereClause),
  ]);

  res.json(ListMaterialsResponse.parse({ data: materials.map(buildMaterialResponse), total: totalResult[0].count, page, pageSize }));
});

router.post("/materials", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const parsed = CreateMaterialBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [material] = await db.insert(materialsTable).values(parsed.data).returning();
  res.status(201).json(CreateMaterialResponse.parse(buildMaterialResponse(material)));
});

router.get("/materials/:id", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const params = GetMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, params.data.id));
  if (!material) { res.status(404).json({ error: "Material not found" }); return; }
  res.json(GetMaterialResponse.parse(buildMaterialResponse(material)));
});

router.patch("/materials/:id", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const params = UpdateMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const body = UpdateMaterialBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [material] = await db.update(materialsTable).set(body.data).where(eq(materialsTable.id, params.data.id)).returning();
  if (!material) { res.status(404).json({ error: "Material not found" }); return; }
  res.json(UpdateMaterialResponse.parse(buildMaterialResponse(material)));
});

router.delete("/materials/:id", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const params = DeleteMaterialParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [m] = await db.delete(materialsTable).where(eq(materialsTable.id, params.data.id)).returning();
  if (!m) { res.status(404).json({ error: "Material not found" }); return; }
  res.sendStatus(204);
});

export default router;
