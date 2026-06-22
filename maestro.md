# Maestro E2E Testing Guide for Expo Apps

Step-by-step guide to installing Maestro and integrating it into an existing Expo (React Native) project.

---

## 1. Prerequisites

Before installing Maestro, make sure you have:

- **macOS, Linux, or Windows (WSL2)** -- Maestro runs on all three
- **Android Emulator** or **iOS Simulator** (iOS requires macOS)
- **Java 11+** -- required by Maestro under the hood
- **Your Expo app running** in Expo Go or as a dev build

Check Java:

```bash
java -version
```

If missing on macOS, install via Homebrew:

```bash
brew install openjdk@11
```

---

## 2. Install Maestro CLI

### macOS / Linux

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

This installs Maestro to `~/.maestro/bin/`. The installer adds it to your PATH automatically.

**Restart your terminal** or run:

```bash
source ~/.zshrc    # zsh
source ~/.bashrc   # bash
```

### Windows (WSL2)

Inside your WSL2 terminal:

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

### Verify installation

```bash
maestro --version
```

You should see something like `2.6.1` or later.

---

## 3. Set Up Your Expo App for Maestro

### 3a. Determine your app identifier

Maestro needs to know which app to target. For Expo apps:

| Running in | App ID |
|------------|--------|
| Expo Go (Android) | `host.exp.Exponent` |
| Expo Go (iOS) | `host.exp.Exponent` |
| Dev build (Android) | Your `android.package` from `app.json` (e.g. `com.mycompany.myapp`) |
| Dev build (iOS) | Your `ios.bundleIdentifier` from `app.json` (e.g. `com.mycompany.myapp`) |

If you use Expo Go (the default during development), the app ID is always `host.exp.Exponent`.

### 3b. Create the test directory

```bash
mkdir .maestro
```

### 3c. Create a config file (optional)

Create `.maestro/config.yaml` to set defaults:

```yaml
appId: host.exp.Exponent
```

This saves you from repeating `appId` in every flow file.

---

## 4. Write Your First Test Flow

Create `.maestro/login.yaml`:

```yaml
appId: host.exp.Exponent
name: Login Flow
---
# Assert the login screen is visible
- assertVisible: "Sign In"

# Type credentials
- tapOn: "Email"
- inputText: "user@example.com"
- tapOn: "Password"
- inputText: "mypassword"

# Submit
- tapOn: "Sign In"

# Verify navigation to next screen
- extendedWaitUntil:
    visible: "Home"
    timeout: 10000
```

### Flow file structure

Every Maestro flow file has two parts separated by `---`:

1. **Header** -- metadata like `appId` and `name`
2. **Commands** -- the test steps

---

## 5. Run the Test

### Step 1: Start your Expo app

In one terminal:

```bash
npx expo start
```

### Step 2: Open the app on a simulator/emulator

- Press `i` for iOS Simulator
- Press `a` for Android Emulator

Wait for the app to fully load on the device.

### Step 3: Run the Maestro test

In another terminal:

```bash
maestro test .maestro/login.yaml
```

### Passing environment variables

Use `-e` to pass dynamic values like credentials:

```bash
maestro test .maestro/login.yaml -e EMAIL=user@test.com -e PASSWORD=secret
```

Reference them in your YAML with `${EMAIL}` and `${PASSWORD}`:

```yaml
- tapOn: "Email"
- inputText: "${EMAIL}"
```

---

## 6. Maestro Command Reference

### Assertions

```yaml
# Assert element with text is visible (waits up to 7s automatically)
- assertVisible: "Welcome"

# Assert element is NOT visible
- assertNotVisible: "Loading"

# Assert with selector properties
- assertVisible:
    text: "Submit"
    enabled: true
```

Valid `assertVisible` / `assertNotVisible` selector properties:

| Property | Type | Description |
|----------|------|-------------|
| `text` | string | Match by visible text |
| `id` | string | Match by accessibility ID or resource ID |
| `enabled` | boolean | Match enabled/disabled state |
| `checked` | boolean | Match checked/unchecked state |
| `focused` | boolean | Match keyboard focus state |
| `selected` | boolean | Match selected/unselected state |

### Waiting

```yaml
# Wait longer than the default 7 seconds for an element
- extendedWaitUntil:
    visible: "Dashboard"
    timeout: 15000

# Wait for an element to disappear
- extendedWaitUntil:
    notVisible: "Loading..."
    timeout: 10000
```

### Tapping

```yaml
# Tap by text
- tapOn: "Submit"

# Tap by accessibility ID
- tapOn:
    id: "submit-button"

# Tap by coordinates (percentage of screen)
- tapOn:
    point: "50%,90%"

# Tap specific instance when multiple matches exist
- tapOn:
    text: "Delete"
    index: 0
```

### Text Input

```yaml
# Type text into the focused field
- inputText: "hello@example.com"

# Clear a field before typing
- clearText

# Press a specific key
- pressKey: enter
- pressKey: backspace
```

### Scrolling

```yaml
# Scroll down
- scroll

# Scroll until element is visible
- scrollUntilVisible:
    element:
      text: "Load More"
    direction: DOWN

# Swipe in a direction
- swipe:
    direction: LEFT
    duration: 500
```

### Navigation

