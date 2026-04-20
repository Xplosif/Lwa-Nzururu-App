import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const archivesTable = pgTable("archives", {
  id: serial("id").primaryKey(),
  academicYear: text("academic_year").notNull().unique(),
  totalStudents: integer("total_students").notNull().default(0),
  totalClasses: integer("total_classes").notNull().default(0),
  overallPassRate: real("overall_pass_rate").notNull().default(0),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArchiveSchema = createInsertSchema(archivesTable).omit({ id: true, archivedAt: true });
export type InsertArchive = z.infer<typeof insertArchiveSchema>;
export type Archive = typeof archivesTable.$inferSelect;
