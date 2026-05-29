import { Router, type IRouter } from "express";
import { db, usersTable, classesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateRandomCredentials } from "../lib/auth";
import {
  LoginBody,
  SetupAccountBody,
  ChangePasswordBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user) {
    const [userByTemp] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.tempUsername, username));

    if (!userByTemp || !verifyPassword(password, userByTemp.passwordHash)) {
      res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });
      return;
    }

    const classInfo = userByTemp.classId
      ? await db.select().from(classesTable).where(eq(classesTable.id, userByTemp.classId))
      : [];

    (req as any).session = (req as any).session || {};
    (req as any).session.userId = userByTemp.id;
    res.json({
      user: {
        id: userByTemp.id,
        username: userByTemp.username,
        fullName: userByTemp.fullName,
        role: userByTemp.role,
        classId: userByTemp.classId,
        className: classInfo[0]?.name || null,
        isFirstLogin: userByTemp.isFirstLogin,
        createdAt: userByTemp.createdAt.toISOString(),
      },
      requiresSetup: userByTemp.isFirstLogin,
    });
    return;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });
    return;
  }

  const classInfo = user.classId
    ? await db.select().from(classesTable).where(eq(classesTable.id, user.classId))
    : [];

  (req as any).session = (req as any).session || {};
  (req as any).session.userId = user.id;
  res.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      classId: user.classId,
      className: classInfo[0]?.name || null,
      isFirstLogin: user.isFirstLogin,
      createdAt: user.createdAt.toISOString(),
    },
    requiresSetup: user.isFirstLogin,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const sess = (req as any).session;
  if (sess?._id) {
    (req as any).sessionStore?.delete(sess._id);
  }
  (req as any).session = { userId: null, _id: null, _loggedOut: true };
  res.clearCookie("sessionId");
  res.json({ success: true, message: "Déconnecté" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req as any).session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Utilisateur introuvable" });
    return;
  }

  const classInfo = user.classId
    ? await db.select().from(classesTable).where(eq(classesTable.id, user.classId))
    : [];

  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    classId: user.classId,
    className: classInfo[0]?.name || null,
    isFirstLogin: user.isFirstLogin,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/setup-account", async (req, res): Promise<void> => {
  const parsed = SetupAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tempUsername, tempPassword, newUsername, newPassword, fullName } = parsed.data;

  const [userByTemp] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.tempUsername, tempUsername));

  const [userByMain] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, tempUsername));

  const user = userByTemp || userByMain;

  if (!user || !verifyPassword(tempPassword, user.passwordHash)) {
    res.status(401).json({ error: "Identifiants temporaires invalides" });
    return;
  }

  const existingWithNewUsername = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, newUsername));

  if (existingWithNewUsername.length > 0 && existingWithNewUsername[0].id !== user.id) {
    res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      username: newUsername,
      passwordHash: hashPassword(newPassword),
      fullName,
      isFirstLogin: false,
      tempUsername: null,
    })
    .where(eq(usersTable.id, user.id))
    .returning();

  const classInfo = updated.classId
    ? await db.select().from(classesTable).where(eq(classesTable.id, updated.classId))
    : [];

  (req as any).session = (req as any).session || {};
  (req as any).session.userId = updated.id;

  res.json({
    user: {
      id: updated.id,
      username: updated.username,
      fullName: updated.fullName,
      role: updated.role,
      classId: updated.classId,
      className: classInfo[0]?.name || null,
      isFirstLogin: updated.isFirstLogin,
      createdAt: updated.createdAt.toISOString(),
    },
    requiresSetup: false,
  });
});

router.put("/auth/profile", async (req, res): Promise<void> => {
  const userId = (req as any).session?.userId;
  if (!userId) { res.status(401).json({ error: "Non authentifie" }); return; }

  const { fullName, currentPassword, newPassword } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};

  if (typeof fullName === "string" && fullName.trim()) {
    updates.fullName = fullName.trim();
  }

  if (newPassword) {
    if (!currentPassword) { res.status(400).json({ error: "Mot de passe actuel requis" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
      res.status(400).json({ error: "Mot de passe actuel incorrect" }); return;
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({ error: "Le nouveau mot de passe doit faire au moins 6 caracteres" }); return;
    }
    updates.passwordHash = hashPassword(newPassword);
  }

  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Aucune donnee a mettre a jour" }); return; }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();

  const [cls] = updated.classId ? await db.select().from(classesTable).where(eq(classesTable.id, updated.classId)) : [null];

  const session = (req as any).session;
  const userObj = {
    id: updated.id,
    username: updated.username,
    fullName: updated.fullName,
    role: updated.role,
    classId: updated.classId,
    className: cls?.name || null,
    isFirstLogin: updated.isFirstLogin,
    createdAt: updated.createdAt,
  };
  if (session) {
    session.userId = updated.id;
    session.role = updated.role;
  }

  res.json(userObj);
});

router.post("/auth/change-password", async (req, res): Promise<void> => {
  const userId = (req as any).session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || !verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    res.status(400).json({ error: "Mot de passe actuel incorrect" });
    return;
  }

  await db
    .update(usersTable)
    .set({ passwordHash: hashPassword(parsed.data.newPassword) })
    .where(eq(usersTable.id, userId));

  res.json({ success: true, message: "Mot de passe modifié" });
});

export default router;
