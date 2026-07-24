import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq, ilike, and, or, SQL, count } from "drizzle-orm";
import { db, usersTable, complexesTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  CreateUserBody,
  GetUserParams,
  UpdateUserParams,
  UpdateUserBody,
  DeleteUserParams,
  ListUsersResponse,
  GetUserResponse,
  CreateUserResponse,
  UpdateUserResponse,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";
import { logAudit } from "../audit";

const router: IRouter = Router();

async function requireAuth(req: any, res: any): Promise<any | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const user = await getUserFromToken(authHeader.slice(7));
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}

function buildUserResponse(user: any, complexName: string | null) {
  return {
    id: user.id,
    fullName: user.fullName,
    documentNumber: user.documentNumber,
    phone: user.phone,
    email: user.email,
    apartment: user.apartment,
    complexId: user.complexId,
    complexName,
    role: user.role,
    status: user.status,
    photoUrl: user.photoUrl,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  };
}

router.get("/users", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const parsed = ListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, role, status, complexId, page = 1, pageSize = 20 } = parsed.data;

  const conditions: SQL[] = [];
  if (search) {
    conditions.push(
      or(
        ilike(usersTable.fullName, `%${search}%`),
        ilike(usersTable.email, `%${search}%`),
        ilike(usersTable.documentNumber, `%${search}%`),
      ) as SQL,
    );
  }
  if (role) conditions.push(eq(usersTable.role, role));
  if (status) conditions.push(eq(usersTable.status, status));
  if (complexId) conditions.push(eq(usersTable.complexId, complexId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [users, totalResult] = await Promise.all([
    db.select().from(usersTable).where(whereClause).limit(pageSize).offset(offset),
    db.select({ count: count() }).from(usersTable).where(whereClause),
  ]);

  const complexIds = [...new Set(users.map((u) => u.complexId).filter(Boolean))] as number[];
  const complexMap: Record<number, string> = {};
  if (complexIds.length > 0) {
    const complexes = await db.select().from(complexesTable);
    for (const c of complexes) complexMap[c.id] = c.name;
  }

  const data = users.map((u) => buildUserResponse(u, u.complexId ? complexMap[u.complexId] ?? null : null));
  res.json(ListUsersResponse.parse({ data, total: totalResult[0].count, page, pageSize }));
});

router.post("/users", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { password, ...rest } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ ...rest, passwordHash }).returning();

  let complexName: string | null = null;
  if (user.complexId) {
    const [c] = await db.select().from(complexesTable).where(eq(complexesTable.id, user.complexId));
    complexName = c?.name ?? null;
  }

  await logAudit({ userId: auth.id, userFullName: auth.fullName, action: "create", resource: "user", resourceId: user.id, details: `Creó usuario: ${user.fullName}` });
  res.status(201).json(CreateUserResponse.parse(buildUserResponse(user, complexName)));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  let complexName: string | null = null;
  if (user.complexId) {
    const [c] = await db.select().from(complexesTable).where(eq(complexesTable.id, user.complexId));
    complexName = c?.name ?? null;
  }

  res.json(GetUserResponse.parse(buildUserResponse(user, complexName)));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [user] = await db.update(usersTable).set(body.data).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  let complexName: string | null = null;
  if (user.complexId) {
    const [c] = await db.select().from(complexesTable).where(eq(complexesTable.id, user.complexId));
    complexName = c?.name ?? null;
  }

  await logAudit({ userId: auth.id, userFullName: auth.fullName, action: "update", resource: "user", resourceId: user.id, details: `Actualizó usuario: ${user.fullName}` });
  res.json(UpdateUserResponse.parse(buildUserResponse(user, complexName)));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.delete(usersTable).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await logAudit({ userId: auth.id, userFullName: auth.fullName, action: "delete", resource: "user", resourceId: params.data.id, details: `Eliminó usuario: ${user.fullName}` });
  res.sendStatus(204);
});

export default router;
