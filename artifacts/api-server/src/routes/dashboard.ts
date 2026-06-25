import { Router } from "express";
import { db, booksTable, membersTable, borrowingsTable, activitiesTable } from "@workspace/db";
import { eq, count, desc, sql, and, gte, lte } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();
router.use(authMiddleware);

router.get("/stats", async (_req, res) => {
  try {
    const [totalBooksRes] = await db.select({ cnt: count() }).from(booksTable);
    const [totalMembersRes] = await db.select({ cnt: count() }).from(membersTable);
    const [borrowedRes] = await db.select({ cnt: count() }).from(borrowingsTable).where(eq(borrowingsTable.status, "borrowed"));
    const [fineRes] = await db.select({ total: sql<number>`coalesce(sum(fine::numeric), 0)` }).from(borrowingsTable);

    const today = new Date().toISOString().split("T")[0];
    const [overdueRes] = await db.select({ cnt: count() }).from(borrowingsTable)
      .where(and(eq(borrowingsTable.status, "borrowed"), sql`${borrowingsTable.dueDate} < ${today}`));

    const totalBooks = Number(totalBooksRes?.cnt ?? 0);
    const totalBorrowed = Number(borrowedRes?.cnt ?? 0);
    const totalAvailable = totalBooks - totalBorrowed;

    res.json({
      totalBooks,
      totalMembers: Number(totalMembersRes?.cnt ?? 0),
      totalBorrowed,
      totalAvailable,
      totalFine: Number(fineRes?.total ?? 0),
      overdueCount: Number(overdueRes?.cnt ?? 0),
    });
  } catch (err) {
    logger.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/chart", async (_req, res) => {
  try {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const end = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, "0")}-${String(endD.getDate()).padStart(2, "0")}`;
      const monthName = d.toLocaleString("id-ID", { month: "short" });

      const [borrowed] = await db.select({ cnt: count() }).from(borrowingsTable)
        .where(and(gte(borrowingsTable.borrowDate, start), lte(borrowingsTable.borrowDate, end)));
      const [returned] = await db.select({ cnt: count() }).from(borrowingsTable)
        .where(and(gte(borrowingsTable.returnDate, start), lte(borrowingsTable.returnDate, end), eq(borrowingsTable.status, "returned")));

      months.push({ month: monthName, borrowed: Number(borrowed?.cnt ?? 0), returned: Number(returned?.cnt ?? 0) });
    }
    res.json(months);
  } catch (err) {
    logger.error({ err }, "Dashboard chart error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/activities", async (_req, res) => {
  try {
    const activities = await db.select().from(activitiesTable).orderBy(desc(activitiesTable.createdAt)).limit(20);
    res.json(activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
  } catch (err) {
    logger.error({ err }, "Dashboard activities error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/top-books", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const borrowCounts = await db
      .select({ bookId: borrowingsTable.bookId, cnt: count().as("cnt") })
      .from(borrowingsTable)
      .groupBy(borrowingsTable.bookId)
      .orderBy(desc(sql`cnt`))
      .limit(limit);

    const books = await db.select().from(booksTable);
    const bookMap = new Map(books.map(b => [b.id, b]));

    const topBooks = borrowCounts.map(r => {
      const book = bookMap.get(r.bookId);
      return {
        id: r.bookId,
        title: book?.title ?? "Unknown",
        author: book?.author ?? "",
        coverUrl: book?.coverUrl ?? null,
        borrowCount: Number(r.cnt),
      };
    });

    res.json(topBooks);
  } catch (err) {
    logger.error({ err }, "Top books error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
