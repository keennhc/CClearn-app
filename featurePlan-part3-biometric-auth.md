# Feature Plan -- Part 3: Biometric Authentication

## Why

An **app-lock**, not a login replacement: the JWT already persists in `expo-secure-store` and survives app restarts by design (see `AuthContext`'s session-restore effect). Biometrics add a local gate in front of that already-valid session, so someone who picks up an unlocked phone can't read community chat/announcements without Face ID / fingerprint / device passcode. Purely mobile-side -- no backend changes.

---

## Package

```bash
npx expo install expo-local-authentication
```

## Preference storage

```ts
// src/utils/storage.ts -- add
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export const biometricPreference = {
  get: async () => (await preferences.get(BIOMETRIC_ENABLED_KEY)) === 'true',
  set: (enabled: boolean) => preferences.set(BIOMETRIC_ENABLED_KEY, String(enabled)),
};
```

Uses the existing `preferences` (AsyncStorage) wrapper, not `tokenStorage` -- this is a UX preference, not a secret, consistent with `CLAUDE.md`'s "No sensitive data in AsyncStorage" (the boolean itself isn't sensitive; the JWT stays in secure-store untouched).

## Gating logic

New `src/utils/biometrics.ts`:

```ts
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function promptBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Home Owners Hub',
    fallbackLabel: 'Use passcode',
  });
  return result.success;
}
```

`authenticateAsync` already falls back to the device passcode automatically when biometrics fail/aren't available (per `expo-local-authentication` behavior) unless `disableDeviceFallback: true` is passed -- leave the default so a user isn't locked out by a bad fingerprint read.

## Where the gate lives

Add `isLocked` state to `AuthContext` (or a thin sibling `AppLockContext` -- prefer folding into `AuthContext` since it's one more piece of "can the user see the app" state, avoiding a second provider for one boolean):

```ts
interface AuthState {
  // ...existing
  isLocked: boolean;
  unlock: () => Promise<boolean>; // returns success
}
```

- On session-restore (token found, profile fetched successfully): if `biometricPreference` is enabled, set `isLocked = true` instead of proceeding straight to `Main`.
- `RootNavigator` renders a `LockScreen` (new, `src/screens/auth/LockScreen.tsx`) when `isLocked`, sibling to `AuthNavigator`/`MainNavigator` -- not part of either stack, since it's neither "logged out" nor "fully in."
- `LockScreen`: app icon/name, "Unlock" button calling `unlock()` (which calls `promptBiometric()` and sets `isLocked = false` on success), and a "Sign Out" escape hatch for when biometrics are unavailable and the passcode fallback also fails (e.g. device passcode was disabled after enrollment).
- Trigger re-lock: use `AppState` listener -- when the app transitions to `background` and back to `active`, and enough time has passed (e.g. immediately, no grace period, to keep v1 simple) and the preference is on, set `isLocked = true` again.

## Settings

`ProfileScreen.tsx` gets a "Require Face ID / Touch ID" `Switch` (react-native-paper's `Switch` or a `List.Item` with `right={() => <Switch .../>}`):

- Disabled/hidden entirely if `!isBiometricAvailable()` (check on mount).
- Toggling on calls `promptBiometric()` once immediately to confirm it works before persisting the preference -- don't let a user enable a lock they haven't proven they can open.

---

## Testing

- `biometrics.test.ts` -- mocks `expo-local-authentication`; availability checks, success/failure paths.
- `AuthContext.test.tsx` -- session restore with preference on sets `isLocked: true`; `unlock()` success clears it; `AppState` background->active re-locks when preference is on, does not when off.
- `LockScreen.test.tsx` -- renders, unlock button calls context method, sign-out escape hatch works.
- `ProfileScreen.test.tsx` -- toggle hidden when hardware unavailable; enabling requires a successful prompt first.

---

## Implementation Order

1. `src/utils/biometrics.ts` + `biometricPreference` in `storage.ts`
2. Extend `AuthContext` with `isLocked`/`unlock`, session-restore gating, `AppState` re-lock listener
3. Build `LockScreen.tsx`, mount it in `RootNavigator` alongside `Auth`/`Main`
4. Add the settings toggle to `ProfileScreen`
5. Tests
6. Manual verification: enable on a physical device, background/foreground the app, confirm re-lock; test the sign-out escape hatch; test on a device with no biometrics enrolled (toggle should be hidden, not broken)
