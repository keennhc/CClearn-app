# Feature Plan -- AI Chat Assistant for Mobile

## Why this feature

The backend already ships a full AI Chat Assistant module (`/ai-chat/*`, Gemini-powered, see `CClearn/AIChatPlan.md` and the "AI Chat" section of `CClearn/API.md`) and it's live in the web admin portal as a floating widget. It is **not** available in the mobile app yet, even though the app's own premise is "community admins on the go" (`appPlan.md`) and the backend's access rule -- `SUPER_ADMIN` or `COMMUNITY_ADMIN` of at least one community -- maps directly onto roles the mobile app already models in `AuthContext`.

This is the highest-leverage next feature because:

- **Zero backend work.** All five endpoints, the `AdminGuard` access rule, and shared types already exist and are documented in `API.md`. This is a pure mobile-app consumer of an already-shipped contract.
- **Fills a real gap**, not a speculative one -- it's the one admin-facing capability the web portal has that the app doesn't, for a persona (`COMMUNITY_ADMIN`) the app already serves.
- **Fits inside existing scope.** It is not in the app's out-of-scope list (`CLAUDE.md`) -- that list excludes unrelated platform domains (payments, maintenance, property management, etc.), not admin tooling.

Out of scope for this plan (matches the backend plan's own future-enhancements list): streaming responses, tool-calling against live platform data, per-community system prompts, push notifications for replies.

---

## Access Control

Mirror the backend's `AdminGuard` rule client-side so non-admins never see the entry point:

```ts
// src/utils/roles.ts
export function isAppAdmin(user: AuthProfile | null): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return user.communities.some((c) => c.role === 'COMMUNITY_ADMIN');
}
```

This is a client-side UX gate only -- the backend `AdminGuard` remains the actual authorization boundary. A plain `COMMUNITY_MEMBER` with no admin community never sees the entry point in Profile.

---

## Where it lives in navigation

The bottom tab bar (`MainNavigator.tsx`) is fixed at 4 tabs (Home, Chat, Announcements, Profile) and shown to every authenticated user regardless of role. Adding a 5th tab conditionally would mean restructuring `MainNavigator` around role state, which is unnecessary complexity for a feature only a subset of users get.

Instead, follow the existing pattern used for other admin-only, secondary screens (`CommunityInfoScreen`, `MembersScreen`): a pushed stack screen, not a tab. Entry point is a `List.Item` in `ProfileScreen`, visible only when `isAppAdmin(user)` is true.

`ProfileTab` currently renders `ProfileScreen` directly with no stack (see `MainNavigator.tsx`). This needs to become a small stack:

```ts
// src/navigation/types.ts -- add
export type ProfileStackParamList = {
  Profile: undefined;
  AiChatSessions: undefined;
  AiChatConversation: { sessionId: string; title: string };
};

// MainTabParamList
ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
```

```tsx
// MainNavigator.tsx -- add alongside HomeStackNavigator
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="AiChatSessions" component={AiChatSessionsScreen} options={{ title: 'AI Assistant' }} />
      <ProfileStack.Screen name="AiChatConversation" component={AiChatConversationScreen} options={({ route }) => ({ title: route.params.title })} />
    </ProfileStack.Navigator>
  );
}
```

Update the `ProfileTab` entry in the `Tab.Navigator` to use `ProfileStackNavigator` with `headerShown: false` (header now owned by the stack, consistent with `HomeStackNavigator`).

---

## Types

New file `src/types/ai-chat.ts`, mirroring `packages/shared-types/src/ai-chat.ts`:

```ts
export interface AiChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

export interface SendAiChatMessageResponse {
  userMessage: AiChatMessage;
  reply: AiChatMessage;
}
```

---

## Service layer

New file `src/services/ai-chat.ts`, following the exact shape of `src/services/announcements.ts` (unwrap `response.data.data`, one function per endpoint):

```ts
import api from './api';
import { ApiResponse } from '../types/api-response';
import { AiChatSession, AiChatMessage, SendAiChatMessageResponse } from '../types/ai-chat';

export async function getSessions(): Promise<AiChatSession[]> {
  const response = await api.get<ApiResponse<AiChatSession[]>>('/ai-chat/sessions');
  return response.data.data;
}

export async function createSession(): Promise<AiChatSession> {
  const response = await api.post<ApiResponse<AiChatSession>>('/ai-chat/sessions');
  return response.data.data;
}

export async function getMessages(sessionId: string): Promise<AiChatMessage[]> {
  const response = await api.get<ApiResponse<AiChatMessage[]>>(`/ai-chat/sessions/${sessionId}/messages`);
  return response.data.data;
}

export async function sendMessage(sessionId: string, message: string): Promise<SendAiChatMessageResponse> {
  const response = await api.post<ApiResponse<SendAiChatMessageResponse>>(
    `/ai-chat/sessions/${sessionId}/messages`,
    { message }
  );
  return response.data.data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await api.delete(`/ai-chat/sessions/${sessionId}`);
}
```

---

## Hooks

New file `src/hooks/useAiChat.ts`, following the exact shape of `src/hooks/useAnnouncements.ts` (query + mutations, invalidate on success):

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as aiChatService from '../services/ai-chat';

export function useAiChatSessions() {
  return useQuery({
    queryKey: ['ai-chat', 'sessions'],
    queryFn: aiChatService.getSessions,
  });
}

export function useCreateAiChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiChatService.createSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-chat', 'sessions'] }),
  });
}

export function useAiChatMessages(sessionId: string) {
  return useQuery({
    queryKey: ['ai-chat', 'messages', sessionId],
    queryFn: () => aiChatService.getMessages(sessionId),
    enabled: !!sessionId,
  });
}

