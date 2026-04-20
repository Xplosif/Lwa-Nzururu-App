import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const courseAssignmentsTable = pgTable("course_assignments", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  classId: integer("class_id").notNull(),
  academicYear: text("academic_year").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCourseAssignmentSchema = createInsertSchema(courseAssignmentsTable).omit({ id: true, createdAt: true });
export type InsertCourseAssignment = z.infer<typeof insertCourseAssignmentSchema>;
export type CourseAssignment = typeof courseAssignmentsTable.$inferSelect;
