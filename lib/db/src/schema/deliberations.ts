import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deliberationsTable = pgTable("deliberations", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  academicYear: text("academic_year").notNull(),
  semester: text("semester").notNull(),
  status: text("status").notNull().default("brouillon"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: integer("approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const deliberationBonusesTable = pgTable("deliberation_bonuses", {
  id: serial("id").primaryKey(),
  deliberationId: integer("deliberation_id").notNull(),
  studentId: integer("student_id").notNull(),
  bonusPoints: real("bonus_points").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDeliberationSchema = createInsertSchema(deliberationsTable).omit({ id: true, createdAt: true, updatedAt: true, approvedAt: true });
export const insertDeliberationBonusSchema = createInsertSchema(deliberationBonusesTable).omit({ id: true, updatedAt: true });

export type InsertDeliberation = z.infer<typeof insertDeliberationSchema>;
export type Deliberation = typeof deliberationsTable.$inferSelect;
export type DeliberationBonus = typeof deliberationBonusesTable.$inferSelect;
