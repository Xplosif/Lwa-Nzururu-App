import { Router, type IRouter } from "express";
import { db, deliberationsTable, deliberationBonusesTable, studentsTable, gradesTable, subjectsTable, classesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
const router: IRouter = Router();

const PASS_THRESHOLD = 50;

function parseCreateDeliberation(body: unknown): { classId: number; academicYear: string; semester: "S1" | "S2" } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.classId !== "number" || !Number.isInteger(b.classId)) return null;
  if (typeof b.academicYear !== "string" || !b.academicYear) return null;
  if (b.semester !== "S1" && b.semester !== "S2") return null;
  return { classId: b.classId, academicYear: b.academicYear, semester: b.semester };
}

function parseSetBonus(body: unknown): { studentId: number; bonusPoints: number } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.studentId !== "number" || !Number.isInteger(b.studentId)) return null;
  if (typeof b.bonusPoints !== "number" || b.bonusPoints < 0) return null;
  return { studentId: b.studentId, bonusPoints: b.bonusPoints };
}

function formatDeliberation(d: typeof deliberationsTable.$inferSelect, className: string) {
  return {
    id: d.id,
    classId: d.classId,
    className,
    academicYear: d.academicYear,
    semester: d.semester,
    status: d.status,
    approvedAt: d.approvedAt ? d.approvedAt.toISOString() : null,
    approvedBy: d.approvedBy,
    createdAt: d.createdAt.toISOString(),
  };
}

const S1_PERIODS = ["P1", "P2", "exam_s1"];
const S2_PERIODS = ["P3", "P4", "exam_s2"];

function getPeriods(semester: string) {
  return semester === "S1" ? S1_PERIODS : S2_PERIODS;
}

router.get("/deliberations", async (req, res): Promise<void> => {
  const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;

  let query = db.select().from(deliberationsTable).$dynamic();
  if (classId && !isNaN(classId)) {
    query = query.where(eq(deliberationsTable.classId, classId));
  }

  const rows = await query;
  const classes = await db.select().from(classesTable);

  const result = rows.map((d) => {
    const cls = classes.find((c) => c.id === d.classId);
    return formatDeliberation(d, cls?.name || "Inconnu");
  });

  res.json(result);
});

router.post("/deliberations", async (req, res): Promise<void> => {
  const parsed = parseCreateDeliberation(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Donnees invalides: classId, academicYear et semester (S1|S2) requis" });
    return;
  }

  const { classId, academicYear, semester } = parsed;

  const existing = await db
    .select()
    .from(deliberationsTable)
    .where(
      and(
        eq(deliberationsTable.classId, classId),
        eq(deliberationsTable.academicYear, academicYear),
        eq(deliberationsTable.semester, semester)
      )
    );

  if (existing.length > 0) {
    res.status(409).json({ error: "Une délibération existe déjà pour ce semestre et cette classe" });
    return;
  }

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, classId));
  if (!cls) {
    res.status(404).json({ error: "Classe introuvable" });
    return;
  }

  const [created] = await db
    .insert(deliberationsTable)
    .values({ classId, academicYear, semester, status: "brouillon" })
    .returning();

  res.status(201).json(formatDeliberation(created, cls.name));
});

