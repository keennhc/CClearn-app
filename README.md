# Home Owners Hub Mobile

Cross-platform mobile app for homeowners to manage their communities. Built with React Native (Expo) and TypeScript. Consumes the Home Owners Hub backend API.

## Features

- **Authentication** -- Login, registration, JWT-based session management
- **Communities** -- Join by code, create new, view community details and stats
- **Chat** -- Real-time messaging via WebSocket (Socket.IO), image attachments
- **Announcements** -- View, create, edit, delete (admin only)
- **Member Management** -- View members, add/remove, change roles (admin only)
- **Profile** -- View profile, update photo, list community memberships

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK) |
| Language | TypeScript |
| Navigation | React Navigation (native stack + bottom tabs) |
| Data Fetching | TanStack Query (React Query) |
| State | React Context (auth) |
| HTTP | Axios |
| WebSocket | socket.io-client |
| Storage | expo-secure-store (JWT), AsyncStorage (preferences) |
| Forms | React Hook Form + Zod |
| UI | React Native Paper (Material Design) |

## Prerequisites

- Node.js 18+
- npm
- Expo CLI (`npx expo`)
- iOS Simulator (Xcode) or Android Emulator (Android Studio)
- Home Owners Hub backend running locally

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

Scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator.

## Environment

Copy `.env` and update `API_URL` for your setup:

```
API_URL=http://localhost:3000
```

For physical device testing, use your machine's local IP:

```
API_URL=http://192.168.x.x:3000
```

The API URL is also configured in `app.json` under `expo.extra.apiUrl`.

## Project Structure

```
src/
├── types/          # TypeScript types (mirrored from backend shared-types)
├── services/       # Axios API service layer
├── hooks/          # React Query hooks
├── context/        # AuthContext (user, token, active community)
├── navigation/     # React Navigation (root, auth, main navigators)
├── screens/        # One file per screen
│   ├── auth/       # Login, Register, CommunitySetup
│   ├── home/       # HomeScreen (community list)
│   ├── community/  # Community detail, Chat, Announcements, Members
│   ├── join/       # JoinCommunity
│   └── profile/    # ProfileScreen
├── components/     # Reusable UI components
├── utils/          # Storage helpers, formatting
└── theme/          # React Native Paper theme
```

## Roles

| Role | Access |
|------|--------|
| COMMUNITY_MEMBER | View communities, chat, read announcements, view members |
| COMMUNITY_ADMIN | All above + create announcements, manage members, community settings |
| SUPER_ADMIN | Same as member in-app; admin features are web-only |

## Scripts

```bash
npm install              # Install dependencies
npx expo start           # Start dev server
npx expo run:ios         # Run on iOS simulator
npx expo run:android     # Run on Android emulator
```
