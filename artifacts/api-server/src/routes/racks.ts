import { Router } from "express";
import { db, racksTable, booksTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();
router.use(authMiddleware);

router.get("/", async (_req, res) => {
  try {
    const bookCounts = await db
      .select({ rackId: booksTable.rackId, cnt: count().as("cnt") })
      .from(booksTable)
      .groupBy(booksTable.rackId);
    const countMap = new Map(bookCounts.map(r => [r.rackId, Number(r.cnt)]));

    const racks = await db.select().from(racksTable);
    res.json(racks.map(r => ({ ...r, bookCount: countMap.get(r.id) ?? 0 })));
  } catch (err) {
    logger.error({ err }, "List racks error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { name, location, description } = req.body as { name: string; location?: string; description?: string };
    const [rack] = await db.insert(racksTable).values({ name, location: location ?? null, description: description ?? null }).returning();
    res.status(201).json({ ...rack, bookCount: 0 });
  } catch (err) {
    logger.error({ err }, "Create rack error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { name, location, description } = req.body as { name?: string; location?: string; description?: string };
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (location !== undefined) update.location = location;
    if (description !== undefined) update.description = description;
    const [rack] = await db.update(racksTable).set(update).where(eq(racksTable.id, id)).returning();
    if (!rack) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...rack, bookCount: 0 });
  } catch (err) {
    logger.error({ err }, "Update rack error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [rack] = await db.delete(racksTable).where(eq(racksTable.id, id)).returning();
    if (!rack) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ message: "Rak berhasil dihapus" });
  } catch (err) {
    logger.error({ err }, "Delete rack error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
