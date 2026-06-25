import { Router } from "express";
import { db, staffTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();
router.use(authMiddleware);

const toPublic = (s: typeof staffTable.$inferSelect) => ({
  id: s.id, username: s.username, name: s.name, email: s.email, role: s.role, createdAt: s.createdAt,
});

router.get("/", async (_req, res) => {
  try {
    const staff = await db.select().from(staffTable);
    res.json(staff.map(toPublic));
  } catch (err) {
    logger.error({ err }, "List staff error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { username, password, name, email, role } = req.body as {
      username: string; password: string; name: string; email?: string; role: string;
    };
    const [s] = await db.insert(staffTable).values({
      username, password, name, email: email ?? null, role,
    }).returning();
    res.status(201).json(toPublic(s));
  } catch (err) {
    logger.error({ err }, "Create staff error");
    res.status(500).json({ error: "Gagal menambahkan petugas" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { password, name, email, role } = req.body as { password?: string; name?: string; email?: string; role?: string };
    const update: Record<string, unknown> = {};
    if (password) update.password = password;
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (role !== undefined) update.role = role;
    const [s] = await db.update(staffTable).set(update).where(eq(staffTable.id, id)).returning();
    if (!s) { res.status(404).json({ error: "Not found" }); return; }
    res.json(toPublic(s));
  } catch (err) {
    logger.error({ err }, "Update staff error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    if (id === req.staffId) { res.status(400).json({ error: "Tidak bisa menghapus akun sendiri" }); return; }
    const [s] = await db.delete(staffTable).where(eq(staffTable.id, id)).returning();
    if (!s) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ message: "Petugas berhasil dihapus" });
  } catch (err) {
    logger.error({ err }, "Delete staff error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
