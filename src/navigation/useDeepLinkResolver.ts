import { useEffect, useRef } from 'react';
import { Linking, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from './navigationRef';
import { parseDeepLink, DeepLink } from '../utils/deepLinking';
import { pendingDeepLink } from '../utils/pendingDeepLink';

// `navReady` is true once NavigationContainer's onReady has fired -- see
// RootNavigator.tsx. Deep links can arrive before auth/nav are ready
// (cold start), so anything that can't be resolved immediately is stashed
// in pendingDeepLink and replayed once both are ready.
export function useDeepLinkResolver(navReady: boolean) {
  const { user, isLoading, setActiveCommunity } = useAuth();

  const stateRef = useRef({ user, isLoading, navReady });
  stateRef.current = { user, isLoading, navReady };

  const resolve = (link: DeepLink) => {
    const currentUser = stateRef.current.user;

    if (link.type === 'join') {
      navigationRef.navigate('Main', {
        screen: 'HomeTab',
        params: { screen: 'JoinCommunity', params: { code: link.code } },
      });
      return;
    }

    const isMember = !!currentUser?.communities.some((c) => c.communityId === link.communityId);
    if (!isMember) {
      Alert.alert("Can't open that community", "You're not a member of this community yet.");
      return;
    }

    setActiveCommunity(link.communityId);

    if (link.type === 'community') {
      navigationRef.navigate('Main', {
        screen: 'HomeTab',
        params: { screen: 'Community', params: { communityId: link.communityId } },
      });
    } else if (link.type === 'chat') {
      navigationRef.navigate('Main', { screen: 'ChatTab' });
    } else {
      navigationRef.navigate('Main', { screen: 'AnnouncementsTab' });
    }
  };

  const handleUrl = (url: string) => {
    const link = parseDeepLink(url);
    if (!link) return;

    const { user: currentUser, isLoading: loading, navReady: ready } = stateRef.current;
    if (loading || !currentUser || !ready || !navigationRef.isReady()) {
      pendingDeepLink.set(url);
      return;
    }
    resolve(link);
  };

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoading || !user || !navReady) return;
    const pending = pendingDeepLink.take();
    if (pending) handleUrl(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user, navReady]);
}
