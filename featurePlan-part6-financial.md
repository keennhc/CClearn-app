# Feature Plan -- Part 6: Financial (Expense Tracking, Payments)

## Status: scoping doc, not implementation-ready. Two risk tiers -- do not treat as one feature.

These two are grouped in the source list but are **very different in risk and should not be scoped or sequenced together**:

- **Expense Tracking** is a low-risk CRUD feature, similar in shape to [[featurePlan-part5-home-records]]'s Maintenance Tracking.
- **Payments** means handling real money (HOA dues), which brings PCI compliance, a payment processor relationship, refund/dispute handling, and legal review. This is not primarily an engineering task -- it needs a business decision before any API design.

---

## Expense Tracking (low risk, buildable soon)

### Open questions

1. Personal expense log (per-user, private -- "what have I spent on my home this year") or does it need to roll up into anything community-visible (e.g. HOA-related shared expenses)? Assume personal/private unless told otherwise -- matches the Home Records privacy model in Part 5.
2. Does an expense need to link to a [[featurePlan-part5-home-records]] `MaintenanceRecord` (e.g. "this $400 expense is the plumber visit from March"), or is it a fully separate freeform log? Recommend making `maintenanceRecordId` an optional nullable link rather than a hard dependency, so Expense Tracking doesn't block on Part 5 shipping first.

### Draft model

```
Expense
  id, userId (FK -> users), propertyId? (FK -> Property, nullable), maintenanceRecordId? (nullable),
  amount, currency, category, date, notes?, createdAt
```

### Draft surface

A screen within the "My Home" tab proposed in Part 5 (or standalone under Profile if Part 5 hasn't shipped yet) -- list + add + simple category totals for the current year. No charts/analytics here; that's [[featurePlan-part8-analytics-ai]]'s job once there's enough data to visualize meaningfully.

This is independently buildable without Payments -- do not block it on the payments decision below.

---

## Payments (high risk -- needs a product/business decision first, not a technical plan)

Do not scope an API for this until the following are decided by the product owner, because each answer changes the data model and backend surface completely:

1. **What is being paid?** HOA dues collected by `COMMUNITY_ADMIN` from members? One-off assessments? Both? This determines whether "Payments" needs a recurring-billing concept (subscriptions/invoices) or just one-off charges.
2. **Who configures amounts?** Per-community dues configuration implies new `COMMUNITY_ADMIN`-facing settings (amount, frequency, due date) -- itself a mid-sized feature before any homeowner ever pays anything.
3. **Processor.** Stripe is the standard choice for this kind of app (Connect for platform fees if `COMMUNITY_ADMIN`s need payouts, or a simpler model if the platform operator is just a pass-through/software fee). This is a business relationship (Stripe account, KYC, payout banking) that has to exist before integration work starts.
4. **Compliance boundary.** Regardless of processor, the mobile app must **never** touch raw card data -- use Stripe's hosted Payment Sheet / Payment Element (`@stripe/stripe-react-native`) so PANs never transit the app's own backend. This is non-negotiable, not a nice-to-have optimization.
5. **Refunds/disputes/failed payments.** Who is notified, what's the retry policy, does a failed dues payment affect community membership standing? Needs a policy decision, not just a webhook handler.

### Recommendation

Treat Payments as its own initiative with a dedicated spec once questions 1-5 have business answers, likely requiring:

- New `dues` / `invoices` / `payments` backend module + entities
- Stripe integration (backend: PaymentIntents/webhooks; mobile: `@stripe/stripe-react-native` Payment Sheet)
- `COMMUNITY_ADMIN` dues-configuration UI (web portal likely, not mobile-first, per `CLAUDE.md`'s existing admin-portal-for-admin-config pattern)
- Legal/compliance review before launch

Do not bundle this into the same implementation pass as Expense Tracking -- they only share a section heading in the original list, not an architecture.
