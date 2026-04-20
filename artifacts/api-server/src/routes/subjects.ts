import { Router, type IRouter } from "express";
import { db, subjectsTable, courseAssignmentsTable, usersTable, classesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateSubjectBody,
  UpdateSubjectBody,
  UpdateSubjectParams,
  DeleteSubjectParams,
  CreateCourseAssignmentBody,
  DeleteCourseAssignmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subjects", async (_req, res): Promise<void> => {
  const subjects = await db.select().from(subjectsTable).orderBy(subjectsTable.name);
  res.json(
    subjects.map((s) => ({
      id: s.id,
      name: s.name,
      coefficient: s.coefficient,
      maxPoints: s.maxPoints,
      category: s.category,
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

router.post("/subjects", async (req, res): Promise<void> => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [subject] = await db.insert(subjectsTable).values(parsed.data).returning();
  res.status(201).json({
    id: subject.id,
    name: subject.name,
    coefficient: subject.coefficient,
    maxPoints: subject.maxPoints,
    category: subject.category,
    createdAt: subject.createdAt.toISOString(),
  });
});

router.patch("/subjects/:id", async (req, res): Promise<void> => {
  const params = UpdateSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.coefficient != null) updateData.coefficient = parsed.data.coefficient;
  if (parsed.data.maxPoints != null) updateData.maxPoints = parsed.data.maxPoints;
  if ("category" in parsed.data) updateData.category = parsed.data.category;

  const [updated] = await db
    .update(subjectsTable)
    .set(updateData)
    .where(eq(subjectsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Matière introuvable" });
    return;
  }

  res.json({
    id: updated.id,
    name: updated.name,
    coefficient: updated.coefficient,
    maxPoints: updated.maxPoints,
    category: updated.category,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/subjects/:id", async (req, res): Promise<void> => {
  const params = DeleteSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(subjectsTable).where(eq(subjectsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/course-assignments", async (_req, res): Promise<void> => {
  const assignments = await db.select().from(courseAssignmentsTable).orderBy(courseAssignmentsTable.createdAt);
  const formatted = await Promise.all(
    assignments.map(async (a) => {
      const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, a.teacherId));
      const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, a.subjectId));
      const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, a.classId));
      return {
        id: a.id,
        teacherId: a.teacherId,
        teacherName: teacher?.fullName || "Inconnu",
        subjectId: a.subjectId,
        subjectName: subject?.name || "Inconnu",
        classId: a.classId,
        className: cls?.name || "Inconnu",
        academicYear: a.academicYear,
        createdAt: a.createdAt.toISOString(),
      };
    })
  );
  res.json(formatted);
});

router.post("/course-assignments", async (req, res): Promise<void> => {
  const parsed = CreateCourseAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [assignment] = await db.insert(courseAssignmentsTable).values(parsed.data).returning();
  const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, assignment.teacherId));
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, assignment.subjectId));
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, assignment.classId));

  res.status(201).json({
    id: assignment.id,
    teacherId: assignment.teacherId,
    teacherName: teacher?.fullName || "Inconnu",
    subjectId: assignment.subjectId,
    subjectName: subject?.name || "Inconnu",
    classId: assignment.classId,
    className: cls?.name || "Inconnu",
    academicYear: assignment.academicYear,
    createdAt: assignment.createdAt.toISOString(),
  });
});

router.delete("/course-assignments/:id", async (req, res): Promise<void> => {
  const params = DeleteCourseAssignmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(courseAssignmentsTable).where(eq(courseAssignmentsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
