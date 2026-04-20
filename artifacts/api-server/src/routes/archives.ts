import { Router, type IRouter } from "express";
import { db, archivesTable, studentsTable, classesTable, gradesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateArchiveBody,
  GetArchiveParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/archives", async (_req, res): Promise<void> => {
  const archives = await db.select().from(archivesTable).orderBy(archivesTable.academicYear);
  res.json(
    archives.map((a) => ({
      id: a.id,
      academicYear: a.academicYear,
      archivedAt: a.archivedAt.toISOString(),
      totalStudents: a.totalStudents,
      totalClasses: a.totalClasses,
      overallPassRate: a.overallPassRate,
      notes: a.notes,
      createdBy: a.createdBy,
    }))
  );
});

router.post("/archives", async (req, res): Promise<void> => {
  const parsed = CreateArchiveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { academicYear, notes } = parsed.data;

  const students = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.academicYear, academicYear));

  const classes = await db
    .select()
    .from(classesTable)
    .where(eq(classesTable.academicYear, academicYear));

  const allGrades = await db
    .select()
    .from(gradesTable)
    .where(eq(gradesTable.academicYear, academicYear));

  const studentsWithGrades = new Set(allGrades.map((g) => g.studentId));
  const passedStudents = students.filter((s) => studentsWithGrades.has(s.id)).length;
  const overallPassRate = students.length > 0 ? (passedStudents / students.length) * 100 : 0;

  const [archive] = await db
    .insert(archivesTable)
    .values({
      academicYear,
      totalStudents: students.length,
      totalClasses: classes.length,
      overallPassRate,
      notes: notes || null,
      createdBy: "Proviseur",
    })
    .returning();

  res.status(201).json({
    id: archive.id,
    academicYear: archive.academicYear,
    archivedAt: archive.archivedAt.toISOString(),
    totalStudents: archive.totalStudents,
    totalClasses: archive.totalClasses,
    overallPassRate: archive.overallPassRate,
    notes: archive.notes,
    createdBy: archive.createdBy,
  });
});

router.get("/archives/:id", async (req, res): Promise<void> => {
  const params = GetArchiveParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [archive] = await db.select().from(archivesTable).where(eq(archivesTable.id, params.data.id));
  if (!archive) {
    res.status(404).json({ error: "Archive introuvable" });
    return;
  }

  res.json({
    id: archive.id,
    academicYear: archive.academicYear,
    archivedAt: archive.archivedAt.toISOString(),
    totalStudents: archive.totalStudents,
    totalClasses: archive.totalClasses,
    overallPassRate: archive.overallPassRate,
    notes: archive.notes,
    createdBy: archive.createdBy,
  });
});

export default router;
