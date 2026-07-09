import { Router } from "express";
import { db } from "@workspace/db";
import {
  quizResultsTable,
  mentorRequestsTable,
  activityLogsTable,
  scholarshipsTable,
  learningModulesTable,
  conversationsTable,
} from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { calculateConfidenceScore } from "../services/gemini.js";

const router = Router();

// GET /api/dashboard/summary/:userId
router.get("/summary/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
  const [
    quizResults,
    mentorRequests,
    aiSessions,
    totalModulesResult,
    scholarshipsCount,
  ] = await Promise.all([
    db.select().from(quizResultsTable).where(eq(quizResultsTable.userId, userId)),
    db.select().from(mentorRequestsTable).where(eq(mentorRequestsTable.userId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(conversationsTable).where(eq(conversationsTable.userId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(learningModulesTable).where(eq(learningModulesTable.isActive, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(scholarshipsTable).where(eq(scholarshipsTable.isActive, true)),
  ]);

  const completedModuleIds = new Set(quizResults.filter(r => r.passed).map(r => r.moduleId));
  const completedModules = completedModuleIds.size;
  const totalModules = totalModulesResult[0]?.count ?? 0;
  const activeMentorRequests = mentorRequests.filter(r => r.status === "pending" || r.status === "accepted").length;
  const aiSessionsCount = aiSessions[0]?.count ?? 0;

  // Rough profile completeness (would normally come from user profile)
  const profileCompleteness = 60;

  const { score } = calculateConfidenceScore(
    completedModules,
    quizResults.filter(r => r.passed).length,
    mentorRequests.filter(r => r.status === "completed").length,
    aiSessionsCount,
    profileCompleteness
  );

  // Build upcoming deadlines from active scholarships
  const upcomingScholarships = await db
    .select({ title: scholarshipsTable.title, deadline: scholarshipsTable.deadline })
    .from(scholarshipsTable)
    .where(eq(scholarshipsTable.isActive, true))
    .limit(3);

  const upcomingDeadlines = upcomingScholarships
    .filter(s => s.deadline)
    .map(s => ({ title: s.title, deadline: s.deadline!, type: "scholarship" as const }));

  // Weekly goal: complete 2 modules (arbitrary baseline)
  const weeklyGoalProgress = Math.min(100, Math.round((completedModules / 2) * 100));

  res.json({
    userId,
    careerConfidenceScore: score,
    completedModules,
    totalModules,
    activeMentorRequests,
    aiSessionsCount,
    scholarshipsBookmarked: scholarshipsCount[0]?.count ?? 0,
    upcomingDeadlines,
    weeklyGoalProgress,
  });
  } catch (err) {
    req.log.error({ err }, "Dashboard summary failed");
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

// GET /api/dashboard/activity/:userId
router.get("/activity/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
  const items = await db
    .select()
    .from(activityLogsTable)
    .where(eq(activityLogsTable.userId, userId))
    .orderBy(desc(activityLogsTable.createdAt))
    .limit(20);

  res.json({
    items: items.map(item => ({
      id: item.id,
      type: item.type,
      description: item.description,
      timestamp: item.createdAt.toISOString(),
      metadata: item.metadata as { score?: number | null; moduleName?: string | null },
    })),
    total: items.length,
  });
  } catch (err) {
    req.log.error({ err }, "Activity feed failed");
    res.status(500).json({ error: "Failed to load activity data" });
  }
});

export default router;
