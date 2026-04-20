import { Router, type IRouter } from "express";
import { db, classesTable, usersTable, studentsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  CreateClassBody,
  UpdateClassBody,
  GetClassParams,
  UpdateClassParams,
  DeleteClassParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatClass(cls: typeof classesTable.$inferSelect) {
  const titulaire = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.classId, cls.id));

  const studentCount = await db
    .select({ count: count() })
    .from(studentsTable)
    .where(eq(studentsTable.classId, cls.id));

  return {
    id: cls.id,
    name: cls.name,
    level: cls.level,
    section: cls.section,
    room: cls.room,
    titulaire: titulaire.find((u) => u.role === "titulaire")?.fullName || null,
    studentCount: studentCount[0]?.count || 0,
    academicYear: cls.academicYear,
    createdAt: cls.createdAt.toISOString(),
  };
}

router.get("/classes", async (_req, res): Promise<void> => {
  const classes = await db.select().from(classesTable).orderBy(classesTable.name);
  const formatted = await Promise.all(classes.map(formatClass));
  res.json(formatted);
});

router.post("/classes", async (req, res): Promise<void> => {
  const parsed = CreateClassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cls] = await db.insert(classesTable).values(parsed.data).returning();
  res.status(201).json(await formatClass(cls));
});

router.get("/classes/:id", async (req, res): Promise<void> => {
  const params = GetClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, params.data.id));
  if (!cls) {
    res.status(404).json({ error: "Classe introuvable" });
    return;
  }

  res.json(await formatClass(cls));
});

router.patch("/classes/:id", async (req, res): Promise<void> => {
  const params = UpdateClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateClassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.level != null) updateData.level = parsed.data.level;
  if ("section" in parsed.data) updateData.section = parsed.data.section;
  if ("room" in parsed.data) updateData.room = parsed.data.room;
  if (parsed.data.academicYear != null) updateData.academicYear = parsed.data.academicYear;

  const [updated] = await db
    .update(classesTable)
    .set(updateData)
    .where(eq(classesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Classe introuvable" });
    return;
  }

  res.json(await formatClass(updated));
});

router.delete("/classes/:id", async (req, res): Promise<void> => {
  const params = DeleteClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(classesTable).where(eq(classesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
