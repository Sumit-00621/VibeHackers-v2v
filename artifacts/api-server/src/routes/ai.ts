import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { conversationsTable, activityLogsTable } from "@workspace/db";
import {
  generateCareerAdvice,
  analyzeResume,
  generateInterviewQuestions,
  generateLearningPlan,
  generateScholarshipRecommendations,
  generateFinancialLiteracy,
  calculateConfidenceScore,
} from "../services/gemini.js";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

const router = Router();

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

// POST /api/ai/career-advice
router.post("/career-advice", async (req, res) => {
  const schema = z.object({
    message: z.string().min(1).max(4000),
    sessionId: z.string().nullable().optional(),
    userId: z.string().nullable().optional(),
    careerStage: z.string().nullable().optional(),
    persona: z.string().nullable().optional(),
    history: z.array(ChatMessageSchema).optional().default([]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { message, sessionId, userId, careerStage, persona, history } = parsed.data;

  try {
    const content = await generateCareerAdvice(message, history, { careerStage, persona });
    const newSessionId = sessionId ?? randomUUID();

    if (userId) {
      await db.insert(activityLogsTable).values({
        id: randomUUID(),
        userId,
        type: "ai_chat",
        description: "Had an AI career mentoring session",
        metadata: { sessionId: newSessionId },
      }).onConflictDoNothing();
    }

    res.json({ content, sessionId: newSessionId });
  } catch (err: unknown) {
    req.log.error({ err }, "Career advice generation failed");
    if (err instanceof Error && err.message.includes("GEMINI_API_KEY")) {
      res.status(503).json({ error: "AI service not configured. Please add GEMINI_API_KEY to Replit Secrets." });
    } else {
      res.status(500).json({ error: "AI service temporarily unavailable. Please try again." });
    }
  }
});

// POST /api/ai/resume-feedback
router.post("/resume-feedback", async (req, res) => {
  const schema = z.object({
    resumeText: z.string().min(50).max(10000),
    targetRole: z.string().nullable().optional(),
    userId: z.string().nullable().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input: resume text must be at least 50 characters" });
    return;
  }

  try {
    const analysis = await analyzeResume(parsed.data.resumeText, parsed.data.targetRole);
    res.json(analysis);
  } catch (err) {
    req.log.error({ err }, "Resume analysis failed");
    res.status(500).json({ error: "Resume analysis temporarily unavailable." });
  }
});

// POST /api/ai/interview-questions
router.post("/interview-questions", async (req, res) => {
  const schema = z.object({
    role: z.string().min(1),
    level: z.string().nullable().optional(),
    userId: z.string().nullable().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  try {
    const content = await generateInterviewQuestions(parsed.data.role, parsed.data.level);
    res.json({ content });
  } catch (err) {
    req.log.error({ err }, "Interview questions generation failed");
    res.status(500).json({ error: "AI service temporarily unavailable." });
  }
});

// POST /api/ai/learning-plan
router.post("/learning-plan", async (req, res) => {
  const schema = z.object({
    goals: z.array(z.string()).min(1),
    currentSkills: z.array(z.string()),
    timeframe: z.string().nullable().optional(),
    userId: z.string().nullable().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  try {
    const content = await generateLearningPlan(parsed.data.goals, parsed.data.currentSkills, parsed.data.timeframe);
    res.json({ content });
  } catch (err) {
    req.log.error({ err }, "Learning plan generation failed");
    res.status(500).json({ error: "AI service temporarily unavailable." });
  }
});

// POST /api/ai/scholarship-recommendations
router.post("/scholarship-recommendations", async (req, res) => {
  const schema = z.object({
    profile: z.string().min(1),
    fieldOfStudy: z.string().nullable().optional(),
    careerStage: z.string().nullable().optional(),
    userId: z.string().nullable().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  try {
    const content = await generateScholarshipRecommendations(
      parsed.data.profile,
      parsed.data.fieldOfStudy,
      parsed.data.careerStage
    );
    res.json({ content });
  } catch (err) {
    req.log.error({ err }, "Scholarship recommendations generation failed");
    res.status(500).json({ error: "AI service temporarily unavailable." });
  }
});

// POST /api/ai/financial-literacy
router.post("/financial-literacy", async (req, res) => {
  const schema = z.object({
    topic: z.string().min(1),
    level: z.string().nullable().optional(),
    userId: z.string().nullable().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  try {
    const content = await generateFinancialLiteracy(parsed.data.topic, parsed.data.level);
    res.json({ content });
  } catch (err) {
    req.log.error({ err }, "Financial literacy content generation failed");
    res.status(500).json({ error: "AI service temporarily unavailable." });
  }
});

// POST /api/ai/career-confidence
router.post("/career-confidence", async (req, res) => {
  const schema = z.object({
    userId: z.string().min(1),
    completedModules: z.number().int().min(0),
    quizzesPassed: z.number().int().min(0),
    mentorSessions: z.number().int().min(0),
    aiSessions: z.number().int().min(0),
    profileCompleteness: z.number().int().min(0).max(100),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { userId, completedModules, quizzesPassed, mentorSessions, aiSessions, profileCompleteness } = parsed.data;
  const result = calculateConfidenceScore(completedModules, quizzesPassed, mentorSessions, aiSessions, profileCompleteness);

  const insightMap: Record<string, string> = {
    Expert: "Outstanding! You have demonstrated exceptional engagement. You are well-positioned to mentor others on their STEM journey.",
    Advanced: "Great progress! You are building strong career foundations. Focus on expanding your mentor network to accelerate further.",
    Intermediate: "Solid momentum. Continue completing learning modules and scheduling mentor sessions to build your confidence.",
    Developing: "You are on your way. Completing your first learning module and scheduling a mentor session will unlock your next level.",
    Beginner: "Welcome to SakhiPath! Start with a learning module or chat with the AI mentor to begin your empowerment journey.",
  };

  res.json({
    ...result,
    insights: insightMap[result.level] ?? insightMap.Beginner,
  });
});

// POST /api/ai/conversations
router.post("/conversations", async (req, res) => {
  const schema = z.object({
    userId: z.string().min(1),
    title: z.string().nullable().optional(),
    messages: z.array(ChatMessageSchema).min(1),
    type: z.enum(["career", "resume", "interview", "learning", "financial"]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { userId, title, messages, type } = parsed.data;
  const id = randomUUID();
  const now = new Date();

  try {
    await db.insert(conversationsTable).values({
      id,
      userId,
      title: title ?? `${type.charAt(0).toUpperCase() + type.slice(1)} session`,
      type,
      messages,
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json({
      id,
      userId,
      title: title ?? `${type.charAt(0).toUpperCase() + type.slice(1)} session`,
      type,
      messages,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Save conversation failed");
    res.status(500).json({ error: "Failed to save conversation" });
  }
});

// GET /api/ai/conversations/:sessionId
router.get("/conversations/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, sessionId))
      .limit(1);

    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.json({
      ...conv,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Get conversation history failed");
    res.status(500).json({ error: "Failed to retrieve conversation" });
  }
});

export default router;
