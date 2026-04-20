import { Router, type IRouter } from "express";
import { db, studentsTable, classesTable, gradesTable, subjectsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  GetDashboardStatsQueryParams,
  GetClassStatsParams,
  GetClassStatsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const PASS_THRESHOLD = 50;

async function computeStudentScore(studentId: number, academicYear: string) {
  const grades = await db
    .select()
    .from(gradesTable)
    .where(and(eq(gradesTable.studentId, studentId), eq(gradesTable.academicYear, academicYear)));

  if (grades.length === 0) return null;

  let totalWeighted = 0;
  let maxWeighted = 0;

  for (const g of grades) {
    const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, g.subjectId));
    const coef = subject?.coefficient || 1;
    const max = subject?.maxPoints || 100;
    totalWeighted += g.points * coef;
    maxWeighted += max * coef;
  }

  if (maxWeighted === 0) return null;
  return (totalWeighted / maxWeighted) * 100;
}

router.get("/stats/dashboard", async (req, res): Promise<void> => {
  const params = GetDashboardStatsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { academicYear } = params.data;

  const allStudents = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.academicYear, academicYear));

  const allClasses = await db.select().from(classesTable).where(eq(classesTable.academicYear, academicYear));
  const allTeachers = await db.select().from(usersTable);

  const maleStudents = allStudents.filter((s) => s.gender === "M");
  const femaleStudents = allStudents.filter((s) => s.gender === "F");

  let totalPassed = 0;
  let malePassed = 0;
  let femalePassed = 0;
  let maleWithGrades = 0;
  let femaleWithGrades = 0;
  let totalWithGrades = 0;

  const studentScores: Array<{ id: number; fullName: string; className: string; score: number }> = [];

  for (const s of allStudents) {
    const score = await computeStudentScore(s.id, academicYear);
    if (score !== null) {
      totalWithGrades++;
      const [cls] = allClasses.filter((c) => c.id === s.classId);
      if (score >= PASS_THRESHOLD) {
        totalPassed++;
        if (s.gender === "M") malePassed++;
        else femalePassed++;
      }
      if (s.gender === "M") maleWithGrades++;
      else femaleWithGrades++;
      studentScores.push({
        id: s.id,
        fullName: `${s.firstName} ${s.lastName}`,
        className: cls?.name || "Inconnu",
        score,
      });
    }
  }

  const overallPassRate = totalWithGrades > 0 ? (totalPassed / totalWithGrades) * 100 : 0;
  const malePassRate = maleWithGrades > 0 ? (malePassed / maleWithGrades) * 100 : 0;
  const femalePassRate = femaleWithGrades > 0 ? (femalePassed / femaleWithGrades) * 100 : 0;

  const classStats = await Promise.all(
    allClasses.map(async (cls) => {
      const classStudents = allStudents.filter((s) => s.classId === cls.id);
      const classMale = classStudents.filter((s) => s.gender === "M");
      const classFemale = classStudents.filter((s) => s.gender === "F");

      let classPassed = 0;
      let classMalePassed = 0;
      let classFemalePassed = 0;
      let classMaleWithGrades = 0;
      let classFemaleWithGrades = 0;
      let classWithGrades = 0;
      let totalScore = 0;

      for (const s of classStudents) {
        const score = await computeStudentScore(s.id, academicYear);
        if (score !== null) {
          classWithGrades++;
          totalScore += score;
          if (score >= PASS_THRESHOLD) {
            classPassed++;
            if (s.gender === "M") classMalePassed++;
            else classFemalePassed++;
          }
          if (s.gender === "M") classMaleWithGrades++;
          else classFemaleWithGrades++;
        }
      }

      return {
        classId: cls.id,
        className: cls.name,
        totalStudents: classStudents.length,
        maleStudents: classMale.length,
        femaleStudents: classFemale.length,
        passRate: classWithGrades > 0 ? (classPassed / classWithGrades) * 100 : 0,
        malePassRate: classMaleWithGrades > 0 ? (classMalePassed / classMaleWithGrades) * 100 : 0,
        femalePassRate: classFemaleWithGrades > 0 ? (classFemalePassed / classFemaleWithGrades) * 100 : 0,
        averageScore: classWithGrades > 0 ? totalScore / classWithGrades : 0,
      };
    })
  );

  const sortedScores = studentScores.sort((a, b) => b.score - a.score);
  const topStudents = sortedScores.slice(0, 10).map((s, i) => ({
    studentId: s.id,
    fullName: s.fullName,
    className: s.className,
    percentage: s.score,
    rank: i + 1,
  }));

  res.json({
    academicYear,
    totalStudents: allStudents.length,
    maleStudents: maleStudents.length,
    femaleStudents: femaleStudents.length,
    totalClasses: allClasses.length,
    totalTeachers: allTeachers.filter((u) => u.role === "enseignant" || u.role === "titulaire").length,
    overallPassRate,
    malePassRate,
    femalePassRate,
    classStats,
    topStudents,
  });
});

