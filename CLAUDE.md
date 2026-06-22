## Project Overview

Home Owners Hub Mobile is a cross-platform mobile app for homeowners to manage their communities. It is a standalone project that consumes the Home Owners Hub backend API.

Primary features:

1. Authentication (login, registration)
2. Community join and creation
3. Community-scoped chat (real-time via WebSocket)
4. Community-scoped announcements
5. Member management (COMMUNITY_ADMIN)
6. Profile viewing

The app does not replicate the admin portal. Global admin features (user management, community listing, dashboard stats) stay in the web portal.

Out of Scope:

- Admin portal features (SUPER_ADMIN global views)
- Push notifications
- Offline write queue / optimistic updates
- Deep linking
- Biometric authentication
- Property management
- Maintenance tracking
- Warranties
- Documents
- Expense tracking
- Payments
- Service provider marketplace
- Home analytics
- AI recommendations

---

# Role Model

Two-tier role system (defined by the backend):

**Global (user.role):** `SUPER_ADMIN`, `USER`

**Per-community (community_member.role):** `COMMUNITY_ADMIN`, `COMMUNITY_MEMBER`

App behavior by role:

| Role | App Access |
|------|-----------|
| COMMUNITY_MEMBER | View communities, chat, read announcements, view members |
| COMMUNITY_ADMIN | Everything above + create announcements, manage members, community settings, regenerate join code |
| SUPER_ADMIN | Same as COMMUNITY_MEMBER in the app; admin features are web-only |

---

# Technical Stack

- React Native (Expo SDK)
- TypeScript
- React Navigation (native stack + bottom tabs)
- React Query (TanStack Query)
- React Context (auth state)
- Axios
- socket.io-client
- expo-secure-store (JWT storage)
- AsyncStorage (preferences)
- React Hook Form + Zod
- React Native Paper (Material Design)
- expo-image-picker
- expo-constants

---

# Project Structure

```
/
├── app.json
├── App.tsx
├── package.json
├── tsconfig.json
├── babel.config.js
├── .env
├── CLAUDE.md
├── assets/
│
└── src/
    ├── types/
    ├── navigation/
    ├── screens/
    │   ├── auth/
    │   ├── home/
    │   ├── community/
    │   ├── profile/
    │   └── join/
    ├── components/
    ├── services/
    ├── hooks/
    ├── context/
    ├── utils/
    └── theme/
```

---

# Directory Responsibilities

## src/types/

Local copies of shared types from the backend repo (`packages/shared-types/`). Manually kept in sync. If the backend API contract changes, update these files.

Files: `api-response.ts`, `auth.ts`, `user.ts`, `community.ts`, `announcement.ts`, `upload.ts`

## src/navigation/

React Navigation setup. Three navigators:

- `RootNavigator` -- switches between auth and main flows based on auth state
- `AuthNavigator` -- Login, Register, CommunitySetup screens (stack)
- `MainNavigator` -- Bottom tabs (Home, Chat, Announcements, Profile) + stack screens within each tab

Navigation types live in `types.ts`.

## src/screens/

One file per screen. Screens are thin -- they compose components, call hooks, and handle navigation. Business logic lives in hooks and services.

- `auth/` -- LoginScreen, RegisterScreen, CommunitySetupScreen
- `home/` -- HomeScreen (community list)
- `community/` -- CommunityScreen (detail), ChatScreen, AnnouncementsScreen, MembersScreen, CommunityInfoScreen
- `profile/` -- ProfileScreen
- `join/` -- JoinCommunityScreen

## src/components/

Reusable UI components shared across screens: ChatMessage, AnnouncementCard, MemberListItem, CommunityCard, EmptyState, LoadingScreen.

## src/services/

Axios-based API service layer. One file per backend module.

- `api.ts` -- Axios instance with base URL, auth interceptor (attaches JWT), 401 response interceptor (triggers logout)
- `auth.ts` -- login, register, getProfile
- `communities.ts` -- CRUD, join, mine, members, non-members, stats, regenerate code
- `messages.ts` -- get messages, send message
- `announcements.ts` -- CRUD
- `upload.ts` -- file upload (multipart/form-data)

All services return the unwrapped `data` field from the API response envelope `{ success, data }`.

## src/hooks/

React Query hooks wrapping service calls. One file per feature area.

- `useAuth.ts` -- login/register mutations, profile query
- `useCommunities.ts` -- community list, detail, members, stats queries + join/create mutations
- `useMessages.ts` -- messages query + send mutation
- `useAnnouncements.ts` -- announcements query + create/update/delete mutations
- `useSocket.ts` -- socket.io connection, room join/leave, new-message listener

## src/context/

- `AuthContext.tsx` -- provides user profile, token, active community, login/register/logout actions

## src/utils/

- `storage.ts` -- expo-secure-store wrapper for token, AsyncStorage wrapper for preferences
- `formatting.ts` -- date formatting, name formatting

## src/theme/

- `index.ts` -- React Native Paper theme configuration

---

# Backend API

Base URL configured via `API_URL` environment variable.

All responses follow this envelope:

```
Success: { "success": true, "data": {} }
Error:   { "success": false, "message": "Error message" }
```

Authentication uses JWT Bearer tokens:

```
Authorization: Bearer <accessToken>
```

## Endpoints Used by the App

### Auth
- POST /auth/login -- returns `{ accessToken }`
- POST /auth/register -- returns `{ accessToken }`
- GET /auth/me -- returns user profile with community memberships

