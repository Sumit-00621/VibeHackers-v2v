import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { learningModulesTable, quizResultsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

// GET /api/learning/modules
router.get("/modules", async (req, res) => {
  const schema = z.object({
    category: z.string().optional(),
  });

  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { category } = parsed.data;

  const conditions = [eq(learningModulesTable.isActive, true)];
  if (category) conditions.push(eq(learningModulesTable.category, category));

  const items = await db
    .select()
    .from(learningModulesTable)
    .where(and(...conditions));

  res.json({ items, total: items.length });
});

// GET /api/learning/modules/:id
router.get("/modules/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid module ID" });
    return;
  }

  const [module_] = await db
    .select()
    .from(learningModulesTable)
    .where(eq(learningModulesTable.id, id))
    .limit(1);

  if (!module_) {
    res.status(404).json({ error: "Learning module not found" });
    return;
  }

  res.json(module_);
});

// POST /api/learning/quiz-results
router.post("/quiz-results", async (req, res) => {
  const schema = z.object({
    userId: z.string().min(1),
    moduleId: z.number().int().positive(),
    score: z.number().int().min(0),
    totalQuestions: z.number().int().positive(),
    timeTakenSeconds: z.number().int().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { userId, moduleId, score, totalQuestions, timeTakenSeconds } = parsed.data;
  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = percentage >= 70;

  const [result] = await db
    .insert(quizResultsTable)
    .values({ userId, moduleId, score, totalQuestions, percentage, passed, timeTakenSeconds })
    .returning();

  res.status(201).json({
    ...result,
    createdAt: result.createdAt.toISOString(),
  });
});

// GET /api/learning/progress/:userId
router.get("/progress/:userId", async (req, res) => {
  const { userId } = req.params;

  const results = await db
    .select()
    .from(quizResultsTable)
    .where(eq(quizResultsTable.userId, userId))
    .orderBy(quizResultsTable.createdAt);

  const totalModules = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(learningModulesTable)
    .where(eq(learningModulesTable.isActive, true));

  const completedModuleIds = new Set(results.filter(r => r.passed).map(r => r.moduleId));
  const completedModules = completedModuleIds.size;
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
    : 0;

  // Award badges
  const badges: string[] = [];
  if (completedModules >= 1) badges.push("First Step");
  if (completedModules >= 3) badges.push("Learner");
  if (completedModules >= 5) badges.push("Scholar");
  if (completedModules >= 10) badges.push("Expert");
  if (avgScore >= 90) badges.push("High Achiever");
  if (results.some(r => r.timeTakenSeconds && r.timeTakenSeconds < 120)) badges.push("Speed Learner");

  const recentResults = results.slice(-5).reverse().map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  res.json({
    userId,
    completedModules,
    totalModules: totalModules[0]?.count ?? 0,
    averageScore: avgScore,
    badges,
    recentResults,
  });
});

export default router;
