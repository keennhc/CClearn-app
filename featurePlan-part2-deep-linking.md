# Feature Plan -- Part 2: Deep Linking

## Why

Two concrete consumers make this worth building now rather than speculatively: tapping a push notification ([[featurePlan-part1-push-notifications]]) needs to land on the right screen, and users should be able to share a community join link instead of reading a code aloud. Mobile-only -- no backend changes.

---

## Scheme configuration

`app.config.ts` currently has no `scheme`. Add one:

```ts
export default ({ config }: ExpoConfig): ExpoConfig => ({
  ...config,
  scheme: 'homeownershub',
  ...
});
```

This enables `homeownershub://...` URLs. Universal links (`https://homeownershub.app/...` opening the app on a real domain) are **out of scope for this part** -- they require Apple App Site Association / Android App Links hosting, which depends on owning a production domain. Revisit once one exists.

---

## URL scheme design

| URL | Resolves to |
|---|---|
| `homeownershub://community/:communityId` | `HomeTab -> Community` (community detail) |
| `homeownershub://community/:communityId/chat` | Sets `activeCommunityId`, then `ChatTab` |
| `homeownershub://community/:communityId/announcements` | Sets `activeCommunityId`, then `AnnouncementsTab` |
| `homeownershub://join/:code` | `JoinCommunity` screen, pre-filled with `:code` |

## Navigation linking config

React Navigation's `linking` prop on `NavigationContainer` (in `RootNavigator.tsx`):

```ts
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'homeownershub://'],
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: { screens: { Community: 'community/:communityId', JoinCommunity: 'join/:code' } },
          ChatTab: 'community/:communityId/chat',
          AnnouncementsTab: 'community/:communityId/announcements',
        },
      },
    },
  },
};
```

`ChatTab`/`AnnouncementsTab` are not community-scoped in the param list today (`MainTabParamList` has them as `undefined`, scoped implicitly via `activeCommunityId` in `AuthContext`) -- see "Auth-gating and active-community resolution" below for how the `:communityId` param gets applied before the tab renders.

---

## Auth-gating and active-community resolution

Two problems standard linking config doesn't solve for this app:

1. **Cold start, unauthenticated.** A deep link opened before login must not 404 into `AuthNavigator`, which has no matching route. Store the pending URL, replay it after login succeeds.
2. **`:communityId` isn't a nav param on `ChatTab`/`AnnouncementsTab`** -- those screens read `activeCommunityId` from `AuthContext`, not route params. A deep link into chat for a community that isn't currently active needs to call `setActiveCommunity(communityId)` first.

Implementation: a small `src/utils/pendingDeepLink.ts` (module-level ref, not context -- this is a one-shot value, not ongoing state) plus a `useDeepLinkResolver()` hook mounted once in `RootNavigator`:

```ts
// on Linking.addEventListener('url', ...) or initial URL:
// 1. parse communityId out of the URL
// 2. if not authenticated -> store pending, do nothing further
// 3. if authenticated -> setActiveCommunity(communityId), then navigate via linking's own resolution
// after login succeeds -> check pending, replay same logic, clear pending
```

If the `:communityId` in the link isn't one of the user's memberships (e.g. link to a community they're not in), fall back to `JoinCommunity` with the code pre-filled if available, otherwise show an inline error and stay on Home -- don't crash on an unresolvable param.

---

## Join-by-link

`CommunityInfoScreen.tsx` (community code display, COMMUNITY_ADMIN-only) gets a "Share Invite Link" button using `Share.share({ message: ... })` with a `homeownershub://join/:code` URL, alongside the existing raw-code display (keep the code visible too -- not everyone has the app installed yet, so the code remains the fallback).

---

## Testing

- `pendingDeepLink.test.ts` -- set/get/clear behavior.
- `RootNavigator` linking config -- snapshot-free assertion that `getStateFromPath` resolves each of the four URL shapes to the expected route (React Navigation exposes this for testing without rendering).
- Manual: `npx uri-scheme open homeownershub://community/<id>/chat --ios` (and `--android`) against a running dev build, both logged-in and logged-out.

---

## Implementation Order

1. Add `scheme` to `app.config.ts`
2. Build `linking` config in `RootNavigator.tsx`
3. Build `pendingDeepLink.ts` + replay-after-login wiring in `AuthContext`
4. Handle unresolvable/foreign `:communityId` fallback
5. Add "Share Invite Link" to `CommunityInfoScreen`
6. Tests
7. Manual verification via `uri-scheme` on iOS + Android, cold start (logged out) and warm start (logged in)
8. Hand back to [[featurePlan-part1-push-notifications]] to wire its tap-to-open listener through this same resolver