router.get("/deliberations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const [delib] = await db.select().from(deliberationsTable).where(eq(deliberationsTable.id, id));
  if (!delib) {
    res.status(404).json({ error: "Délibération introuvable" });
    return;
  }

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, delib.classId));
  const periods = getPeriods(delib.semester);

  const students = await db
    .select()
    .from(studentsTable)
    .where(
      and(
        eq(studentsTable.classId, delib.classId),
        eq(studentsTable.academicYear, delib.academicYear)
      )
    );

  const allSubjects = await db.select().from(subjectsTable);
  const bonuses = await db
    .select()
    .from(deliberationBonusesTable)
    .where(eq(deliberationBonusesTable.deliberationId, id));

  const studentEntries = await Promise.all(
    students.map(async (s) => {
      const grades = await db
        .select()
        .from(gradesTable)
        .where(
          and(
            eq(gradesTable.studentId, s.id),
            eq(gradesTable.academicYear, delib.academicYear)
          )
        );

      const semesterGrades = grades.filter((g) => periods.includes(g.period));
      const bonus = bonuses.find((b) => b.studentId === s.id);
      const bonusPoints = bonus?.bonusPoints ?? 0;

      let semesterTotal: number | null = null;
      let semesterMax: number | null = null;
      let percentage: number | null = null;

      const gradesByPeriod = new Map<string, Map<number, number>>();
      for (const g of semesterGrades) {
        if (!gradesByPeriod.has(g.period)) gradesByPeriod.set(g.period, new Map());
        gradesByPeriod.get(g.period)!.set(g.subjectId, g.points);
      }

      const coveredPeriods = new Set(semesterGrades.map((g) => g.period));
      if (periods.every((p) => coveredPeriods.has(p))) {
        let total = 0;
        let max = 0;
        for (const g of semesterGrades) {
          const subj = allSubjects.find((sub) => sub.id === g.subjectId);
          if (subj) {
            total += g.points * subj.coefficient;
            max += subj.maxPoints * subj.coefficient;
          }
        }
        semesterTotal = total + bonusPoints;
        semesterMax = max;
        percentage = max > 0 ? ((total + bonusPoints) / max) * 100 : 0;
      }

      return {
        studentId: s.id,
        registrationNumber: s.registrationNumber,
        fullName: `${s.lastName} ${s.postnom || ""} ${s.firstName}`.replace(/\s+/g, " ").trim(),
        gender: s.gender,
        bonusPoints,
        semesterTotal,
        semesterMax,
        percentage,
        passed: percentage !== null && percentage >= PASS_THRESHOLD,
      };
    })
  );

  res.json({
    deliberation: formatDeliberation(delib, cls?.name || "Inconnu"),
    students: studentEntries,
  });
});

router.post("/deliberations/:id/approve", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const [delib] = await db.select().from(deliberationsTable).where(eq(deliberationsTable.id, id));
  if (!delib) {
    res.status(404).json({ error: "Délibération introuvable" });
    return;
  }

  if (delib.status === "approuve") {
    res.status(409).json({ error: "Cette délibération est déjà approuvée" });
    return;
  }

  const userId = (req as any).session?.userId as number | undefined;
  const [updated] = await db
    .update(deliberationsTable)
    .set({ status: "approuve", approvedAt: new Date(), approvedBy: userId || null })
    .where(eq(deliberationsTable.id, id))
    .returning();

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, updated.classId));
  res.json(formatDeliberation(updated, cls?.name || "Inconnu"));
});

router.post("/deliberations/:id/bonus", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const parsed = parseSetBonus(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Donnees invalides: studentId et bonusPoints requis" });
    return;
  }

  const [delib] = await db.select().from(deliberationsTable).where(eq(deliberationsTable.id, id));
  if (!delib) {
    res.status(404).json({ error: "Délibération introuvable" });
    return;
  }

  if (delib.status === "approuve") {
    res.status(409).json({ error: "Impossible de modifier une délibération approuvée" });
    return;
  }

  const { studentId, bonusPoints } = parsed;

  const existing = await db
    .select()
    .from(deliberationBonusesTable)
    .where(
      and(
        eq(deliberationBonusesTable.deliberationId, id),
        eq(deliberationBonusesTable.studentId, studentId)
      )
    );

  let result;
  if (existing.length > 0) {
    const [updated] = await db
      .update(deliberationBonusesTable)
      .set({ bonusPoints })
      .where(eq(deliberationBonusesTable.id, existing[0].id))
      .returning();
    result = updated;
  } else {
    const [created] = await db
      .insert(deliberationBonusesTable)
      .values({ deliberationId: id, studentId, bonusPoints })
      .returning();
    result = created;
  }

  res.json(result);
});

