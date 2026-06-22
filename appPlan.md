# Home Owners Hub -- Mobile App Plan (React Native)

## Summary

Build a cross-platform mobile app using React Native (Expo) for homeowners to manage their communities. The app consumes the existing NestJS backend API with no backend changes required. It covers registration, community join/create, community chat, announcements, and profile management. Admin features remain in the web portal -- the app is for community members and community admins on the go.

This plan assumes we are inside a blank repo (git initialized, nothing else). All project scaffolding, Expo setup, and dependency installation start from scratch.

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK) |
| Language | TypeScript |
| Navigation | React Navigation (native stack + bottom tabs) |
| State Management | React Query (TanStack Query) + React Context |
| HTTP Client | Axios |
| WebSocket | socket.io-client |
| Storage | expo-secure-store (tokens), AsyncStorage (preferences) |
| Forms | React Hook Form + Zod |
| UI Components | React Native Paper (Material Design) |
| Image Picker | expo-image-picker |
| File Upload | Axios multipart/form-data |
| Push Notifications | expo-notifications (future) |

---

## Repository Structure

Standalone repo, independent of the backend monorepo. Communicates with the backend purely through the REST API and WebSocket -- no shared code imports.

Shared types (DTOs, enums, interfaces) are duplicated under `src/types/`. These are manually kept in sync with `packages/shared-types/` in the backend repo. If the API contract changes, update both.

```
/                           <-- blank repo, everything created from scratch
├── app.json
├── App.tsx
├── package.json
├── tsconfig.json
├── babel.config.js
├── .env
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
│
└── src/
    ├── types/
    │   ├── api-response.ts
    │   ├── auth.ts
    │   ├── user.ts
    │   ├── community.ts
    │   ├── announcement.ts
    │   └── upload.ts
    │
    ├── navigation/
    │   ├── RootNavigator.tsx
    │   ├── AuthNavigator.tsx
    │   ├── MainNavigator.tsx
    │   └── types.ts
    │
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   └── CommunitySetupScreen.tsx
    │   │
    │   ├── home/
    │   │   └── HomeScreen.tsx
    │   │
    │   ├── community/
    │   │   ├── CommunityScreen.tsx
    │   │   ├── ChatScreen.tsx
    │   │   ├── AnnouncementsScreen.tsx
    │   │   ├── MembersScreen.tsx
    │   │   └── CommunityInfoScreen.tsx
    │   │
    │   ├── profile/
    │   │   └── ProfileScreen.tsx
    │   │
    │   └── join/
    │       └── JoinCommunityScreen.tsx
    │
    ├── components/
    │   ├── ChatMessage.tsx
    │   ├── AnnouncementCard.tsx
    │   ├── MemberListItem.tsx
    │   ├── CommunityCard.tsx
    │   ├── EmptyState.tsx
    │   └── LoadingScreen.tsx
    │
    ├── services/
    │   ├── api.ts
    │   ├── auth.ts
    │   ├── communities.ts
    │   ├── messages.ts
    │   ├── announcements.ts
    │   └── upload.ts
    │
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useCommunities.ts
    │   ├── useMessages.ts
    │   ├── useAnnouncements.ts
    │   └── useSocket.ts
    │
    ├── context/
    │   └── AuthContext.tsx
    │
    ├── utils/
    │   ├── storage.ts
    │   └── formatting.ts
    │
    └── theme/
        └── index.ts
```

---

## User Roles in the App

| Role | App Access |
|------|-----------|
| COMMUNITY_MEMBER | Full app access: view communities, chat, read announcements, view members |
| COMMUNITY_ADMIN | Everything above + create announcements, manage members, community settings |
| SUPER_ADMIN | Can use the app like any member; admin features stay in the web portal |

The app does not replicate the admin portal. COMMUNITY_ADMIN gets lightweight management features (add members, post announcements) within the app.

---

## Screens and Features

### Phase 1: Auth

#### Login Screen
- Email and password fields
- Login button calls `POST /auth/login`
- Store JWT in expo-secure-store
- Call `GET /auth/me` to populate user context
- Navigate to Home or Community Setup based on membership state

#### Register Screen
- Fields: first name, last name, email, password
- After account creation, navigate to Community Setup Screen

#### Community Setup Screen
- Shown after registration if user has no community memberships
- Two options:
  - Join existing community: enter community code, calls `POST /communities/join`
  - Create new community: enter name + description, calls `POST /communities` (user becomes COMMUNITY_ADMIN)
- Skip option: proceed without a community (can join later)

---

### Phase 2: Home and Navigation

#### Bottom Tab Navigation
- Home (community list)
- Chat (active community)
- Announcements (active community)
- Profile

#### Home Screen
- List of user's communities via `GET /communities/mine`
- Each card shows community name and user's role
- Tap a community to set it as active and navigate to its detail view
- FAB button: "Join Community" (enter code) or "Create Community"
- Pull-to-refresh

#### Community Screen (Detail)
- Community name, description, member count
- Quick action buttons: Chat, Announcements, Members
- Community code display (for COMMUNITY_ADMIN)
- Regenerate code button (COMMUNITY_ADMIN)

---

### Phase 3: Chat

#### Chat Screen
- Messages via `GET /communities/:communityId/messages` (paginated, oldest first)
- Real-time updates via socket.io (join room `community:<communityId>`)
- Text input with send button
- Attachment support: tap camera/gallery icon to pick image via expo-image-picker
- Upload attachment via `POST /upload` (folder: `chat-media`), then send message with attachment URL
- Messages show: sender name, timestamp, text, attachment preview (image thumbnail / file icon)
- Infinite scroll upward for older messages
- Auto-scroll to bottom on new messages

