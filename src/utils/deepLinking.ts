export type DeepLink =
  | { type: 'community'; communityId: string }
  | { type: 'chat'; communityId: string }
  | { type: 'announcements'; communityId: string }
  | { type: 'join'; code: string };

const SCHEME_PREFIX = /^[a-zA-Z][\w+.-]*:\/\//;

// Only understands this app's own custom scheme (homeownershub://...), not
// universal links or the Expo Go exp:// proxy form -- see
// featurePlan-part2-deep-linking.md for why those are out of scope for now.
export function parseDeepLink(url: string): DeepLink | null {
  const path = url.replace(SCHEME_PREFIX, '').replace(/\/+$/, '');
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'community' && segments[1]) {
    const communityId = segments[1];
    if (segments.length === 2) return { type: 'community', communityId };
    if (segments.length === 3 && segments[2] === 'chat') return { type: 'chat', communityId };
    if (segments.length === 3 && segments[2] === 'announcements') {
      return { type: 'announcements', communityId };
    }
    return null;
  }

  if (segments[0] === 'join' && segments[1] && segments.length === 2) {
    return { type: 'join', code: segments[1] };
  }

  return null;
}