router.get("/parent/bulletin", async (req, res): Promise<void> => {
  const userId = (req as any).session?.userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.role !== "parent" || !user.studentId) {
    res.status(403).json({ error: "Ce compte n'est pas lié à un élève" });
    return;
  }

  const academicYear = (req.query.academicYear as string) || "2024-2025";
  const semester = (req.query.semester as string) || "S1";

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, user.studentId));
  if (!student) {
    res.status(404).json({ error: "Élève introuvable" });
    return;
  }

  const [delib] = await db
    .select()
    .from(deliberationsTable)
    .where(
      and(
        eq(deliberationsTable.classId, student.classId),
        eq(deliberationsTable.academicYear, academicYear),
        eq(deliberationsTable.semester, semester)
      )
    );

  if (!delib || delib.status !== "approuve") {
    res.status(403).json({
      error: "Les résultats ne sont pas encore disponibles. La délibération n'a pas encore été approuvée.",
      deliberationStatus: delib?.status || "non_initiee",
    });
    return;
  }

  const periods = getPeriods(semester);
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, student.classId));
  const grades = await db
    .select()
    .from(gradesTable)
    .where(
      and(
        eq(gradesTable.studentId, student.id),
        eq(gradesTable.academicYear, academicYear)
      )
    );

  const allSubjects = await db.select().from(subjectsTable);
  const allPeriods = ["P1", "P2", "exam_s1", "P3", "P4", "exam_s2", "bonus"];

  const bonus = await db
    .select()
    .from(deliberationBonusesTable)
    .where(
      and(
        eq(deliberationBonusesTable.deliberationId, delib.id),
        eq(deliberationBonusesTable.studentId, student.id)
      )
    );
  const bonusPoints = bonus[0]?.bonusPoints ?? 0;

  const gradesBySubject = allSubjects.map((subj) => {
    const row: Record<string, unknown> = {
      subjectId: subj.id,
      subjectName: subj.name,
      coefficient: subj.coefficient,
      maxPoints: subj.maxPoints,
    };

    for (const period of allPeriods) {
      const grade = grades.find((g) => g.subjectId === subj.id && g.period === period);
      row[period] = grade ? grade.points : null;
    }

    const semGrades = grades.filter((g) => g.subjectId === subj.id && periods.includes(g.period));
    const semTotal = semGrades.length > 0 ? semGrades.reduce((s, g) => s + g.points, 0) : null;
    row.semesterTotal = semTotal;

    return row;
  });

  const semesterGrades = grades.filter((g) => periods.includes(g.period));
  let totalPoints = 0;
  let maxTotalPoints = 0;
  for (const g of semesterGrades) {
    const subj = allSubjects.find((s) => s.id === g.subjectId);
    if (subj) {
      totalPoints += g.points * subj.coefficient;
      maxTotalPoints += subj.maxPoints * subj.coefficient;
    }
  }
  totalPoints += bonusPoints;
  const percentage = maxTotalPoints > 0 ? (totalPoints / maxTotalPoints) * 100 : 0;
  const passed = percentage >= PASS_THRESHOLD;

  const allClassStudents = await db
    .select()
    .from(studentsTable)
    .where(
      and(
        eq(studentsTable.classId, student.classId),
        eq(studentsTable.academicYear, academicYear)
      )
    );

  const classScores: Array<{ id: number; score: number }> = [];
  for (const s of allClassStudents) {
    const sGrades = await db
      .select()
      .from(gradesTable)
      .where(
        and(
          eq(gradesTable.studentId, s.id),
          eq(gradesTable.academicYear, academicYear)
        )
      );
    const sSemGrades = sGrades.filter((g) => periods.includes(g.period));
    if (sSemGrades.length === 0) continue;
    let sTotal = 0;
    let sMax = 0;
    for (const g of sSemGrades) {
      const subj = allSubjects.find((sub) => sub.id === g.subjectId);
      if (subj) {
        sTotal += g.points * subj.coefficient;
        sMax += subj.maxPoints * subj.coefficient;
      }
    }
    if (sMax > 0) classScores.push({ id: s.id, score: (sTotal / sMax) * 100 });
  }

  const sorted = classScores.sort((a, b) => b.score - a.score);
  const rank = sorted.findIndex((s) => s.id === student.id) + 1;

  const titulaireUsers = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.role, "titulaire"), eq(usersTable.classId, student.classId)));
  const titulaire = titulaireUsers[0] || null;

  res.json({
    studentId: student.id,
    registrationNumber: student.registrationNumber,
    fullName: `${student.lastName} ${student.postnom || ""} ${student.firstName}`.replace(/\s+/g, " ").trim(),
    className: cls?.name || "Inconnu",
    academicYear,
    semester,
    deliberationStatus: delib.status,
    gradesBySubject,
    totalPoints,
    maxTotalPoints,
    percentage,
    rank: rank > 0 ? rank : null,
    totalStudentsInClass: allClassStudents.length,
    passed,
    bonusPoints,
    titulaireUserId: titulaire?.id || null,
    titulaireFullName: titulaire?.fullName || null,
  });
});

export default router;
