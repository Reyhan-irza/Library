import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const racksTable = pgTable("racks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRackSchema = createInsertSchema(racksTable).omit({ id: true, createdAt: true });
export type InsertRack = z.infer<typeof insertRackSchema>;
export type Rack = typeof racksTable.$inferSelect;
