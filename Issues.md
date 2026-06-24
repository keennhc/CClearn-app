1. ~~it seems sometimes on mobile some on screen permission or tutorials show up which break the test.~~ **RESOLVED**

**Root cause:** Maestro flows had no `launchApp` step to pre-configure OS permissions. System dialogs (notification prompts, permission requests, iOS tutorials) would appear unpredictably and block test assertions.

**Fix:** Added `onFlowStart` hook in `.maestro/config.yaml` that launches the app with `permissions: all: allow`, pre-granting all OS permissions before each flow runs. Also added explicit `launchApp` with permissions to `full_flow.yaml`.

2. ~~add expo web support.~~ **RESOLVED**

**Fix:** Installed `react-dom`, `react-native-web`, and `@expo/metro-runtime` via `npx expo install`. Set `"bundler": "metro"` in `app.json` web config. Web export verified successfully (893 modules bundled). `expo-secure-store` already has built-in web support (uses localStorage) — no fallback needed. Run with `npx expo start --web`.
