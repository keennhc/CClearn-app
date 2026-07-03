// One-shot holder for a deep link URL received before the user is
// authenticated and the navigator is ready. Deliberately a module-level
// value, not React state -- nothing should re-render when it changes, it
// just needs to survive until the next moment we're able to act on it.
let pendingUrl: string | null = null;

export const pendingDeepLink = {
  set(url: string) {
    pendingUrl = url;
  },
  take(): string | null {
    const url = pendingUrl;
    pendingUrl = null;
    return url;
  },
};
