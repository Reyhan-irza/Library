import { Router } from "express";
import { db, borrowingsTable, booksTable, membersTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { logActivity } from "./activities";
import { logger } from "../lib/logger";

const router = Router();
router.use(authMiddleware);

async function generateBorrowCode(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const [cntRes] = await db.select({ cnt: count() }).from(borrowingsTable);
  const num = (Number(cntRes?.cnt ?? 0) + 1).toString().padStart(4, "0");
  return `PJM-${year}${month}-${num}`;
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const { search, status, memberId, bookId, page, limit } = req.query as Record<string, string>;

    const rows = await db
      .select({
        b: borrowingsTable,
        memberName: membersTable.name,
        memberNumber: membersTable.memberNumber,
        bookTitle: booksTable.title,
        bookIsbn: booksTable.isbn,
      })
      .from(borrowingsTable)
      .leftJoin(membersTable, eq(borrowingsTable.memberId, membersTable.id))
      .leftJoin(booksTable, eq(borrowingsTable.bookId, booksTable.id));

    const today = new Date().toISOString().split("T")[0];
    let borrowings = rows.map(r => ({
      ...r.b,
      fine: r.b.fine ? Number(r.b.fine) : 0,
      memberName: r.memberName ?? null,
      memberNumber: r.memberNumber ?? null,
      bookTitle: r.bookTitle ?? null,
      bookIsbn: r.bookIsbn ?? null,
      borrowCode: r.b.borrowCode ?? `PJM-${r.b.id}`,
      status: r.b.status === "borrowed" && r.b.dueDate < today ? "overdue" : r.b.status,
    }));

    if (search) {
      const q = search.toLowerCase();
      borrowings = borrowings.filter(b =>
        (b.memberName ?? "").toLowerCase().includes(q) ||
        (b.bookTitle ?? "").toLowerCase().includes(q) ||
        (b.memberNumber ?? "").toLowerCase().includes(q) ||
        (b.borrowCode ?? "").toLowerCase().includes(q)
      );
    }
    if (status) borrowings = borrowings.filter(b => b.status === status);
    if (memberId) borrowings = borrowings.filter(b => b.memberId === parseInt(memberId));
    if (bookId) borrowings = borrowings.filter(b => b.bookId === parseInt(bookId));

    const total = borrowings.length;
    const off = page ? (parseInt(page) - 1) * (limit ? parseInt(limit) : 15) : 0;
    const lim = limit ? parseInt(limit) : borrowings.length;
    const data = borrowings.slice(off, off + lim);

    res.json({ data, total });
  } catch (err) {
    logger.error({ err }, "List borrowings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { memberId, bookId, dueDate, notes } = req.body as {
      memberId: number; bookId: number; dueDate: string; notes?: string;
    };

    const activeBorrow = await db.select().from(borrowingsTable)
      .where(and(eq(borrowingsTable.bookId, bookId), eq(borrowingsTable.status, "borrowed")))
      .limit(1);
    if (activeBorrow.length > 0) {
      res.status(400).json({ error: "Buku sedang dipinjam" });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const borrowCode = await generateBorrowCode();
    const [borrow] = await db.insert(borrowingsTable).values({
      borrowCode,
      memberId,
      bookId,
      borrowDate: today,
      dueDate,
      status: "borrowed",
      notes: notes ?? null,
    }).returning();

    const member = await db.select().from(membersTable).where(eq(membersTable.id, memberId)).limit(1);
    const book = await db.select().from(booksTable).where(eq(booksTable.id, bookId)).limit(1);

    await logActivity("borrow", `${member[0]?.name ?? "Anggota"} meminjam "${book[0]?.title ?? "buku"}"`, req.staffId);
    res.status(201).json({
      ...borrow,
      fine: 0,
      borrowCode,
      memberName: member[0]?.name ?? null,
      memberNumber: member[0]?.memberNumber ?? null,
      bookTitle: book[0]?.title ?? null,
      bookIsbn: book[0]?.isbn ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Create borrowing error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/return", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const borrow = await db.select().from(borrowingsTable).where(eq(borrowingsTable.id, id)).limit(1);
    if (!borrow[0]) { res.status(404).json({ error: "Not found" }); return; }

    const today = new Date().toISOString().split("T")[0];
    const dueDate = new Date(borrow[0].dueDate);
    const returnDate = new Date(today);
    const daysLate = Math.max(0, Math.floor((returnDate.getTime() - dueDate.getTime()) / 86400000));
    const fine = daysLate * 1000;

    const [updated] = await db.update(borrowingsTable)
      .set({ status: "returned", returnDate: today, fine: fine.toString() })
      .where(eq(borrowingsTable.id, id))
      .returning();

    if (fine > 0) {
      await db.update(membersTable)
        .set({ fine: fine.toString() })
        .where(eq(membersTable.id, borrow[0].memberId));
    }

    const member = await db.select().from(membersTable).where(eq(membersTable.id, borrow[0].memberId)).limit(1);
    const book = await db.select().from(booksTable).where(eq(booksTable.id, borrow[0].bookId)).limit(1);

    await logActivity("return", `${member[0]?.name ?? "Anggota"} mengembalikan "${book[0]?.title ?? "buku"}"`, req.staffId);
    res.json({
      ...updated,
      fine: Number(updated.fine ?? 0),
      borrowCode: updated.borrowCode ?? `PJM-${updated.id}`,
      memberName: member[0]?.name ?? null,
      memberNumber: member[0]?.memberNumber ?? null,
      bookTitle: book[0]?.title ?? null,
      bookIsbn: book[0]?.isbn ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Return book error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
