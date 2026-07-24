import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable, complexesTable } from "@workspace/db";
import {
  LoginBody,
  GetMeResponse,
  LoginResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const JWT_SECRET = process.env.SESSION_SECRET || "ecorecicla-secret-2024";

function signToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export async function getUserFromToken(token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
    return user || null;
  } catch {
    return null;
  }
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.status === "inactive") {
    res.status(401).json({ error: "Account is inactive" });
    return;
  }

  let complexName: string | null = null;
  if (user.complexId) {
    const [c] = await db.select().from(complexesTable).where(eq(complexesTable.id, user.complexId));
    complexName = c?.name ?? null;
  }

  const token = signToken(user.id);
  const responseUser = {
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
    createdAt: user.createdAt.toISOString(),
  };
  res.json(LoginResponse.parse({ user: responseUser, token }));
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ success: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let complexName: string | null = null;
  if (user.complexId) {
    const [c] = await db.select().from(complexesTable).where(eq(complexesTable.id, user.complexId));
    complexName = c?.name ?? null;
  }

  res.json(GetMeResponse.parse({
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
    createdAt: user.createdAt.toISOString(),
  }));
});

export default router;
