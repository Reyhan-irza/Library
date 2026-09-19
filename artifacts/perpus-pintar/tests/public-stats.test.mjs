import assert from "node:assert/strict";
import { test } from "node:test";
import { parseLandingStats } from "../src/lib/public-stats.ts";

const stats = {
  totalBooks: 42,
  totalMembers: 17,
  totalBorrowings: 63,
  availableBooks: 31,
};

test("preserves exact library aggregates, without invented minimums", () => {
  assert.deepEqual(parseLandingStats(stats), stats);
});

test("accepts a genuinely empty library", () => {
  const empty = { totalBooks: 0, totalMembers: 0, totalBorrowings: 0, availableBooks: 0 };
  assert.deepEqual(parseLandingStats(empty), empty);
});

test("does not convert missing, denied, or partial data into zero", () => {
  for (const value of [null, undefined, [], {}, { error: "permission denied" }, { totalBooks: 42 }]) {
    assert.throws(() => parseLandingStats(value));
  }
});

test("rejects invalid, negative, fractional, and unsafe count values", () => {
  for (const value of ["42", null, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => parseLandingStats({ ...stats, totalMembers: value }));
  }
});

test("available titles cannot exceed total titles", () => {
  assert.throws(() => parseLandingStats({ ...stats, availableBooks: 43 }));
});

test("does not pass through unexpected private data", () => {
  assert.deepEqual(parseLandingStats({ ...stats, memberRecords: ["private"] }), stats);
});