# Home Owners Hub Mobile

Cross-platform mobile app for homeowners to manage their communities. Built with React Native (Expo SDK 56) and TypeScript. Runs on iOS, Android, and web. Consumes the Home Owners Hub backend API.

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
| Framework | React Native (Expo SDK 56) |
| Language | TypeScript |
| Navigation | React Navigation (native stack + bottom tabs) |
| Data Fetching | TanStack Query (React Query) |
| State | React Context (auth) |
| HTTP | Axios |
| WebSocket | socket.io-client |
| Storage | expo-secure-store (JWT), AsyncStorage (preferences) |
| Forms | React Hook Form + Zod |
| UI | React Native Paper (Material Design) |
| Unit Testing | Jest + React Native Testing Library |
| E2E Testing | Maestro |
| E2E Reporting | Allure |
| Web | react-native-web |

## Prerequisites

- Node.js 20+ (see `.nvmrc`)
- npm
- Expo CLI (`npx expo`)
- iOS Simulator (Xcode) or Android Emulator (Android Studio)
- Home Owners Hub backend running locally

## Getting Started

```bash
# Use the correct Node version
nvm use

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
# Edit .env with your API URL

# Start Expo dev server
npx expo start
```

Scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator / `w` for web browser.

## Environment

Create a `.env` file (not committed to git):

```
API_URL=http://localhost:3000
```

For simulator/device testing, use your machine's local IP:

```
API_URL=http://192.168.x.x:3000
```

The API URL is read via `app.config.ts` through `expo-constants`.

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
npx expo start --web     # Start dev server (web only)
npx expo run:ios         # Run on iOS simulator
npx expo run:android     # Run on Android emulator
npm test                 # Run unit tests (76 tests)
npm run test:e2e              # Run all Maestro E2E tests
npm run test:e2e:flow         # Run full E2E flow (restarts app)
npm run test:e2e:flow:expo    # Run full E2E flow (app already running)
npm run test:e2e:report       # Run E2E tests with Allure report
```

## Testing

### Unit Tests

Unit tests use Jest and React Native Testing Library. Test files live next to the source files they test.

```bash
npm test
```

Coverage:
- **Utils** -- formatting functions, secure storage, async storage
- **Services** -- auth, communities, messages, announcements API calls
- **Components** -- EmptyState, CommunityCard, ChatMessage, AnnouncementCard, MemberListItem
- **Screens** -- LoginScreen, RegisterScreen, ProfileScreen

### E2E Tests (Maestro)

E2E tests use [Maestro](https://maestro.mobile.dev/) and live in `.maestro/`.

#### Setup

```bash
# Install Maestro CLI (macOS)
curl -fsSL "https://get.maestro.mobile.dev" | bash

# Start the app in Expo Go on a simulator
npx expo start
```

#### Running

The full E2E flow uses dynamic signup -- each run generates a unique email (`e2e_<timestamp>@test.com`) and community name automatically. No credentials to configure. The flow covers: signup → create community → logout → login → browse community → chat → announcements → profile → logout.

```bash
# Run the full flow with app restart
npm run test:e2e:flow

# Run the full flow without app restart (app already running)
npm run test:e2e:flow:expo

# Run all individual flows
npm run test:e2e

# Run all flows with Allure report (opens in browser)
npm run test:e2e:report
```

OS permission dialogs and system tutorials are automatically dismissed -- the Maestro config pre-grants all permissions via `launchApp` before each flow.

#### Test Flows

| Flow | Description |
|------|-------------|
| `01_login` | Login with valid credentials |
| `02_login_invalid` | Login with wrong credentials shows error |
| `03_register` | Register new account, lands on Community Setup |
| `04_community_setup_create` | Create a community from setup screen |
| `05_home_screen` | Browse community list, tap into detail |
| `06_community_detail` | View stats, quick actions, navigate to chat |
| `07_chat` | Send a message in community chat |
| `08_announcements` | View announcements tab |
| `09_profile` | View profile screen |
| `10_logout` | Sign out returns to login |
| `11_join_community` | Join a community by code |
| `full_flow` | Signup, create community, logout, login, browse, chat, announcements, profile, logout (restarts app) |
| `full_flow_expo` | Same as full_flow but assumes app is already running |

### E2E Reporting (Allure)

The `test:e2e:report` script runs all Maestro flows, captures JUnit XML results, generates an [Allure](https://allurereport.org/) report, and opens it in your browser.

```bash
npm run test:e2e:report
```

The report includes pass/fail breakdown, test duration, suite overview, and history tracking across runs. Results are saved to `e2e-results/` (gitignored).

## Web Support

The app runs in the browser via `react-native-web`:

```bash
# Development
npx expo start --web

# Production export
npx expo export --platform web
```

Web builds use Metro as the bundler. `expo-secure-store` uses `localStorage` on web automatically -- no code changes needed.