### Communities
- GET /communities/mine -- user's communities
- POST /communities/join -- join by code
- POST /communities -- create community (creator becomes COMMUNITY_ADMIN)
- GET /communities/:id -- community details
- PATCH /communities/:id -- update community (COMMUNITY_ADMIN)
- GET /communities/:id/stats -- community stats
- POST /communities/:id/regenerate-code -- new join code (COMMUNITY_ADMIN)

### Members
- GET /communities/:id/members -- paginated member list (COMMUNITY_ADMIN)
- GET /communities/:id/non-members -- search non-members to add (COMMUNITY_ADMIN)
- POST /communities/:id/members -- add member by email (COMMUNITY_ADMIN)
- PATCH /communities/:id/members/:memberId -- update role (COMMUNITY_ADMIN)
- DELETE /communities/:id/members/:memberId -- remove member (COMMUNITY_ADMIN)

### Messages
- GET /communities/:communityId/messages -- paginated, oldest first
- POST /communities/:communityId/messages -- send message

### Announcements
- GET /communities/:communityId/announcements -- newest first
- POST /communities/:communityId/announcements -- create (COMMUNITY_ADMIN)
- PATCH /communities/:communityId/announcements/:id -- update (COMMUNITY_ADMIN)
- DELETE /communities/:communityId/announcements/:id -- delete (COMMUNITY_ADMIN)

### Upload
- POST /upload -- multipart/form-data, folders: `profile-images` (5MB, images only), `chat-media` (25MB, any type)

### WebSocket
- Socket.IO connection to backend
- Client events: `join` (room name), `leave` (room name)
- Server events: `new-message` (message object)
- Room format: `community:<communityId>`

---

# Authentication

JWT access token stored in expo-secure-store.

Auth flow:

1. App launches -- check secure store for token
2. Token exists -- call `GET /auth/me`
   - Success: populate AuthContext, navigate to Home
   - 401: clear token, navigate to Login
3. No token -- navigate to Login
4. After login/register: store token, call `GET /auth/me`, navigate based on community membership
5. Logout: clear token, reset navigation to Login

AuthContext state:

- `user` -- full profile with community memberships (from GET /auth/me)
- `token` -- JWT string
- `isLoading` -- true during session restore
- `activeCommunityId` -- currently selected community
- `setActiveCommunity(id)` -- switch active community
- `login(email, password)` -- calls API, stores token, fetches profile
- `register(data)` -- calls API, stores token, fetches profile
- `logout()` -- clears token and user state

Community data is NOT in the JWT. Always fetched from `GET /auth/me`.

---

# Navigation Structure

```
RootNavigator
├── AuthNavigator (when not authenticated)
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── CommunitySetupScreen
│
└── MainNavigator (when authenticated)
    └── Bottom Tabs
        ├── Home Tab
        │   ├── HomeScreen (community list)
        │   ├── CommunityScreen (detail)
        │   ├── CommunityInfoScreen
        │   └── JoinCommunityScreen
        │
        ├── Chat Tab
        │   └── ChatScreen (active community)
        │
        ├── Announcements Tab
        │   └── AnnouncementsScreen (active community)
        │
        └── Profile Tab
            └── ProfileScreen
```

Chat and Announcements tabs are scoped to the active community from AuthContext. If no community is active, show an empty state prompting the user to select or join one.

---

# Environment Variables

```
API_URL=http://localhost:3000
```

For device testing, use the machine's local IP (e.g., `http://192.168.x.x:3000`).

Read via expo-constants.

---

# Development Commands

```bash
npm install                 # Install dependencies
npx expo start              # Start Expo dev server
npx expo run:ios            # Run on iOS simulator
npx expo run:android        # Run on Android emulator
```

The backend must be running separately.

---

# Testing

Use Jest and React Native Testing Library.

Test files live next to the source file:

```
src/screens/auth/LoginScreen.test.tsx
src/hooks/useAuth.test.ts
```

What to test:

- Screen rendering (loading, error, empty states)
- User interactions (form submission, button taps, navigation)
- Hook behavior when logic is complex
- Service layer response handling

Do not test:

- React Native Paper component internals
- React Query internals
- React Navigation internals
- Implementation details

Mocking:

- Mock API calls with jest.fn() on service modules
- Mock React Navigation hooks (useNavigation, useRoute) with jest.mock
- Mock expo-secure-store and AsyncStorage

General rules:

- One test file per source file
- Test behavior, not implementation
- Descriptive test names: "shows error when login fails with wrong password"
- No snapshot tests

---

# Coding Standards

- Functional components only
- React Query for all data fetching
- Feature-based screen organization
- Reusable UI components in `src/components/`
- React Native Paper for all UI elements
- TypeScript strict mode
- No `any` types unless absolutely necessary
- Prefer readability over clever solutions
- Add proper error handling on all API calls
- Add loading states on all async operations
- Add empty states when lists have no data
- Keep screens thin -- logic in hooks and services
- No unnecessary abstractions
- No over-engineering
- Keep it simple

---

# Security

- JWT stored in expo-secure-store (not AsyncStorage)
- 401 response interceptor clears token and redirects to login
- No sensitive data in AsyncStorage
- No hardcoded API URLs or secrets in source code
- Environment variables for configuration

---

# AI Coding Instructions

When generating code:

- Generate complete implementations
- Generate TypeScript types in `src/types/`
- Generate service functions in `src/services/`
- Generate React Query hooks in `src/hooks/`
- Generate screens in `src/screens/`
- Generate reusable components in `src/components/`
- Include error handling
- Include loading states
- Include empty states
- Follow React Native best practices
- Follow Expo best practices
- Follow React Navigation best practices
- Use React Native Paper components
- Do not add unnecessary abstractions
- Keep the architecture simple and maintainable
- Use latest versions of libraries
- Keep it simple, do not over-engineer
- Be concise
