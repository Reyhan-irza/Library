import { db, activitiesTable } from "@workspace/db";

export async function logActivity(type: string, description: string, staffId?: number) {
  try {
    await db.insert(activitiesTable).values({ type, description, staffId: staffId ?? null });
  } catch {
    // best effort
  }
}
