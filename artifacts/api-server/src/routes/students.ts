import { Router, type IRouter } from "express";
import { db, studentsTable, classesTable, gradesTable, subjectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import {
  CreateStudentBody,
  UpdateStudentBody,
  GetStudentParams,
  UpdateStudentParams,
  DeleteStudentParams,
  ListStudentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateRegNumber(): string {
  return `LWA${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

async function formatStudent(student: typeof studentsTable.$inferSelect) {
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, student.classId));
  return {
    id: student.id,
    registrationNumber: student.registrationNumber,
    firstName: student.firstName,
    lastName: student.lastName,
    gender: student.gender,
    dateOfBirth: student.dateOfBirth,
    placeOfBirth: student.placeOfBirth,
    fatherName: student.fatherName,
    motherName: student.motherName,
    address: student.address,
    classId: student.classId,
    className: cls?.name || "Inconnu",
    academicYear: student.academicYear,
    createdAt: student.createdAt.toISOString(),
  };
}

router.get("/students", async (req, res): Promise<void> => {
  const params = ListStudentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(studentsTable);
  const conditions = [];
  if (params.data.classId) conditions.push(eq(studentsTable.classId, params.data.classId));
  if (params.data.academicYear) conditions.push(eq(studentsTable.academicYear, params.data.academicYear));

  const students =
    conditions.length > 0
      ? await db.select().from(studentsTable).where(and(...conditions)).orderBy(studentsTable.lastName)
      : await db.select().from(studentsTable).orderBy(studentsTable.lastName);

  const formatted = await Promise.all(students.map(formatStudent));
  res.json(formatted);
});

router.post("/students", async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db
    .insert(studentsTable)
    .values({ ...parsed.data, registrationNumber: generateRegNumber() })
    .returning();

  res.status(201).json(await formatStudent(student));
});

router.get("/students/:id", async (req, res): Promise<void> => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, params.data.id));
  if (!student) {
    res.status(404).json({ error: "Élève introuvable" });
    return;
  }

  const grades = await db
    .select()
    .from(gradesTable)
    .where(and(eq(gradesTable.studentId, params.data.id), eq(gradesTable.academicYear, student.academicYear)));

  const gradesWithSubject = await Promise.all(
    grades.map(async (g) => {
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
    })
  );

  const totalPoints = gradesWithSubject.reduce((sum, g) => sum + g.points * g.coefficient, 0);
  const maxTotalPoints = gradesWithSubject.reduce((sum, g) => sum + g.maxPoints * g.coefficient, 0);
  const percentage = maxTotalPoints > 0 ? (totalPoints / maxTotalPoints) * 100 : 0;

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, student.classId));

  res.json({
    id: student.id,
    registrationNumber: student.registrationNumber,
    firstName: student.firstName,
    lastName: student.lastName,
    gender: student.gender,
    dateOfBirth: student.dateOfBirth,
    placeOfBirth: student.placeOfBirth,
    fatherName: student.fatherName,
    motherName: student.motherName,
    address: student.address,
    classId: student.classId,
    className: cls?.name || "Inconnu",
    academicYear: student.academicYear,
    grades: gradesWithSubject,
    totalPoints,
    percentage,
    rank: null,
    createdAt: student.createdAt.toISOString(),
  });
});

router.patch("/students/:id", async (req, res): Promise<void> => {
  const params = UpdateStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.firstName != null) updateData.firstName = parsed.data.firstName;
  if (parsed.data.lastName != null) updateData.lastName = parsed.data.lastName;
  if (parsed.data.gender != null) updateData.gender = parsed.data.gender;
  if ("dateOfBirth" in parsed.data) updateData.dateOfBirth = parsed.data.dateOfBirth;
  if ("placeOfBirth" in parsed.data) updateData.placeOfBirth = parsed.data.placeOfBirth;
  if ("fatherName" in parsed.data) updateData.fatherName = parsed.data.fatherName;
  if ("motherName" in parsed.data) updateData.motherName = parsed.data.motherName;
  if ("address" in parsed.data) updateData.address = parsed.data.address;
  if ("classId" in parsed.data) updateData.classId = parsed.data.classId;

  const [updated] = await db
    .update(studentsTable)
    .set(updateData)
    .where(eq(studentsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Élève introuvable" });
    return;
  }

  res.json(await formatStudent(updated));
});

router.delete("/students/:id", async (req, res): Promise<void> => {
  const params = DeleteStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(studentsTable).where(eq(studentsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
