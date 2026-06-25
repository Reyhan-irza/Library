import { Router } from "express";
import { db, borrowingsTable, membersTable, booksTable } from "@workspace/db";
import { count, gte, lte, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();
router.use(authMiddleware);

router.get("/summary", async (req, res) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    const conditions = [];
    if (startDate) conditions.push(gte(borrowingsTable.borrowDate, startDate));
    if (endDate) conditions.push(lte(borrowingsTable.borrowDate, endDate));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const all = await db.select().from(borrowingsTable).where(where);
    const today = new Date().toISOString().split("T")[0];

    const totalBorrowings = all.length;
    const totalReturned = all.filter(b => b.status === "returned").length;
    const totalOverdue = all.filter(b => b.status === "borrowed" && b.dueDate < today).length;
    const totalFine = all.reduce((sum, b) => sum + Number(b.fine ?? 0), 0);

    const [totalMembersRes] = await db.select({ cnt: count() }).from(membersTable);
    const [totalBooksRes] = await db.select({ cnt: count() }).from(booksTable);

    const months: { month: string; borrowed: number; returned: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const end = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, "0")}-${String(endD.getDate()).padStart(2, "0")}`;
      const monthName = d.toLocaleString("id-ID", { month: "short" });
      const monthBorrowings = all.filter(b => b.borrowDate >= start && b.borrowDate <= end);
      months.push({
        month: monthName,
        borrowed: monthBorrowings.length,
        returned: monthBorrowings.filter(b => b.status === "returned").length,
      });
    }

    res.json({
      totalBorrowings,
      totalReturned,
      totalOverdue,
      totalFine,
      totalMembers: Number(totalMembersRes?.cnt ?? 0),
      totalBooks: Number(totalBooksRes?.cnt ?? 0),
      chartData: months,
    });
  } catch (err) {
    logger.error({ err }, "Reports summary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