---

### Phase 4: Announcements

#### Announcements Screen
- List via `GET /communities/:communityId/announcements` (newest first)
- Each card: title, content preview, author, date
- Tap to expand full content
- COMMUNITY_ADMIN: FAB to create new announcement
- COMMUNITY_ADMIN: swipe or long-press to edit/delete
- Pull-to-refresh

---

### Phase 5: Members

#### Members Screen
- List via `GET /communities/:id/members` (paginated, searchable)
- Each row: name, email, role badge
- Search bar to filter
- COMMUNITY_ADMIN: tap member to change role or remove
- COMMUNITY_ADMIN: FAB to add member by email

---

### Phase 6: Profile

#### Profile Screen
- Display: name, email, profile image
- Edit profile image via expo-image-picker + `POST /upload` (folder: `profile-images`)
- List of communities with roles
- Logout button (clears secure store, navigates to Login)

---

## API Integration

All API calls go through the existing backend. No new endpoints required.

### Endpoints Used

| Feature | Method | Endpoint |
|---------|--------|----------|
| Login | POST | /auth/login |
| Register | POST | /auth/register |
| Get Profile | GET | /auth/me |
| My Communities | GET | /communities/mine |
| Join Community | POST | /communities/join |
| Create Community | POST | /communities |
| Community Details | GET | /communities/:id |
| Community Stats | GET | /communities/:id/stats |
| Regenerate Code | POST | /communities/:id/regenerate-code |
| List Members | GET | /communities/:id/members |
| Add Member | POST | /communities/:id/members |
| Update Member Role | PATCH | /communities/:id/members/:memberId |
| Remove Member | DELETE | /communities/:id/members/:memberId |
| Get Messages | GET | /communities/:communityId/messages |
| Send Message | POST | /communities/:communityId/messages |
| List Announcements | GET | /communities/:communityId/announcements |
| Create Announcement | POST | /communities/:communityId/announcements |
| Update Announcement | PATCH | /communities/:communityId/announcements/:id |
| Delete Announcement | DELETE | /communities/:communityId/announcements/:id |
| Upload File | POST | /upload |

### WebSocket

- Connect to backend socket.io server on app launch (after auth)
- Join room `community:<communityId>` when entering a community chat
- Leave room on navigating away or switching communities
- Listen for `new-message` events to append incoming messages

---

## Auth Flow

1. App launches -> check expo-secure-store for JWT
2. If token exists -> call `GET /auth/me`
   - Success: populate AuthContext, navigate to Home
   - 401: clear token, navigate to Login
3. If no token -> navigate to Login
4. After login/register: store token, call `GET /auth/me`, navigate based on community membership
5. Logout: clear token from secure store, reset navigation to Login

### AuthContext State

```typescript
interface AuthState {
  user: AuthProfile | null;
  token: string | null;
  isLoading: boolean;
  activeCommunityId: string | null;
  setActiveCommunity: (id: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
}
```

---

## Offline Handling

Keep it simple for v1:
- Show a "No connection" banner when offline
- Disable send/create actions when offline
- Cache the last-fetched data via React Query's built-in cache (staleTime / gcTime)
- No offline-first write queue

---

## Environment Configuration

```
# .env
API_URL=http://localhost:3000
# For device testing, use the machine's local IP:
# API_URL=http://192.168.x.x:3000
```

Use `expo-constants` to read environment variables.

---

## Development Commands

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

The backend must be running separately (from the CClearn repo via `pnpm dev:api` or `pnpm docker:up`).

---

## Implementation Order

| Step | Phase | Description |
|------|-------|-------------|
| 1 | Setup | Initialize Expo project in the blank repo (`npx create-expo-app .`), install all dependencies |
| 2 | Setup | Configure theme (React Native Paper), navigation structure, Axios instance with auth interceptor, create shared types in `src/types/` |
| 3 | 1 | Build AuthContext, secure token storage, `GET /auth/me` session restore |
| 4 | 1 | Build Login screen |
| 5 | 1 | Build Register screen |
| 6 | 1 | Build Community Setup screen (join or create after registration) |
| 7 | 2 | Build Home screen (community list from `GET /communities/mine`) |
| 8 | 2 | Build bottom tab navigation (Home, Chat, Announcements, Profile) |
| 9 | 2 | Build Community detail screen |
| 10 | 2 | Build Join Community screen |
| 11 | 3 | Build Chat screen with message list and text input |
| 12 | 3 | Integrate socket.io for real-time messages |
| 13 | 3 | Add image/file attachment support (picker + upload) |
| 14 | 4 | Build Announcements screen (list, create, edit, delete) |
| 15 | 5 | Build Members screen (list, search, role management) |
| 16 | 6 | Build Profile screen (view, edit image, logout) |
| 17 | Polish | Loading states, empty states, error handling, pull-to-refresh |
| 18 | Polish | Test on iOS simulator + Android emulator |

---

## Out of Scope (v1)

- Push notifications (infrastructure not in place yet)
- Offline write queue / optimistic updates
- Deep linking
- Biometric authentication
- Dark mode (use system default from React Native Paper)
- App Store / Play Store submission
- E2E tests (manual testing for v1)
- Admin portal features (global user management, community creation for SUPER_ADMIN stays web-only)