export function useSendAiChatMessage(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => aiChatService.sendMessage(sessionId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat', 'messages', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['ai-chat', 'sessions'] }); // title/updatedAt may change
    },
  });
}

export function useDeleteAiChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiChatService.deleteSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-chat', 'sessions'] }),
  });
}
```

No socket integration -- this is request/response (`POST .../messages` returns the reply directly), unlike community chat which needs `useSocket` for broadcast delivery.

---

## Screens

### `src/screens/profile/AiChatSessionsScreen.tsx`

- List sessions via `useAiChatSessions()`, newest first (backend already orders this way).
- Each row: title, relative "updated" time, tap to navigate to `AiChatConversation` with `{ sessionId, title }`.
- FAB "New chat": calls `useCreateAiChatSession()`, on success navigates straight into `AiChatConversation` for the new session (title `"New chat"`).
- Swipe-to-delete or long-press -> confirm `Alert` -> `useDeleteAiChatSession()`, mirroring the delete-confirmation pattern already used in `MembersScreen`.
- Empty state: "No conversations yet -- start one below" (reuse `EmptyState` component), loading state via `LoadingScreen`, error state via inline retry (mirror `AnnouncementsScreen` error handling).

### `src/screens/profile/AiChatConversationScreen.tsx`

- Messages via `useAiChatMessages(sessionId)`, rendered oldest-to-newest in a `FlatList` (same structural pattern as `ChatScreen.tsx`: inverted list or scroll-to-end on new message -- reuse whichever `ChatScreen` already does for consistency).
- Bubble styling distinguishes `role: 'user'` (right-aligned, own-message color, matches `isOwn` styling in `ChatMessage.tsx`) vs `role: 'model'` (left-aligned, neutral).
- Text input + send button, calling `useSendAiChatMessage(sessionId)`.
- While the mutation is in flight: disable input and send button, show a typing indicator bubble (simple "..." placeholder row -- no need for anything fancier).
- On mutation error, surface an inline retry affordance rather than losing the typed message (map the two documented failure codes to user-facing copy: `429` -> "The assistant is busy, try again shortly"; `502` -> "The assistant is unavailable right now"). Do not clear the text input on failure -- same fix already applied to `ChatScreen` per `changes.md` ("setText('') only called after a successful send").
- No attachments, no WebSocket, no read receipts -- plain text in, plain text out.

### `AiChatScreen` entry point in `ProfileScreen.tsx`

Add one `List.Item` ("AI Assistant", icon `robot-outline`), rendered only when `isAppAdmin(user)`, positioned above "Sign Out". Tapping navigates to `AiChatSessions`.

---

## Components

No new shared components strictly required -- conversation bubbles can be inline JSX in `AiChatConversationScreen.tsx` given there are only two roles and no attachments (unlike `ChatMessage.tsx`, which has to handle attachments/roles/timestamps for community chat). If bubble styling grows non-trivial, extract `src/components/AiChatBubble.tsx` at that point -- don't pre-abstract.

---

## Testing

Follow the project's existing test conventions (one file per source file, mock service modules, no snapshot tests):

- `src/services/ai-chat.test.ts` -- mirrors `announcements.test.ts`: each function calls the right method/URL and unwraps `data.data`.
- `src/hooks/useAiChat.test.ts` (if hook logic warrants it beyond thin wrapping -- otherwise service + screen tests cover behavior sufficiently, per "do not test React Query internals").
- `src/screens/profile/AiChatSessionsScreen.test.tsx` -- loading, empty, error, and populated states; new-chat FAB navigates; delete confirmation flow.
- `src/screens/profile/AiChatConversationScreen.test.tsx` -- renders message history; send disables input while pending; failed send keeps input text and shows retry; role-based bubble alignment.
- `src/screens/profile/ProfileScreen.test.tsx` -- update existing test to assert the "AI Assistant" row is present for an admin user and absent for a plain `COMMUNITY_MEMBER` fixture.
- `src/utils/roles.test.ts` -- `isAppAdmin`: true for `SUPER_ADMIN`, true when any community membership is `COMMUNITY_ADMIN`, false for a member-only user, false for `null`.

---

## Implementation Order

| Step | Description |
|------|-------------|
| 1 | Add `src/types/ai-chat.ts` |
| 2 | Add `src/services/ai-chat.ts` + `ai-chat.test.ts` |
| 3 | Add `src/hooks/useAiChat.ts` |
| 4 | Add `src/utils/roles.ts` (`isAppAdmin`) + test |
| 5 | Add `ProfileStackParamList` to `src/navigation/types.ts`; wrap `ProfileTab` in a stack in `MainNavigator.tsx` |
| 6 | Build `AiChatSessionsScreen.tsx` (list, create, delete, empty/loading/error states) |
| 7 | Build `AiChatConversationScreen.tsx` (message list, send, in-flight + error handling) |
| 8 | Add "AI Assistant" entry point to `ProfileScreen.tsx`, gated by `isAppAdmin` |
| 9 | Write/update tests per the Testing section |
| 10 | Manual verification: log in as a `COMMUNITY_ADMIN` and confirm the entry point appears, a session can be created, a message round-trips against the real backend; log in as a plain `COMMUNITY_MEMBER` and confirm the entry point is absent |
| 11 | Update `CLAUDE.md` directory-responsibilities sections (`src/types/`, `src/services/`, `src/hooks/`, `src/screens/`, navigation structure diagram) to include the new files, per the project's own "update CLAUDE.md if necessary" convention |

No changes needed to `CClearn/API.md` (already documents `/ai-chat/*`) or the backend -- this plan is mobile-app-only.
