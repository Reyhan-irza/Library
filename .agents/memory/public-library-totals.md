---
name: Truthful public library totals
description: Privacy and truthfulness constraints when showing unauthenticated library statistics.
---

Public totals must expose only aggregate counts while keeping member and borrowing rows private. Unknown/unavailable data must not render as zero, and totals must never be filled with invented numbers.

**Why:** Anonymous queries subject to row-level security can succeed with HTTP 200 and zero visible rows even when the library contains data. A successful request alone does not establish that the library is empty.

**How to apply:** Use a narrowly scoped owner-context aggregate with a fixed search path. Keep loading, unavailable, stale, and genuine-zero states distinct. Verify the aggregate exists in the connected Supabase project; adding a local migration file does not apply it remotely.