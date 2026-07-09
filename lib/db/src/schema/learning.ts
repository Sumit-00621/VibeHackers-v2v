import { pgTable, serial, text, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const learningModulesTable = pgTable("learning_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(20),
  difficulty: text("difficulty").notNull().default("beginner"),
  tags: json("tags").$type<string[]>().notNull().default([]),
  content: text("content"),
  quizQuestions: json("quiz_questions").$type<Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quizResultsTable = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  moduleId: integer("module_id").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  percentage: integer("percentage").notNull(),
  passed: boolean("passed").notNull(),
  timeTakenSeconds: integer("time_taken_seconds"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLearningModuleSchema = createInsertSchema(learningModulesTable).omit({ id: true, createdAt: true });
export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;
export type LearningModule = typeof learningModulesTable.$inferSelect;

export const insertQuizResultSchema = createInsertSchema(quizResultsTable).omit({ id: true, createdAt: true });
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResultsTable.$inferSelect;
