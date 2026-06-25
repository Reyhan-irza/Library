import { Router } from "express";
import { db, staffTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }
    const staff = await db.select().from(staffTable).where(eq(staffTable.username, username)).limit(1);
    if (!staff[0] || staff[0].password !== password) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const user = staff[0];
    const token = Buffer.from(`${user.id}:${user.username}:${user.role}`).toString("base64");
    res.json({
      token,
      user: { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

export default router;
