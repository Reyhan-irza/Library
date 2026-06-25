import { pgTable, serial, integer, text, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { membersTable } from "./members";
import { booksTable } from "./books";

export const borrowingsTable = pgTable("borrowings", {
  id: serial("id").primaryKey(),
  borrowCode: text("borrow_code"),
  memberId: integer("member_id").notNull().references(() => membersTable.id),
  bookId: integer("book_id").notNull().references(() => booksTable.id),
  borrowDate: date("borrow_date", { mode: "string" }).notNull(),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  returnDate: date("return_date", { mode: "string" }),
  status: text("status").notNull().default("borrowed"),
  fine: numeric("fine", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBorrowingSchema = createInsertSchema(borrowingsTable).omit({ id: true, createdAt: true });
export type InsertBorrowing = z.infer<typeof insertBorrowingSchema>;
export type Borrowing = typeof borrowingsTable.$inferSelect;
