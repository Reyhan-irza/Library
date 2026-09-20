---
name: Supabase ownership
description: Why the existing Supabase project remains the source of truth for VIREON library data and authentication.
---

# Supabase ownership

Keep the existing Supabase project as the source of truth for library records and authentication. Do not populate or reconnect the scaffold database as a workaround for a missing Supabase permission or migration.

**Why:** This project deliberately migrated away from a custom Express/JWT stack. Keeping two stores would make landing totals, stock, and signed-in records disagree.

**How to apply:** Inspect the current Supabase flow first. Apply incremental changes to that project through authorized access rather than replacing the database or re-running the entire initial schema.

Phase 2 database work may require a manual Supabase SQL Editor run when no Supabase integration is connected; verify the RPCs exist before validating the public catalog or borrowing flow.

**Why:** The frontend can build and preview while PostgREST still returns PGRST202 for migration-owned functions, which otherwise looks like a client loading bug.

**How to apply:** Treat a missing Phase 2 RPC as a migration-access blocker, not as a reason to add a second datastore or a silent client fallback.

The active Supabase project does not expose `uuid_generate_v4()` from `uuid-ossp`; migration-owned identifiers should use PostgreSQL built-ins that do not require that extension.

**Why:** The first Phase 2 SQL run failed while generating request codes, before the RPCs were created.

**How to apply:** Prefer built-in hashing/random expressions for non-secret human-readable codes, and rerun the migration as one transaction after a failed attempt.
