import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scholarshipsTable = pgTable("scholarships", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  provider: text("provider").notNull(),
  amount: text("amount").notNull(),
  deadline: text("deadline"),
  eligibility: text("eligibility").notNull(),
  category: text("category").notNull(),
  applicationUrl: text("application_url"),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScholarshipSchema = createInsertSchema(scholarshipsTable).omit({ id: true, createdAt: true });
export type InsertScholarship = z.infer<typeof insertScholarshipSchema>;
export type Scholarship = typeof scholarshipsTable.$inferSelect;
