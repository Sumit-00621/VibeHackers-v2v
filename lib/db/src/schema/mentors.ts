import { pgTable, serial, text, integer, real, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mentorsTable = pgTable("mentors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  specializations: json("specializations").$type<string[]>().notNull().default([]),
  bio: text("bio").notNull(),
  yearsExperience: integer("years_experience").notNull().default(0),
  rating: real("rating").notNull().default(5.0),
  totalSessions: integer("total_sessions").notNull().default(0),
  availability: text("availability").notNull().default("available"),
  linkedinUrl: text("linkedin_url"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const mentorRequestsTable = pgTable("mentor_requests", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  mentorId: integer("mentor_id").notNull(),
  message: text("message").notNull(),
  preferredDate: text("preferred_date"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMentorSchema = createInsertSchema(mentorsTable).omit({ id: true, createdAt: true });
export type InsertMentor = z.infer<typeof insertMentorSchema>;
export type Mentor = typeof mentorsTable.$inferSelect;

export const insertMentorRequestSchema = createInsertSchema(mentorRequestsTable).omit({ id: true, createdAt: true });
export type InsertMentorRequest = z.infer<typeof insertMentorRequestSchema>;
export type MentorRequest = typeof mentorRequestsTable.$inferSelect;
