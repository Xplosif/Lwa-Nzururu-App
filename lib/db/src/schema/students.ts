import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  registrationNumber: text("registration_number").notNull().unique(),
  lastName: text("last_name").notNull(),
  postnom: text("postnom"),
  firstName: text("first_name").notNull(),
  gender: text("gender").notNull(),
  dateOfBirth: text("date_of_birth"),
  placeOfBirth: text("place_of_birth"),
  fatherName: text("father_name"),
  motherName: text("mother_name"),
  fonction: text("fonction"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  confession: text("confession"),
  ecoleProvenance: text("ecole_provenance"),
  bulletinsPresentes: text("bulletins_presentes"),
  pourcentagePrecedent: real("pourcentage_precedent"),
  classId: integer("class_id").notNull(),
  academicYear: text("academic_year").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
