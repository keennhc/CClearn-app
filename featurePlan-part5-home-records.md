# Feature Plan -- Part 5: Home Records (Property Management, Maintenance Tracking, Warranties, Documents)

## Status: scoping doc, not implementation-ready

Unlike Parts 1-4, these four out-of-scope items are not gaps in an existing feature -- they are **an entirely new product domain** with no backend module, entity, or endpoint to build on (`apps/backend/src/modules/` currently has only `auth`, `communities`, `community`, `announcements`, `users`, `upload`, `dashboard`, `ai-chat`). Building this means designing a data model and API surface from scratch, which is a product decision, not just an engineering one. This document scopes the questions and proposes a shape; it should be reviewed and answered before any code is written.

---

## Why these four are grouped together

They form one natural hierarchy, not four independent features:

- **Property** is the root entity everything else hangs off.
- **Maintenance records** and **Warranties** both belong to a property.
- **Documents** is a generic attachment concept both of the above need (a warranty's receipt, a maintenance record's invoice) -- building it once as a shared primitive avoids four separate ad hoc upload flows.

Recommended build order within this part: **Property -> Documents -> Warranties -> Maintenance Tracking** (each depends on the one before it).

---

## Open product questions (answer before scoping the API)

1. **Ownership model.** Is a Property owned by an individual `user` (their own unit/house), independent of `community`? Almost certainly yes -- this is private homeowner data, not community-shared like chat/announcements. Confirm: one user can have multiple properties (e.g. owns in two communities, or owns + manages a rental)?
2. **Community linkage.** Does a Property optionally reference the `community` the home sits in (for context/address validation), or is it fully standalone? Affects whether `COMMUNITY_ADMIN` ever has visibility into it (recommend: no -- this is private homeowner data COMMUNITY_ADMIN should not see, distinct from the community-scoped data model the rest of the app uses).
3. **Visibility to SUPER_ADMIN.** Per `CLAUDE.md`, admin portal stays web-only and global-scope. Does Home Records data ever need to surface there (e.g. support use case), or is it strictly mobile-app-private, never visible in the web portal? Recommend the latter unless there's a specific support requirement.
4. **Maintenance record granularity.** Freeform notes+date+cost, or a structured taxonomy (HVAC, plumbing, roofing...)? Structured enables [[featurePlan-part8-analytics-ai]] later but adds upfront design cost.
5. **Warranty expiry notifications.** A warranty tracker without expiry reminders is just a list. This likely wants to hook into [[featurePlan-part1-push-notifications]] (a scheduled backend job checking upcoming expirations). Confirm before building Warranties in isolation -- building the tracker without the reminder is a half-feature.

---

## Proposed minimal data model (draft, pending answers above)

```
Property
  id, userId (FK -> users), address, unitNumber?, purchaseDate?, squareFootage?, createdAt, updatedAt

MaintenanceRecord
  id, propertyId (FK -> Property), title, category?, date, cost?, notes?, createdAt

Warranty
  id, propertyId (FK -> Property), itemName, provider?, purchaseDate?, expiresAt, createdAt

Document
  id, propertyId (FK -> Property), category (warranty | maintenance | other), fileUrl, fileName, uploadedAt
  optional: maintenanceRecordId / warrantyId (nullable FKs) to associate a doc with a specific record
```

`Document` reuses the existing `upload` module's S3 pipeline -- add a new folder to the allowlist (`property-documents`, e.g. 10MB, common doc/image types) rather than building a second upload path.

---

## Proposed mobile surface (draft)

A new **"My Home" tab** in `MainNavigator` (5th bottom tab), since this is per-user private data unrelated to `activeCommunityId` -- unlike Chat/Announcements it does not need a community switcher. This is the first feature that would justify growing the tab bar past 4 items; revisit the tab bar layout (icon sizing, whether Profile absorbs it instead as a nested stack like [[featurePlan-part3-biometric-auth]]'s LockScreen pattern) once the product questions above are answered.

Screens (draft, not final): `PropertyScreen` (overview), `MaintenanceHistoryScreen` (list + add), `WarrantiesScreen` (list + add, expiry-sorted), `DocumentsScreen` (per-property file list). Follows the existing thin-screen / service / hook layering used everywhere else in the app.

---

## Explicitly deferred to this plan, not decided

- Multi-property support UI (property switcher) if question 1 answer is "yes, multiple."
- Whether non-owner household members (e.g. a spouse also in the app) can share access to one Property record -- this has real access-control implications and is not assumed here.

## Recommendation

Do not start backend work until questions 1-5 are answered. Once answered, this doc should be split into four implementation-ready plans (`part5a`-`part5d`) following the same format as Parts 1-4, in the order Property -> Documents -> Warranties -> Maintenance Tracking.
