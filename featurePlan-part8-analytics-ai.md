# Feature Plan -- Part 8: Home Analytics & AI Recommendations

## Status: scoping doc, sequenced after Part 5 / Part 6 -- there's nothing to analyze yet

Both items depend on data that doesn't exist in the product today. Home Analytics visualizes maintenance/expense history; AI Recommendations generates suggestions from property/maintenance data. Neither has anything to work with until [[featurePlan-part5-home-records]] (Property, Maintenance, Warranties) and [[featurePlan-part6-financial]]'s Expense Tracking half have shipped and accumulated real usage. Do not schedule this part before those.

---

## Home Analytics

Once Part 5/6 data exists, this is a relatively low-risk, mostly-read-only feature:

- Backend: aggregate query endpoints, e.g. `GET /properties/:id/analytics` returning spend-by-category-by-month, maintenance frequency, upcoming warranty expirations within N days. Pure aggregation over existing tables -- no new entities.
- Mobile: a dashboard-style screen (charts/summary cards) within the "My Home" tab proposed in Part 5. Keep to 2-3 useful views (spend trend, upcoming expirations, maintenance frequency by category) rather than a sprawling BI-style dashboard -- per `CLAUDE.md`'s "no over-engineering," build what's demonstrably useful, not everything that's theoretically graphable.
- No open product questions beyond what Part 5/6 already need answered -- this is additive once that data exists.

## AI Recommendations

More speculative than Home Analytics -- flag the following before committing to it:

1. **Reuses existing infrastructure.** The Gemini integration already built for AI Chat (`apps/backend/src/modules/ai-chat/gemini.client.ts`, see the mobile-side plan at [[featurePlan.md]] which brings AI Chat to the app) can be reused rather than standing up a second LLM integration -- feed it structured context (property age, recent maintenance categories, upcoming warranty expirations) via a tailored system prompt, distinct from the general-assistant prompt AI Chat uses.
2. **Cost/quality risk.** Recommend starting as a **manual "Get suggestions" button** the user taps on demand (bounded, predictable API usage) rather than proactive/scheduled recommendations pushed via [[featurePlan-part1-push-notifications]]. Proactive suggestions at the wrong moment (e.g. suggesting gutter cleaning to someone who just had it done) erode trust in the feature faster than they build engagement -- prove the manual version is useful first.
3. **No new data model required** -- this reads existing Part 5/6 data and calls Gemini; it doesn't need its own persistence beyond maybe caching the last suggestion per property to avoid redundant API calls on repeated taps within a short window.
4. **Scope the prompt narrowly.** "Suggest maintenance tasks based on this property's history and the time of year" is answerable well by a general-purpose LLM. Do not scope this toward anything requiring real-world verified facts (contractor recommendations, cost estimates, code compliance) -- that's a different, much harder problem and risks giving users bad advice with false confidence.

### Draft endpoint (once ready)

```
POST /properties/:id/recommendations
-> { suggestions: string[] }
```

Backend calls `GeminiClient.reply()` (already exists) with a property-analytics-derived prompt instead of chat history.

---

## Recommendation

Do not begin either half of this part until Part 5 and the Expense Tracking half of Part 6 have shipped and have real data behind them. When ready, split into two implementation-ready plans (`part8a-home-analytics.md`, `part8b-ai-recommendations.md`) following the Part 1-4 format, since by then the underlying schema will be settled and these become straightforward additive features rather than open questions.
