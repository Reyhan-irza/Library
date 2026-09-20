export interface LandingStats {
  totalBooks: number;
  totalMembers: number;
  totalBorrowings: number;
  availableBooks: number;
}

/**
 * A missing/blocked response is not an empty library. Validate the complete
 * aggregate response before letting the public UI display any of its counts.
 */
export function parseLandingStats(payload: unknown): LandingStats {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Data statistik perpustakaan belum tersedia.");
  }

  const row = payload as Record<string, unknown>;
  function count(key: keyof LandingStats): number {
    const value = row[key];
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
      throw new Error("Data statistik perpustakaan tidak valid.");
    }
    return value;
  }

  const stats = {
    totalBooks: count("totalBooks"),
    totalMembers: count("totalMembers"),
    totalBorrowings: count("totalBorrowings"),
    availableBooks: count("availableBooks"),
  };
  if (stats.availableBooks > stats.totalBooks) {
    throw new Error("Data statistik perpustakaan tidak konsisten.");
  }
  return stats;
}