```yaml
# Press the device back button (Android)
- pressKey: back

# Launch or relaunch the app
- launchApp

# Clear app state and relaunch
- clearState
- launchApp
```

### Conditional Logic

```yaml
# Run steps only on a specific platform
- runFlow:
    when:
      platform: Android
    commands:
      - pressKey: back
```

### Screenshots

```yaml
# Take a screenshot at any point in the flow
- takeScreenshot: "after-login"
```

---

## 7. Project Structure

Recommended layout for Maestro tests in an Expo project:

```
your-expo-project/
├── .maestro/
│   ├── config.yaml          # Default appId and settings
│   ├── 01_login.yaml        # Individual test flows
│   ├── 02_register.yaml
│   ├── 03_home.yaml
│   ├── 04_profile.yaml
│   └── full_flow.yaml       # End-to-end combined flow
├── src/
├── app.json
├── App.tsx
└── package.json
```

### Naming convention

Prefix flows with numbers to control execution order when running the entire directory:

```bash
maestro test .maestro/
```

Maestro runs files in alphabetical order.

---

## 8. npm Scripts

Add these to `package.json` for convenience:

```json
{
  "scripts": {
    "test:e2e": "maestro test .maestro/",
    "test:e2e:login": "maestro test .maestro/01_login.yaml"
  }
}
```

Run with:

```bash
npm run test:e2e
npm run test:e2e:login
```

Pass environment variables:

```bash
npm run test:e2e -- -e EMAIL=user@test.com -e PASSWORD=secret
```

---

## 9. Debugging Failed Tests

### View debug output

When a test fails, Maestro saves screenshots and logs to:

```
~/.maestro/tests/<timestamp>/
```

Each failed step includes a screenshot showing exactly what was on screen.

### Use Maestro Studio

Maestro Studio is an interactive tool that lets you inspect the screen and build selectors:

```bash
maestro studio
```

This opens a browser UI where you can:

- See a live view of the device screen
- Click elements to get their selectors
- Test commands interactively before adding them to your YAML

### Common issues

| Problem | Cause | Fix |
|---------|-------|-----|
| "Element not visible" | App hasn't loaded yet | Use `extendedWaitUntil` with a timeout |
| "Element not visible" | Text doesn't match exactly | Use `maestro studio` to inspect actual text |
| "No connected devices" | Emulator/simulator not running | Start it first, then open your app |
| "App not found" | Wrong `appId` | Check if using Expo Go (`host.exp.Exponent`) or dev build |
| Tap hits wrong element | Multiple elements with same text | Use `index` to pick the right one |

### Check the hierarchy

If a selector isn't working, inspect the view hierarchy:

```bash
maestro hierarchy
```

This dumps all visible elements with their text, IDs, and properties.

---

## 10. Expo-Specific Tips

### Expo Go vs Dev Build

- **Expo Go**: Works immediately, app ID is `host.exp.Exponent`. Maestro sees Expo Go as the app, so `launchApp` opens Expo Go (not your project directly).
- **Dev Build** (`npx expo run:ios` / `npx expo run:android`): Uses your real bundle identifier. `launchApp` opens your app directly. Recommended for CI.

### Handling the Expo Go splash

If your tests run against Expo Go, the app may show the Expo splash or project picker on launch. Make sure your project is already open before running Maestro tests.

### React Native Paper / Material icons

Maestro targets visible text on screen. Icon-only buttons (no text label) can't be tapped by text. Options:

1. Add an `accessibilityLabel` prop to the component, then target with `id` in Maestro
2. Use coordinate-based tapping: `point: "90%,50%"`

### Keyboard dismissal

If the keyboard covers elements you need to tap:

```yaml
- pressKey: back       # Android: dismisses keyboard
- hideKeyboard         # Cross-platform
```

### Animations

Maestro automatically waits for animations to settle before executing the next command. If you have long animations, use `extendedWaitUntil` to wait for the final state.

---

## 11. CI Integration

### GitHub Actions example

```yaml
name: E2E Tests
on: [push]

jobs:
  e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Install Maestro
        run: curl -fsSL "https://get.maestro.mobile.dev" | bash

      - name: Build dev client
        run: npx expo run:ios --no-install

      - name: Run E2E tests
        run: |
          ~/.maestro/bin/maestro test .maestro/ \
            -e EMAIL=${{ secrets.TEST_EMAIL }} \
            -e PASSWORD=${{ secrets.TEST_PASSWORD }}
```

### Tips for CI

- Use a **dev build** (not Expo Go) so `launchApp` works reliably
- Store test credentials in CI secrets, pass via `-e`
- Use `maestro test --format junit .maestro/` to generate JUnit XML reports
- Set `--no-ansi` for cleaner CI logs

---

## 12. Quick Reference

```bash
# Install
curl -fsSL "https://get.maestro.mobile.dev" | bash

# Check version
maestro --version

# Run a single test
maestro test .maestro/login.yaml

# Run all tests in directory
maestro test .maestro/

# Run with env vars
maestro test .maestro/login.yaml -e EMAIL=test@test.com -e PASSWORD=pass

# Open interactive studio
maestro studio

# Inspect view hierarchy
maestro hierarchy

# Record a test run
maestro record .maestro/login.yaml
```
