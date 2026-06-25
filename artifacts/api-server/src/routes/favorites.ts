import { Router } from "express";
import { db, favoritesTable, booksTable, borrowingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();
router.use(authMiddleware);

router.get("/ids", async (req: AuthRequest, res) => {
  try {
    const favs = await db.select().from(favoritesTable).where(eq(favoritesTable.staffId, req.staffId!));
    res.json(favs.map(f => f.bookId));
  } catch (err) {
    logger.error({ err }, "Get favorite ids error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const favs = await db.select().from(favoritesTable).where(eq(favoritesTable.staffId, req.staffId!));
    const bookIds = favs.map(f => f.bookId);
    if (bookIds.length === 0) { res.json([]); return; }

    const borrowed = await db.select({ bookId: borrowingsTable.bookId }).from(borrowingsTable).where(eq(borrowingsTable.status, "borrowed"));
    const borrowedSet = new Set(borrowed.map(b => b.bookId));

    const books = await db.select().from(booksTable);
    const favBooks = books
      .filter(b => bookIds.includes(b.id))
      .map(b => {
        const activeBorrows = borrowedSet.has(b.id) ? 1 : 0;
        const available = Math.max(0, (b.stock ?? 1) - activeBorrows);
        return { ...b, status: available === 0 ? "borrowed" : "available", available, categoryName: null, rackName: null, borrowCount: 0 };
      });
    res.json(favBooks);
  } catch (err) {
    logger.error({ err }, "Get favorites error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { bookId } = req.body as { bookId: number };
    const existing = await db.select().from(favoritesTable)
      .where(and(eq(favoritesTable.staffId, req.staffId!), eq(favoritesTable.bookId, bookId)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(favoritesTable).values({ staffId: req.staffId!, bookId });
    }
    res.status(201).json({ message: "Ditambahkan ke favorit" });
  } catch (err) {
    logger.error({ err }, "Add favorite error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:bookId", async (req: AuthRequest, res) => {
  try {
    const bookId = parseInt(String(req.params.bookId));
    await db.delete(favoritesTable)
      .where(and(eq(favoritesTable.staffId, req.staffId!), eq(favoritesTable.bookId, bookId)));
    res.json({ message: "Dihapus dari favorit" });
  } catch (err) {
    logger.error({ err }, "Remove favorite error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
