import { Router } from "express";
import { db, staffTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const staff = await db.select().from(staffTable).where(eq(staffTable.id, req.staffId!)).limit(1);
    if (!staff[0]) { res.status(404).json({ error: "Not found" }); return; }
    const u = staff[0];
    res.json({ id: u.id, username: u.username, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt });
  } catch (err) {
    logger.error({ err }, "Get me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/change-password", async (req: AuthRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };
    const staff = await db.select().from(staffTable).where(eq(staffTable.id, req.staffId!)).limit(1);
    if (!staff[0] || staff[0].password !== oldPassword) {
      res.status(400).json({ error: "Password lama tidak sesuai" });
      return;
    }
    await db.update(staffTable).set({ password: newPassword }).where(eq(staffTable.id, req.staffId!));
    res.json({ message: "Password berhasil diubah" });
  } catch (err) {
    logger.error({ err }, "Change password error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
