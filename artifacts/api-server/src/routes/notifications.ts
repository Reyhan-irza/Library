import { Router } from "express";
import { db, borrowingsTable, membersTable, booksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();
router.use(authMiddleware);

router.get("/", async (_req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const overdue = await db
      .select({ b: borrowingsTable, memberName: membersTable.name, bookTitle: booksTable.title })
      .from(borrowingsTable)
      .leftJoin(membersTable, eq(borrowingsTable.memberId, membersTable.id))
      .leftJoin(booksTable, eq(borrowingsTable.bookId, booksTable.id))
      .where(eq(borrowingsTable.status, "borrowed"));

    const items = overdue
      .filter(r => r.b.dueDate < today)
      .slice(0, 10)
      .map((r) => ({
        id: r.b.id,
        title: "Peminjaman Terlambat",
        message: `${r.memberName ?? "Anggota"} belum mengembalikan "${r.bookTitle ?? "buku"}"`,
        type: "overdue",
        read: false,
        createdAt: r.b.dueDate,
      }));

    res.json({ unreadCount: items.length, items });
  } catch (err) {
    logger.error({ err }, "Notifications error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
