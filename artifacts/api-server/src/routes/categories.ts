import { Router } from "express";
import { db, categoriesTable, booksTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();
router.use(authMiddleware);

router.get("/", async (_req, res) => {
  try {
    const bookCounts = await db
      .select({ categoryId: booksTable.categoryId, cnt: count().as("cnt") })
      .from(booksTable)
      .groupBy(booksTable.categoryId);
    const countMap = new Map(bookCounts.map(r => [r.categoryId, Number(r.cnt)]));

    const cats = await db.select().from(categoriesTable);
    res.json(cats.map(c => ({ ...c, bookCount: countMap.get(c.id) ?? 0 })));
  } catch (err) {
    logger.error({ err }, "List categories error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body as { name: string; description?: string };
    const [cat] = await db.insert(categoriesTable).values({ name, description: description ?? null }).returning();
    res.status(201).json({ ...cat, bookCount: 0 });
  } catch (err) {
    logger.error({ err }, "Create category error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { name, description } = req.body as { name?: string; description?: string };
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    const [cat] = await db.update(categoriesTable).set(update).where(eq(categoriesTable.id, id)).returning();
    if (!cat) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...cat, bookCount: 0 });
  } catch (err) {
    logger.error({ err }, "Update category error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [cat] = await db.delete(categoriesTable).where(eq(categoriesTable.id, id)).returning();
    if (!cat) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ message: "Kategori berhasil dihapus" });
  } catch (err) {
    logger.error({ err }, "Delete category error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
