import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { mentorsTable, mentorRequestsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";

const router = Router();

// GET /api/mentors
router.get("/", async (req, res) => {
  const schema = z.object({
    specialization: z.string().optional(),
    search: z.string().optional(),
  });

  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { specialization, search } = parsed.data;

  let items = await db.select().from(mentorsTable);

  if (specialization) {
    items = items.filter(m =>
      Array.isArray(m.specializations) &&
      m.specializations.some((s: string) => s.toLowerCase().includes(specialization.toLowerCase()))
    );
  }
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.organization.toLowerCase().includes(q)
    );
  }

  res.json({ items, total: items.length });
});

// POST /api/mentors/requests
router.post("/requests", async (req, res) => {
  const schema = z.object({
    userId: z.string().min(1),
    mentorId: z.number().int().positive(),
    message: z.string().min(10).max(1000),
    preferredDate: z.string().nullable().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input: message must be at least 10 characters" });
    return;
  }

  const { userId, mentorId, message, preferredDate } = parsed.data;

  const [request] = await db
    .insert(mentorRequestsTable)
    .values({ userId, mentorId, message, preferredDate: preferredDate ?? null, status: "pending" })
    .returning();

  res.status(201).json({
    ...request,
    createdAt: request.createdAt.toISOString(),
  });
});

// GET /api/mentors/requests/:userId
router.get("/requests/:userId", async (req, res) => {
  const { userId } = req.params;

  const items = await db
    .select()
    .from(mentorRequestsTable)
    .where(eq(mentorRequestsTable.userId, userId))
    .orderBy(mentorRequestsTable.createdAt);

  res.json({
    items: items.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
    total: items.length,
  });
});

export default router;
