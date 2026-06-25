import { Request, Response, NextFunction } from "express";
import { db, staffTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  staffId?: number;
  staffRole?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const token = auth.slice(7);
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [idStr] = decoded.split(":");
    const id = parseInt(idStr);
    if (isNaN(id)) throw new Error("Invalid token");
    const staff = await db.select().from(staffTable).where(eq(staffTable.id, id)).limit(1);
    if (!staff[0]) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.staffId = staff[0].id;
    req.staffRole = staff[0].role;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
