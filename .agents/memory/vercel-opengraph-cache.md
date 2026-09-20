---
name: Vercel OpenGraph cache
description: Cache behavior for social link previews on the Vercel-hosted VIREON site
---

When a social preview continues to show an older title, description, or image after deployment, keep the metadata absolute and publish the artwork under a new versioned filename. The live HTML and image endpoint must be checked independently.

**Why:** Social clients can cache the page URL and the previous `og:image` URL separately, so a correct redeployment may still display the old card.

**How to apply:** Use an absolute production URL for `og:image`, add `og:url` and canonical metadata, publish a new image path such as `og-image-v2.png`, and verify the live response is `image/png` before asking the user to share the link again. If a query-string share link is easily mangled by the client, provide a dedicated public path with a cache-busting route instead.