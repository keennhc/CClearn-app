import { pendingDeepLink } from './pendingDeepLink';

describe('pendingDeepLink', () => {
  it('returns null when nothing is pending', () => {
    expect(pendingDeepLink.take()).toBeNull();
  });

  it('returns the stored url once, then clears it', () => {
    pendingDeepLink.set('homeownershub://community/c1');

    expect(pendingDeepLink.take()).toBe('homeownershub://community/c1');
    expect(pendingDeepLink.take()).toBeNull();
  });

  it('overwrites a previously stored url', () => {
    pendingDeepLink.set('homeownershub://community/c1');
    pendingDeepLink.set('homeownershub://join/ABC123');

    expect(pendingDeepLink.take()).toBe('homeownershub://join/ABC123');
  });
});
