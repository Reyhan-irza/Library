import { Router } from "express";
import { db, booksTable, categoriesTable, racksTable, borrowingsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { logActivity } from "./activities";
import { logger } from "../lib/logger";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const { search, status, categoryId, rackId, limit, offset } = req.query as Record<string, string>;

    const borrowedBookIds = await db
      .select({ bookId: borrowingsTable.bookId })
      .from(borrowingsTable)
      .where(eq(borrowingsTable.status, "borrowed"));
    const borrowedIds = new Set(borrowedBookIds.map(b => b.bookId));

    const borrowCountSub = db
      .select({ bookId: borrowingsTable.bookId, cnt: count().as("cnt") })
      .from(borrowingsTable)
      .groupBy(borrowingsTable.bookId)
      .as("borrow_counts");

    const rows = await db
      .select({
        book: booksTable,
        categoryName: categoriesTable.name,
        rackName: racksTable.name,
        borrowCount: borrowCountSub.cnt,
      })
      .from(booksTable)
      .leftJoin(categoriesTable, eq(booksTable.categoryId, categoriesTable.id))
      .leftJoin(racksTable, eq(booksTable.rackId, racksTable.id))
      .leftJoin(borrowCountSub, eq(booksTable.id, borrowCountSub.bookId));

    let books = rows.map(r => {
      const activeBorrows = borrowedIds.has(r.book.id) ? 1 : 0;
      const available = Math.max(0, (r.book.stock ?? 1) - activeBorrows);
      return {
        ...r.book,
        categoryName: r.categoryName ?? null,
        rackName: r.rackName ?? null,
        borrowCount: Number(r.borrowCount ?? 0),
        status: available === 0 ? "borrowed" : "available",
        available,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      books = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q)
      );
    }
    if (status) books = books.filter(b => b.status === status);
    if (categoryId) books = books.filter(b => b.categoryId === parseInt(categoryId));
    if (rackId) books = books.filter(b => b.rackId === parseInt(rackId));

    const total = books.length;
    const off = offset ? parseInt(offset) : 0;
    const lim = limit ? parseInt(limit) : books.length;
    const data = books.slice(off, off + lim);

    res.json({ data, total });
  } catch (err) {
    logger.error({ err }, "List books error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/public", async (req, res) => {
  try {
    const { search, categoryId } = req.query as Record<string, string>;

    const borrowedBookIds = await db
      .select({ bookId: borrowingsTable.bookId })
      .from(borrowingsTable)
      .where(eq(borrowingsTable.status, "borrowed"));
    const borrowedIds = new Set(borrowedBookIds.map(b => b.bookId));

    const rows = await db
      .select({
        book: booksTable,
        categoryName: categoriesTable.name,
      })
      .from(booksTable)
      .leftJoin(categoriesTable, eq(booksTable.categoryId, categoriesTable.id));

    let books = rows.map(r => {
      const activeBorrows = borrowedIds.has(r.book.id) ? 1 : 0;
      const available = Math.max(0, (r.book.stock ?? 1) - activeBorrows);
      return {
        id: r.book.id,
        isbn: r.book.isbn,
        title: r.book.title,
        author: r.book.author,
        publisher: r.book.publisher,
        year: r.book.year,
        stock: r.book.stock,
        coverUrl: r.book.coverUrl,
        description: r.book.description,
        categoryName: r.categoryName ?? null,
        status: available === 0 ? "borrowed" : "available",
        available,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      books = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q)
      );
    }
    if (categoryId) books = books.filter(b => {
      const row = rows.find(r => r.book.id === b.id);
      return row?.book.categoryId === parseInt(categoryId);
    });

    res.json({ data: books, total: books.length });
  } catch (err) {
    logger.error({ err }, "Public books error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = req.body;
    const [book] = await db.insert(booksTable).values({
      isbn: body.isbn,
      title: body.title,
      author: body.author,
      publisher: body.publisher ?? null,
      year: body.year ?? null,
      stock: body.stock ?? 1,
      description: body.description ?? null,
      pages: body.pages ?? null,
      categoryId: body.categoryId ?? null,
      rackId: body.rackId ?? null,
      coverUrl: body.coverUrl ?? null,
    }).returning();
    await logActivity("create", `Buku "${book.title}" ditambahkan`, req.staffId);
    res.status(201).json({ ...book, status: "available", available: book.stock ?? 1, categoryName: null, rackName: null, borrowCount: 0 });
  } catch (err) {
    logger.error({ err }, "Create book error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const body = req.body;
    const update: Record<string, unknown> = {};
    if (body.isbn !== undefined) update.isbn = body.isbn;
    if (body.title !== undefined) update.title = body.title;
    if (body.author !== undefined) update.author = body.author;
    if (body.publisher !== undefined) update.publisher = body.publisher;
    if (body.year !== undefined) update.year = body.year;
    if (body.stock !== undefined) update.stock = body.stock;
    if (body.description !== undefined) update.description = body.description;
    if (body.pages !== undefined) update.pages = body.pages;
    if (body.categoryId !== undefined) update.categoryId = body.categoryId;
    if (body.rackId !== undefined) update.rackId = body.rackId;
    if (body.coverUrl !== undefined) update.coverUrl = body.coverUrl;

    const [book] = await db.update(booksTable).set(update).where(eq(booksTable.id, id)).returning();
    if (!book) { res.status(404).json({ error: "Not found" }); return; }
    await logActivity("update", `Buku "${book.title}" diperbarui`, req.staffId);
    res.json({ ...book, status: "available", available: book.stock ?? 1, categoryName: null, rackName: null, borrowCount: 0 });
  } catch (err) {
    logger.error({ err }, "Update book error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [book] = await db.delete(booksTable).where(eq(booksTable.id, id)).returning();
    if (!book) { res.status(404).json({ error: "Not found" }); return; }
    await logActivity("delete", `Buku "${book.title}" dihapus`, req.staffId);
    res.json({ message: "Buku berhasil dihapus" });
  } catch (err) {
    logger.error({ err }, "Delete book error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
