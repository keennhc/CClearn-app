# Feature Plan -- Part 9: Admin Portal Features (SUPER_ADMIN Global Views)

## Status: not recommended as a mobile feature -- documenting the reasoning, not a build plan

This is different from every other part in this series: it isn't a missing capability, it's a **deliberate architectural boundary** already stated twice in the project's own docs:

> "The app does not replicate the admin portal. Global admin features (user management, community listing, dashboard stats) stay in the web portal." -- `CLAUDE.md`, Project Overview

> "SUPER_ADMIN -- Same as COMMUNITY_MEMBER in the app; admin features are web-only" -- `CLAUDE.md`, Role Model

Both the mobile app's own `appPlan.md` and the backend's `NewFeatures.md` (item 6: "add a community tab for super admin only" -- explicitly scoped to "the admin portal") independently arrived at the same split. This wasn't an oversight to fix; it was a considered decision, most likely because:

- Global admin work (managing all users across all communities, viewing platform-wide dashboard stats, creating/deactivating communities) is inherently a desk-work, data-table-heavy workflow -- the kind of task a laptop with a real keyboard and wide screen handles better than a phone.
- The mobile app's whole design center is "community members and community admins on the go" (`appPlan.md`) -- `SUPER_ADMIN` operational work doesn't fit that "on the go" framing the way "reply to a chat message" or "post an announcement" does.

---

## Recommendation

**Do not build this** unless a specific, concrete mobile use case is identified -- not "parity with the web portal" as a goal in itself. Recreating the full admin portal (`GET /users` CRUD, `GET /communities` global list/search, `GET /dashboard/stats`) in the mobile app would directly contradict the project's stated scope and role model, and roughly doubles the app's surface area for a persona (`SUPER_ADMIN`) that already has a working, appropriately-shaped tool for this job.

## If a concrete need is identified later

The only version worth reconsidering is a narrow, incident-response-shaped feature -- e.g. "a `SUPER_ADMIN` needs to deactivate a misbehaving community from their phone while away from a computer." If that need is real:

- Scope it as a single read-only community list + one destructive action (`PATCH /communities/:id { isActive: false }`, already exists per `API.md`), not a rebuild of the admin portal's user management or dashboard stats.
- Gate it behind the same `isAppAdmin`-style role check pattern used in [[featurePlan.md]] (the AI Chat plan), extended to check specifically for `SUPER_ADMIN` rather than "any admin."
- Treat it as its own small plan at that time, not an expansion of this one.

Until such a need is named, this item should stay out of scope, and `CLAUDE.md`'s existing line should remain accurate as written.
