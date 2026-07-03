# Feature Plan -- Part 4: Offline Write Queue / Optimistic Updates

## Why, and why scoped down

This is the most architecturally involved item on the out-of-scope list. Queuing and replaying *every* mutation in the app (join/create community, announcements CRUD, member management, profile updates) multiplies the number of conflict cases (e.g. replaying a "delete announcement" against an announcement someone else already deleted) for features where offline usage is rare and low-value -- nobody needs to create a community while on an airplane.

**Scope this to chat messages only.** Chat is the one feature where offline composition is actually common (spotty apartment/elevator signal mid-conversation) and where the UX payoff (message appears instantly, sends when connectivity returns) is highest. Per `CLAUDE.md`'s "no unnecessary abstractions" / "keep it simple," do not build a generic queued-mutation framework for hypothetical future use -- build the chat-specific version now, and only generalize it later if a second concrete use case shows up.

Mobile-only. No backend changes -- `POST /communities/:communityId/messages` already exists and is idempotent-safe enough for this (worst case of a double-send on a flaky retry is a duplicate message, not corrupted state).

---

## Package

```bash
npx expo install @react-native-community/netinfo
```

## Queue model

New `src/utils/messageQueue.ts`. Each queued item:

```ts
interface QueuedMessage {
  localId: string;        // client-generated uuid, used as React key before server id exists
  communityId: string;
  message: string | null;
  attachmentUrl?: string;
  attachmentType?: 'IMAGE' | 'VIDEO' | 'GIF' | 'FILE';
  attachmentName?: string;
  createdAt: string;       // client timestamp, for optimistic ordering
  status: 'pending' | 'sending' | 'failed';
}
```

Persisted to AsyncStorage keyed `message_queue:<communityId>` (per-community, so `ChatScreen` only loads its own queue and a large multi-community backlog doesn't all load at once). Survives app restart -- a message composed offline and the app killed before reconnecting should still send next launch.

```ts
export const messageQueue = {
  enqueue(communityId: string, item: Omit<QueuedMessage, 'status'>): Promise<void>,
  getAll(communityId: string): Promise<QueuedMessage[]>,
  markStatus(communityId: string, localId: string, status: QueuedMessage['status']): Promise<void>,
  remove(communityId: string, localId: string): Promise<void>,
};
```

## Connectivity

```ts
// src/hooks/useIsOnline.ts
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => NetInfo.addEventListener((state) => setIsOnline(!!state.isConnected)), []);
  return isOnline;
}
```

## Send flow changes (`ChatScreen.tsx` + `useMessages.ts`)

Current `useSendMessage` mutation (in `useMessages.ts`) posts directly and relies on the socket's `new-message` broadcast to append it. New flow:

1. On send: always enqueue immediately (`status: 'pending'`) and render it optimistically merged into the message list (queued items rendered from local state, real items from `useMessages` query -- merge by `localId` vs `id`, dedupe once the server echo arrives via socket so it doesn't render twice).
2. A queue-drain effect (mounted once per `ChatScreen`, or lifted to a small `useMessageQueueDrain(communityId)` hook) watches `useIsOnline()`: when online and the queue is non-empty, process items in order -- mark `sending`, `POST` the message, on success `remove()` it (the real message arrives via the existing socket listener and replaces the optimistic bubble), on failure mark `failed` and stop draining that community's queue (don't reorder messages by retrying out of order).
3. Failed items render with a retry affordance (tap the bubble -> re-attempt) and a visible "not sent" indicator, same interaction pattern as iMessage/WhatsApp failed sends.
4. A banner ("No connection -- messages will send when you're back online") shown in `ChatScreen` when `!isOnline`, per the existing `appPlan.md` offline-handling note ("Show a 'No connection' banner when offline") -- this plan fulfills that note for chat specifically rather than globally.

## Attachments while offline

Image picking works offline, but `POST /upload` does not. Queueing a message with an attachment means queueing the *upload* too, not just the message post -- the queue drain must upload first (get back a URL), then post the message, per item. Keep the local asset URI in the queued item until upload succeeds so a retry after a failed upload doesn't require re-picking the image.

---

## Explicitly not covered by this part

- Optimistic updates for announcements/members/community CRUD -- rare offline use, not queued; those calls simply fail with the existing error handling if offline, matching current v1 behavior.
- Read-side offline caching beyond what React Query's `gcTime`/`staleTime` already provides (already in place per `appPlan.md`).
- Conflict resolution -- not applicable at this scope (message posts don't conflict).

---

## Testing

- `messageQueue.test.ts` -- enqueue/getAll/markStatus/remove against a mocked AsyncStorage.
- `useIsOnline.test.ts` -- mocked NetInfo listener.
- `ChatScreen.test.tsx` -- sending while offline shows the queued/pending bubble and the banner; reconnecting drains the queue and the bubble reconciles with the server-echoed message; a failed send shows retry and tapping it re-attempts.

---

## Implementation Order

1. `src/utils/messageQueue.ts`
2. `src/hooks/useIsOnline.ts`
3. Merge-and-dedupe rendering logic in `ChatScreen.tsx` (optimistic + query + socket, keyed by `localId`/`id`)
4. Queue-drain hook, wired to `useIsOnline`
5. Offline banner + failed-send retry UI
6. Extend to attachment queueing (upload-then-post ordering)
7. Tests
8. Manual verification: airplane mode mid-conversation, send several messages, confirm order preserved on reconnect; force-quit the app with pending queued messages, relaunch, confirm they still send
