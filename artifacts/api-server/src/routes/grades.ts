import { Router, type IRouter } from "express";
import { db, gradesTable, subjectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateGradeBody,
  UpdateGradeBody,
  UpdateGradeParams,
  DeleteGradeParams,
  ListGradesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatGrade(g: typeof gradesTable.$inferSelect) {
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, g.subjectId));
  return {
    id: g.id,
    studentId: g.studentId,
    subjectId: g.subjectId,
    subjectName: subject?.name || "Inconnu",
    classId: g.classId,
    period: g.period,
    points: g.points,
    maxPoints: subject?.maxPoints || 100,
    coefficient: subject?.coefficient || 1,
    academicYear: g.academicYear,
    createdAt: g.createdAt.toISOString(),
  };
}

router.get("/grades", async (req, res): Promise<void> => {
  const params = ListGradesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.studentId) conditions.push(eq(gradesTable.studentId, params.data.studentId));
  if (params.data.classId) conditions.push(eq(gradesTable.classId, params.data.classId));
  if (params.data.subjectId) conditions.push(eq(gradesTable.subjectId, params.data.subjectId));
  if (params.data.academicYear) conditions.push(eq(gradesTable.academicYear, params.data.academicYear));

  const grades =
    conditions.length > 0
      ? await db.select().from(gradesTable).where(and(...conditions))
      : await db.select().from(gradesTable);

  const formatted = await Promise.all(grades.map(formatGrade));
  res.json(formatted);
});

router.post("/grades", async (req, res): Promise<void> => {
  const parsed = CreateGradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [grade] = await db.insert(gradesTable).values(parsed.data).returning();
  res.status(201).json(await formatGrade(grade));
});

router.patch("/grades/:id", async (req, res): Promise<void> => {
  const params = UpdateGradeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateGradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.points != null) updateData.points = parsed.data.points;

  const [updated] = await db
    .update(gradesTable)
    .set(updateData)
    .where(eq(gradesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Note introuvable" });
    return;
  }

  res.json(await formatGrade(updated));
});

router.delete("/grades/:id", async (req, res): Promise<void> => {
  const params = DeleteGradeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(gradesTable).where(eq(gradesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
