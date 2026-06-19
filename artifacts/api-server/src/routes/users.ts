import { Router, type IRouter } from "express";
import { db, usersTable, classesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { hashPassword, generateRandomCredentials } from "../lib/auth";
import {
  CreateUserBody,
  UpdateUserBody,
  GetUserParams,
  UpdateUserParams,
  DeleteUserParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatUser(user: typeof usersTable.$inferSelect) {
  const classInfo = user.classId
    ? await db.select().from(classesTable).where(eq(classesTable.id, user.classId))
    : [];
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    classId: user.classId,
    className: classInfo[0]?.name || null,
    isFirstLogin: user.isFirstLogin,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.fullName);
  const formatted = await Promise.all(users.map(formatUser));
  res.json(formatted);
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fullName, role, classId } = parsed.data;

  if (role === "titulaire" && classId) {
    const existing = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.role, "titulaire"), eq(usersTable.classId, classId)));
    if (existing.length > 0) {
      res.status(409).json({ error: `Cette classe a deja un titulaire : ${existing[0].fullName}. Une classe ne peut avoir qu'un seul titulaire.` });
      return;
    }
  }

  const { username, password } = generateRandomCredentials();
  const passwordHash = hashPassword(password);

  const [user] = await db
    .insert(usersTable)
    .values({
      username,
      passwordHash,
      fullName,
      role,
      classId: classId || null,
      isFirstLogin: true,
      tempUsername: username,
    })
    .returning();

  res.status(201).json({
    user: await formatUser(user),
    tempUsername: username,
    tempPassword: password,
  });
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));

  if (!user) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }

  res.json(await formatUser(user));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.fullName != null) updateData.fullName = parsed.data.fullName;
  if (parsed.data.role != null) updateData.role = parsed.data.role;
  if ("classId" in parsed.data) updateData.classId = parsed.data.classId;

  const [updated] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }

  res.json(await formatUser(updated));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
