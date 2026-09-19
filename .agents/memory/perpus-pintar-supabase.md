---
name: Supabase ownership
description: Why the existing Supabase project remains the source of truth for VIREON library data and authentication.
---

# Supabase ownership

Keep the existing Supabase project as the source of truth for library records and authentication. Do not populate or reconnect the scaffold database as a workaround for a missing Supabase permission or migration.

**Why:** This project deliberately migrated away from a custom Express/JWT stack. Keeping two stores would make landing totals, stock, and signed-in records disagree.

**How to apply:** Inspect the current Supabase flow first. Apply incremental changes to that project through authorized access rather than replacing the database or re-running the entire initial schema.
