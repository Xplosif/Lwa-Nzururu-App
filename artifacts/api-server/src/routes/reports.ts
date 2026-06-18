import { Router, type IRouter } from "express";
import { db, studentsTable, classesTable, gradesTable, subjectsTable, settingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  GenerateBulletinParams,
  GenerateBulletinQueryParams,
  GeneratePalmaresParams,
  GeneratePalmaresQueryParams,
  UpdateSignatureInfoBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SCHOOL_INFO = {
  name: "Institut Lwa-Nzururu",
  address: "Beni, Nord-Kivu",
  province: "Nord-Kivu",
  territoire: "Lubero",
  code: "LWA-001",
};

const PASS_THRESHOLD = 50;

async function getOrCreateSettings() {
  const settings = await db.select().from(settingsTable);
  if (settings.length > 0) return settings[0];
  const [created] = await db.insert(settingsTable).values({}).returning();
  return created;
}

router.get("/reports/signature", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json({
    id: settings.id,
    provisioneurName: settings.provisioneurName,
    title: settings.title,
    location: settings.location,
    schoolName: settings.schoolName,
  });
});

router.post("/reports/signature", async (req, res): Promise<void> => {
  const parsed = UpdateSignatureInfoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const settings = await getOrCreateSettings();
  const [updated] = await db
    .update(settingsTable)
    .set(parsed.data)
    .where(eq(settingsTable.id, settings.id))
    .returning();

  res.json({
    id: updated.id,
    provisioneurName: updated.provisioneurName,
    title: updated.title,
    location: updated.location,
    schoolName: updated.schoolName,
  });
});

router.get("/reports/bulletin/:studentId", async (req, res): Promise<void> => {
  const pathParams = GenerateBulletinParams.safeParse(req.params);
  if (!pathParams.success) {
    res.status(400).json({ error: pathParams.error.message });
    return;
  }

  const queryParams = GenerateBulletinQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const { studentId } = pathParams.data;
  const { academicYear } = queryParams.data;

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  if (!student) {
    res.status(404).json({ error: "Élève introuvable" });
    return;
  }

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, student.classId));
  const grades = await db
    .select()
    .from(gradesTable)
    .where(and(eq(gradesTable.studentId, studentId), eq(gradesTable.academicYear, academicYear)));

  const allSubjects = await db.select().from(subjectsTable);
  const settings = await getOrCreateSettings();

  const periods = ["P1", "P2", "exam_s1", "P3", "P4", "exam_s2", "bonus"];

  const gradesBySubject = allSubjects.map((subj) => {
    const row: Record<string, unknown> = {
      subjectId: subj.id,
      subjectName: subj.name,
      coefficient: subj.coefficient,
      maxPoints: subj.maxPoints,
    };

    for (const period of periods) {
      const grade = grades.find((g) => g.subjectId === subj.id && g.period === period);
      row[period] = grade ? grade.points : null;
    }

    const p1 = row["P1"] as number | null;
    const p2 = row["P2"] as number | null;
    const examS1 = row["exam_s1"] as number | null;
    const p3 = row["P3"] as number | null;
    const p4 = row["P4"] as number | null;
    const examS2 = row["exam_s2"] as number | null;
    const bonus = row["bonus"] as number | null;

    const totalS1 = p1 !== null && p2 !== null && examS1 !== null ? p1 + p2 + examS1 : null;
    const totalS2 = p3 !== null && p4 !== null && examS2 !== null ? p3 + p4 + examS2 : null;
    const annualTotal = totalS1 !== null && totalS2 !== null ? totalS1 + totalS2 + (bonus || 0) : null;

    row.totalS1 = totalS1;
    row.totalS2 = totalS2;
    row.annualTotal = annualTotal;

    return row;
  });

  let totalPoints = 0;
  let maxTotalPoints = 0;

  for (const g of grades) {
    const subj = allSubjects.find((s) => s.id === g.subjectId);
    if (subj) {
      totalPoints += g.points * subj.coefficient;
      maxTotalPoints += subj.maxPoints * subj.coefficient;
    }
  }

  const percentage = maxTotalPoints > 0 ? (totalPoints / maxTotalPoints) * 100 : 0;
  const passed = percentage >= PASS_THRESHOLD;

  const allClassStudents = await db
    .select()
    .from(studentsTable)
    .where(and(eq(studentsTable.classId, student.classId), eq(studentsTable.academicYear, academicYear)));

  const classScores: Array<{ id: number; score: number }> = [];

  for (const s of allClassStudents) {
    const sGrades = await db
      .select()
      .from(gradesTable)
      .where(and(eq(gradesTable.studentId, s.id), eq(gradesTable.academicYear, academicYear)));

    if (sGrades.length === 0) continue;

    let sTotal = 0;
    let sMax = 0;
    for (const g of sGrades) {
      const subj = allSubjects.find((sub) => sub.id === g.subjectId);
      if (subj) {
        sTotal += g.points * subj.coefficient;
        sMax += subj.maxPoints * subj.coefficient;
      }
    }
    if (sMax > 0) classScores.push({ id: s.id, score: (sTotal / sMax) * 100 });
  }

  const sorted = classScores.sort((a, b) => b.score - a.score);
  const rank = sorted.findIndex((s) => s.id === studentId) + 1;

  res.json({
    student: {
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
      academicYear,
      createdAt: student.createdAt.toISOString(),
    },
    className: cls?.name || "Inconnu",
    academicYear,
    gradesBySubject,
    totalPoints,
    maxTotalPoints,
    percentage,
    rank: rank > 0 ? rank : null,
    totalStudentsInClass: allClassStudents.length,
    passed,
    schoolInfo: SCHOOL_INFO,
    signature: {
      id: settings.id,
      provisioneurName: settings.provisioneurName,
      title: settings.title,
      location: settings.location,
      schoolName: settings.schoolName,
    },
  });
});

