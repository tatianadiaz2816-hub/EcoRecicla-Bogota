import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, complexesTable } from "@workspace/db";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
  ChangePasswordBody,
  UploadProfilePhotoBody,
  UploadProfilePhotoResponse,
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

async function buildUserResponse(user: any) {
  let complexName: string | null = null;
  if (user.complexId) {
    const [c] = await db.select().from(complexesTable).where(eq(complexesTable.id, user.complexId));
    complexName = c?.name ?? null;
  }
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

router.get("/profile", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  res.json(GetProfileResponse.parse(await buildUserResponse(auth)));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, auth.id)).returning();
  res.json(UpdateProfileResponse.parse(await buildUserResponse(user)));
});

router.post("/profile/change-password", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const valid = await bcrypt.compare(parsed.data.currentPassword, auth.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, auth.id));
  res.json({ success: true });
});

router.post("/profile/photo", async (req, res): Promise<void> => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const parsed = UploadProfilePhotoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.update(usersTable).set({ photoUrl: parsed.data.photoUrl }).where(eq(usersTable.id, auth.id)).returning();
  res.json(UploadProfilePhotoResponse.parse(await buildUserResponse(user)));
});

export default router;
