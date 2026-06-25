import { Router } from "express";
import { db, membersTable, borrowingsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { logActivity } from "./activities";
import { logger } from "../lib/logger";

const router = Router();
router.use(authMiddleware);

async function generateMemberNumber(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const existing = await db.select().from(membersTable);
  const num = (existing.length + 1).toString().padStart(4, "0");
  return `MB${year}${num}`;
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const { search, status, className } = req.query as Record<string, string>;

    const borrowCounts = await db
      .select({ memberId: borrowingsTable.memberId, cnt: count().as("cnt") })
      .from(borrowingsTable)
      .where(eq(borrowingsTable.status, "borrowed"))
      .groupBy(borrowingsTable.memberId);
    const countMap = new Map(borrowCounts.map(r => [r.memberId, Number(r.cnt)]));

    let members = await db.select().from(membersTable);
    if (search) {
      const q = search.toLowerCase();
      members = members.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.memberNumber.toLowerCase().includes(q) ||
        (m.email ?? "").toLowerCase().includes(q) ||
        (m.className ?? "").toLowerCase().includes(q)
      );
    }
    if (status) members = members.filter(m => m.status === status);
    if (className) members = members.filter(m => m.className === className);

    const data = members.map(m => ({
      ...m,
      fine: m.fine ? Number(m.fine) : 0,
      borrowCount: countMap.get(m.id) ?? 0,
    }));

    res.json({ data, total: data.length });
  } catch (err) {
    logger.error({ err }, "List members error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, address, className } = req.body as {
      name: string; email?: string; phone?: string; address?: string; className?: string;
    };
    const memberNumber = await generateMemberNumber();
    const [member] = await db.insert(membersTable).values({
      memberNumber,
      name,
      email: email ?? null,
      phone: phone ?? null,
      address: address ?? null,
      className: className ?? null,
      status: "active",
    }).returning();
    await logActivity("create", `Anggota "${member.name}" (${member.memberNumber}) ditambahkan`, req.staffId);
    res.status(201).json({ ...member, fine: 0, borrowCount: 0 });
  } catch (err) {
    logger.error({ err }, "Create member error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const body = req.body as { name?: string; email?: string; phone?: string; address?: string; status?: string; className?: string };
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.email !== undefined) update.email = body.email;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.address !== undefined) update.address = body.address;
    if (body.status !== undefined) update.status = body.status;
    if (body.className !== undefined) update.className = body.className;
    const [member] = await db.update(membersTable).set(update).where(eq(membersTable.id, id)).returning();
    if (!member) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...member, fine: member.fine ? Number(member.fine) : 0, borrowCount: 0 });
  } catch (err) {
    logger.error({ err }, "Update member error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [member] = await db.delete(membersTable).where(eq(membersTable.id, id)).returning();
    if (!member) { res.status(404).json({ error: "Not found" }); return; }
    await logActivity("delete", `Anggota "${member.name}" dihapus`, req.staffId);
    res.json({ message: "Anggota berhasil dihapus" });
  } catch (err) {
    logger.error({ err }, "Delete member error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