router.get("/stats/class/:classId", async (req, res): Promise<void> => {
  const pathParams = GetClassStatsParams.safeParse(req.params);
  if (!pathParams.success) {
    res.status(400).json({ error: pathParams.error.message });
    return;
  }

  const queryParams = GetClassStatsQueryParams.safeParse(req.query);
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

  const studentData: Array<{
    studentId: number;
    fullName: string;
    gender: string;
    percentage: number;
    totalPoints: number;
    passed: boolean;
  }> = [];

  let maleCount = 0;
  let femaleCount = 0;
  let malePassed = 0;
  let femalePassed = 0;
  let maleWithGrades = 0;
  let femaleWithGrades = 0;
  let totalWithGrades = 0;
  let totalPassed = 0;
  let totalScore = 0;

  for (const s of students) {
    if (s.gender === "M") maleCount++;
    else femaleCount++;

    const grades = await db
      .select()
      .from(gradesTable)
      .where(and(eq(gradesTable.studentId, s.id), eq(gradesTable.academicYear, academicYear)));

    if (grades.length === 0) continue;

    let totalWeighted = 0;
    let maxWeighted = 0;

    for (const g of grades) {
      const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, g.subjectId));
      const coef = subject?.coefficient || 1;
      const max = subject?.maxPoints || 100;
      totalWeighted += g.points * coef;
      maxWeighted += max * coef;
    }

    if (maxWeighted === 0) continue;
    const percentage = (totalWeighted / maxWeighted) * 100;
    const passed = percentage >= PASS_THRESHOLD;

    totalWithGrades++;
    totalScore += percentage;
    if (passed) totalPassed++;
    if (s.gender === "M") {
      maleWithGrades++;
      if (passed) malePassed++;
    } else {
      femaleWithGrades++;
      if (passed) femalePassed++;
    }

    studentData.push({
      studentId: s.id,
      fullName: `${s.firstName} ${s.lastName}`,
      gender: s.gender,
      percentage,
      totalPoints: totalWeighted,
      passed,
    });
  }

  const ranked = studentData
    .sort((a, b) => b.percentage - a.percentage)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  const subjects = await db.select().from(subjectsTable);
  const subjectAverages = await Promise.all(
    subjects.map(async (subj) => {
      const subjectGrades = await db
        .select()
        .from(gradesTable)
        .where(
          and(
            eq(gradesTable.classId, classId),
            eq(gradesTable.subjectId, subj.id),
            eq(gradesTable.academicYear, academicYear)
          )
        );

      const avg =
        subjectGrades.length > 0
          ? subjectGrades.reduce((sum, g) => sum + g.points, 0) / subjectGrades.length
          : 0;

      return {
        subjectId: subj.id,
        subjectName: subj.name,
        average: avg,
        coefficient: subj.coefficient,
      };
    })
  );

  res.json({
    classId,
    className: cls.name,
    academicYear,
    totalStudents: students.length,
    maleStudents: maleCount,
    femaleStudents: femaleCount,
    passRate: totalWithGrades > 0 ? (totalPassed / totalWithGrades) * 100 : 0,
    malePassRate: maleWithGrades > 0 ? (malePassed / maleWithGrades) * 100 : 0,
    femalePassRate: femaleWithGrades > 0 ? (femalePassed / femaleWithGrades) * 100 : 0,
    averageScore: totalWithGrades > 0 ? totalScore / totalWithGrades : 0,
    studentRankings: ranked,
    subjectAverages: subjectAverages.filter((s) => s.average > 0),
  });
});

export default router;