router.get("/reports/palmares/:classId", async (req, res): Promise<void> => {
  const pathParams = GeneratePalmaresParams.safeParse(req.params);
  if (!pathParams.success) {
    res.status(400).json({ error: pathParams.error.message });
    return;
  }

  const queryParams = GeneratePalmaresQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const { classId } = pathParams.data;
  const { academicYear } = queryParams.data;

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, classId));
  if (!cls) {
    res.status(404).json({ error: "Classe introuvable" });
    return;
  }

  const students = await db
    .select()
    .from(studentsTable)
    .where(and(eq(studentsTable.classId, classId), eq(studentsTable.academicYear, academicYear)));

  const allSubjects = await db.select().from(subjectsTable);
  const settings = await getOrCreateSettings();

  const studentScores: Array<{
    studentId: number;
    fullName: string;
    gender: string;
    percentage: number;
    totalPoints: number;
    passed: boolean;
  }> = [];

  for (const s of students) {
    const grades = await db
      .select()
      .from(gradesTable)
      .where(and(eq(gradesTable.studentId, s.id), eq(gradesTable.academicYear, academicYear)));

    if (grades.length === 0) continue;

    let total = 0;
    let max = 0;
    for (const g of grades) {
      const subj = allSubjects.find((sub) => sub.id === g.subjectId);
      if (subj) {
        total += g.points * subj.coefficient;
        max += subj.maxPoints * subj.coefficient;
      }
    }

    if (max === 0) continue;
    const percentage = (total / max) * 100;
    studentScores.push({
      studentId: s.id,
      fullName: `${s.firstName} ${s.lastName}`,
      gender: s.gender,
      percentage,
      totalPoints: total,
      passed: percentage >= PASS_THRESHOLD,
    });
  }

  const ranked = studentScores
    .sort((a, b) => b.percentage - a.percentage)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  const totalStudents = ranked.length;
  const passed = ranked.filter((s) => s.passed).length;
  const male = students.filter((s) => s.gender === "M");
  const female = students.filter((s) => s.gender === "F");
  const malePassed = ranked.filter((s) => s.gender === "M" && s.passed).length;
  const femalePassed = ranked.filter((s) => s.gender === "F" && s.passed).length;

  res.json({
    classId,
    className: cls.name,
    academicYear,
    rankings: ranked,
    schoolInfo: SCHOOL_INFO,
    signature: {
      id: settings.id,
      provisioneurName: settings.provisioneurName,
      title: settings.title,
      location: settings.location,
      schoolName: settings.schoolName,
    },
    stats: {
      classId,
      className: cls.name,
      totalStudents: students.length,
      maleStudents: male.length,
      femaleStudents: female.length,
      passRate: totalStudents > 0 ? (passed / totalStudents) * 100 : 0,
      malePassRate: male.length > 0 ? (malePassed / male.length) * 100 : 0,
      femalePassRate: female.length > 0 ? (femalePassed / female.length) * 100 : 0,
      averageScore:
        totalStudents > 0
          ? ranked.reduce((sum, s) => sum + s.percentage, 0) / totalStudents
          : 0,
    },
  });
});

export default router;
