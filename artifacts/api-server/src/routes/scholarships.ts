import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { scholarshipsTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";

const router = Router();

// GET /api/scholarships
router.get("/", async (req, res) => {
  const schema = z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  });

  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { category, search, limit, offset } = parsed.data;

  const conditions = [eq(scholarshipsTable.isActive, true)];
  if (category) conditions.push(eq(scholarshipsTable.category, category));
  if (search) {
    conditions.push(
      sql`(${scholarshipsTable.title} ilike ${`%${search}%`} OR ${scholarshipsTable.provider} ilike ${`%${search}%`})`
    );
  }

  const where = and(...conditions);

  const [items, countResult] = await Promise.all([
    db.select().from(scholarshipsTable).where(where).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(scholarshipsTable).where(where),
  ]);

  res.json({ items, total: countResult[0]?.count ?? 0 });
});

// GET /api/scholarships/:id
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid scholarship ID" });
    return;
  }

  const [scholarship] = await db
    .select()
    .from(scholarshipsTable)
    .where(eq(scholarshipsTable.id, id))
    .limit(1);

  if (!scholarship) {
    res.status(404).json({ error: "Scholarship not found" });
    return;
  }

  res.json(scholarship);
});

export default router;
