# Feature Plan -- Part 1: Push Notifications

## Why

Currently the only way to learn about a new chat message or announcement is to have the app open. Push notifications are the single highest-value item on the out-of-scope list because they directly drive re-engagement for the two most time-sensitive features the app already has (chat, announcements).

This requires **backend changes** (new module + trigger points), unlike the AI Chat plan.

---

## Backend changes (`CClearn/apps/backend`)

### New table: `push_tokens`

| Field | Type |
|---|---|
| id | uuid |
| userId | FK -> users, indexed |
| token | varchar, unique |
| platform | varchar (`ios` \| `android`) |
| createdAt | timestamp |

A user can have multiple tokens (multiple devices). Migration: `<timestamp>-AddPushTokens.ts`.

### New module: `apps/backend/src/modules/notifications/`

```
notifications/
├── entities/push-token.entity.ts
├── dto/register-token.dto.ts
├── notifications.controller.ts
├── notifications.service.ts
├── notifications.service.spec.ts
└── notifications.module.ts
```

Endpoints:

| Method | Path | Description |
|---|---|---|
| POST | `/notifications/register-token` | Body `{ token, platform }`. Upserts by token. |
| DELETE | `/notifications/register-token` | Body `{ token }`. Removes on logout/uninstall detection. |

### Sending

Use `expo-server-sdk` (backend calls Expo's push API -- no direct FCM/APNs integration needed since the app is Expo-managed).

```bash
pnpm --filter backend add expo-server-sdk
```

Injectable `ExpoPushClient` (thin wrapper, mirrors `GeminiClient`'s pattern in `ai-chat/gemini.client.ts` for testability).

Trigger points -- call `notificationsService.notifyCommunity(communityId, { excludeUserId, title, body, data })`:

- `community.service.ts` -- after a message is created and broadcast over the socket, push to community members **excluding the sender**. `data: { type: 'message', communityId }`.
- `announcements.service.ts` -- after `create()`, push to all community members. `data: { type: 'announcement', communityId, announcementId }`.

Push is fire-and-forget (don't block the HTTP response on Expo's API; log failures, don't throw).

### API.md

Add a `## Notifications` section documenting the two endpoints.

---

## Mobile changes (`CClearn-app`)

```bash
npx expo install expo-notifications expo-device
```

### `src/utils/notifications.ts`

- `registerForPushNotifications()`: requests permission (`Notifications.requestPermissionsAsync`), gets the Expo push token (`Notifications.getExpoPushTokenAsync`), returns `{ token, platform }` or `null` if denied/unsupported (simulator).
- `configureNotificationHandler()`: sets `Notifications.setNotificationHandler` so foreground notifications show a banner (default suppressed on iOS/Android otherwise).

### `src/services/notifications.ts`

```ts
export async function registerToken(token: string, platform: 'ios' | 'android'): Promise<void>
export async function unregisterToken(token: string): Promise<void>
```

Same `api.ts` axios pattern as every other service file.

### Wiring into `AuthContext.tsx`

- After a successful `login`/`register`/session-restore (i.e., once `user` is populated), call `registerForPushNotifications()` then `registerToken()`. Store the resolved token in a ref so `logout()` can call `unregisterToken()` before clearing state.
- Fire-and-forget with a caught error (permission denial must not block login).

### Tap-to-open handling

Add a `Notifications.addNotificationResponseReceivedListener` in `App.tsx` (or a small `useNotificationRouter` hook) that reads `data.type`/`data.communityId` and navigates. **This depends on [[featurePlan-part2-deep-linking]]** for the actual navigation-from-anywhere mechanism -- implement Part 2 first, then this listener just calls the same linking resolver.

### Settings

Add a "Push Notifications" toggle to `ProfileScreen.tsx` reflecting OS-level permission status (link out to system settings if denied, since apps can't re-prompt after a hard denial on iOS).

---

## Testing

- `notifications.service.spec.ts` (backend) -- mocks `ExpoPushClient`; verifies `notifyCommunity` excludes the sender, verifies push failures are swallowed not thrown.
- `src/services/notifications.test.ts` -- request shape.
- `src/utils/notifications.test.ts` -- mocks `expo-notifications`; permission-denied returns `null` and doesn't throw.

## Env vars

None required for Expo's push service in the common case (no FCM/APNs credentials needed for Expo-managed push). Document this explicitly in API.md so it isn't assumed to need secrets.

---

## Implementation Order

1. Backend: migration + `PushToken` entity
2. Backend: `notifications` module + endpoints + tests
3. Backend: wire `notifyCommunity` into message + announcement creation
4. API.md update
5. Mobile: `expo-notifications` setup, `registerForPushNotifications`, `services/notifications.ts`
6. Mobile: wire registration into `AuthContext` login/restore/logout
7. Mobile: foreground handler + Profile settings toggle
8. **After [[featurePlan-part2-deep-linking]] ships**: tap-to-open listener
9. Manual verification on a physical device (push tokens don't work in iOS Simulator; Android emulator with Google Play Services works)
