---
name: GitHub credential precedence
description: Environment-specific guidance when connected GitHub authorization and CLI credentials disagree.
---

When Git or `gh` reports an invalid token even though a GitHub integration is connected, treat `GITHUB_TOKEN` precedence as the likely conflict. Never inspect, print, or keep retrying the stale value. Prefer the connected OAuth API path, or have the stale secret removed or replaced before relying on CLI authentication.

**Why:** A connected GitHub App did not supersede the existing invalid environment token, so both Git and `gh` continued to fail while the OAuth connector itself had valid repository write access.

**How to apply:** Check credential status without reading values. For an API fallback, require the expected remote SHA, use a non-force reference update, and verify the uploaded tree SHA matches the local tree before moving the branch.