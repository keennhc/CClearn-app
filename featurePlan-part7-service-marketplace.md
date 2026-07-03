# Feature Plan -- Part 7: Service Provider Marketplace

## Status: scoping doc, not implementation-ready -- largest single item on the list

Of everything in `CLAUDE.md`'s out-of-scope list, this is the one that most resembles building a **second product** (a two-sided marketplace, closer to Yelp/Thumbtack) rather than extending the existing HOA-community app. It should be treated as its own initiative with a dedicated product spec and stakeholder sign-off, not scoped as a quick addition. This document exists to name the open questions, not to propose an implementation-ready plan.

---

## Why this is categorically different from Parts 1-6

Every other item on the out-of-scope list is either (a) a technical capability layered onto data the app already has (Parts 1-4), or (b) a private, single-sided data model owned by one user (Property/Documents/Expenses in Parts 5-6). A marketplace introduces:

- **A second user type**: service providers, who are not homeowners/community members and need their own onboarding, profile, and possibly their own auth/login surface entirely.
- **Trust and moderation**: who vets providers before they're listed? Who handles fraudulent listings or complaints? This is an ongoing operational responsibility, not a one-time build.
- **Discovery**: search/filter/category taxonomy, and a decision on whether listings are community-scoped (only visible to members of the provider's serviced communities) or platform-wide.
- **Reviews/ratings**: a review system has its own abuse-prevention needs (can only a verified customer review? can reviews be edited/deleted? is there a response mechanism for providers?).
- **Possible monetization**: is this a free directory, a lead-gen fee model, or a subscription for providers to be listed? This materially changes the backend (billing integration, again touching [[featurePlan-part6-financial]]'s Payments concerns) and the admin tooling needed (who approves/bills providers -- likely a new admin-portal surface, not mobile).

---

## Open product questions (must be answered by a product owner, not inferred by engineering)

1. Who lists providers -- do providers self-register, or does `SUPER_ADMIN` / `COMMUNITY_ADMIN` curate a list manually? A manually-curated list (no provider-facing product surface at all) is a dramatically smaller and safer first version.
2. Is this free or monetized? If monetized, this cannot proceed without also resolving [[featurePlan-part6-financial]]'s Payments questions.
3. Community-scoped or platform-wide visibility?
4. Who moderates reviews and listings, and what's the reporting/takedown flow?
5. Any liability/insurance verification requirement before a provider can be listed (common in home-services marketplaces, since a bad referral has real-world consequences)?

---

## If scoped down to the smallest safe version

The narrowest version that delivers real value without most of the risk above: a **`SUPER_ADMIN`-curated directory**, no self-service provider onboarding, no payments, no reviews in v1 -- just a browsable, community-scoped list (name, category, phone/website, description) that `SUPER_ADMIN` maintains via the web admin portal, read-only in the mobile app.

```
ServiceProvider
  id, name, category, phone?, website?, description?, communityId? (nullable = platform-wide), createdBy, createdAt
```

Mobile: a read-only list/detail screen, likely nested under `CommunityScreen` (`Quick action buttons: Chat, Announcements, Members` gains a fourth: `Providers`). No write access from mobile at all in this scoped-down version -- `COMMUNITY_ADMIN` write access, reviews, and self-service provider onboarding would each be separate follow-up decisions once this smallest version has proven useful.

Even this reduced version should get explicit sign-off before backend work starts, since it's still new surface area and new admin-portal responsibility.

---

## Recommendation

Do not schedule implementation work for this part until a product owner has answered the five questions above. If/when it proceeds, split into its own dedicated plan document at that time, informed by whichever answers were given (a curated directory, a self-service marketplace, and a monetized marketplace are three different backends, not three sizes of the same one).
