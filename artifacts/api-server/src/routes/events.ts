import { Router, type IRouter } from "express";
import { eq, ilike, and, SQL, count } from "drizzle-orm";
import { db, eventsTable, complexesTable } from "@workspace/db";
import {
  ListEventsQueryParams,
  CreateEventBody,
  GetEventParams,
  UpdateEventParams,
  UpdateEventBody,
  DeleteEventParams,
  ListEventsResponse,
  GetEventResponse,
  CreateEventResponse,
  UpdateEventResponse,
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

async function buildEventResponse(e: any) {
  let complexName: string | null = null;
  if (e.complexId) {
    const [c] = await db.select().from(complexesTable).where(eq(complexesTable.id, e.complexId));
    complexName = c?.name ?? null;
  }
  return {
    id: e.id,
    eventName: e.eventName,
    complexId: e.complexId,
    complexName,
    date: e.date,
    hour: e.hour,
    responsiblePerson: e.responsiblePerson,
    location: e.location,
    description: e.description,
    status: e.status,
    createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
  };
}

router.get("/events", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const parsed = ListEventsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { search, status, complexId, page = 1, pageSize = 20 } = parsed.data;

  const conditions: SQL[] = [];
  if (search) conditions.push(ilike(eventsTable.eventName, `%${search}%`));
  if (status) conditions.push(eq(eventsTable.status, status));
  if (complexId) conditions.push(eq(eventsTable.complexId, complexId));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [events, totalResult] = await Promise.all([
    db.select().from(eventsTable).where(whereClause).limit(pageSize).offset(offset),
    db.select({ count: count() }).from(eventsTable).where(whereClause),
  ]);

  const complexes = await db.select().from(complexesTable);
  const complexMap: Record<number, string> = {};
  for (const c of complexes) complexMap[c.id] = c.name;

  const data = events.map((e) => ({
    id: e.id,
    eventName: e.eventName,
    complexId: e.complexId,
    complexName: complexMap[e.complexId] ?? null,
    date: e.date,
    hour: e.hour,
    responsiblePerson: e.responsiblePerson,
    location: e.location,
    description: e.description,
    status: e.status,
    createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
  }));

  res.json(ListEventsResponse.parse({ data, total: totalResult[0].count, page, pageSize }));
});

router.post("/events", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [event] = await db.insert(eventsTable).values(parsed.data).returning();
  res.status(201).json(CreateEventResponse.parse(await buildEventResponse(event)));
});

router.get("/events/:id", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const params = GetEventParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.id));
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }
  res.json(GetEventResponse.parse(await buildEventResponse(event)));
});

router.patch("/events/:id", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const params = UpdateEventParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const body = UpdateEventBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [event] = await db.update(eventsTable).set(body.data).where(eq(eventsTable.id, params.data.id)).returning();
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }
  res.json(UpdateEventResponse.parse(await buildEventResponse(event)));
});

router.delete("/events/:id", async (req, res): Promise<void> => {
  if (!await requireAuth(req, res)) return;
  const params = DeleteEventParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [e] = await db.delete(eventsTable).where(eq(eventsTable.id, params.data.id)).returning();
  if (!e) { res.status(404).json({ error: "Event not found" }); return; }
  res.sendStatus(204);
});

export default router;
