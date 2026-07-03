import { renderHook, waitFor } from '@testing-library/react-native';
import { Linking, Alert } from 'react-native';
import { useDeepLinkResolver } from './useDeepLinkResolver';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from './navigationRef';
import { pendingDeepLink } from '../utils/pendingDeepLink';

jest.mock('../context/AuthContext');
jest.mock('./navigationRef', () => ({
  navigationRef: { navigate: jest.fn(), isReady: jest.fn() },
}));
jest.mock('../utils/pendingDeepLink', () => ({
  pendingDeepLink: { set: jest.fn(), take: jest.fn() },
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedNavigationRef = navigationRef as unknown as { navigate: jest.Mock; isReady: jest.Mock };
const mockedPendingDeepLink = pendingDeepLink as unknown as { set: jest.Mock; take: jest.Mock };

const member = {
  id: 'u1',
  communities: [{ communityId: 'c1', communityName: 'Sunset HOA', role: 'COMMUNITY_MEMBER' as const }],
};

let urlListener: ((event: { url: string }) => void) | undefined;
const setActiveCommunity = jest.fn();

function setAuth(overrides: { user?: typeof member | null; isLoading?: boolean } = {}) {
  mockedUseAuth.mockReturnValue({
    user: member,
    isLoading: false,
    setActiveCommunity,
    ...overrides,
  });
}

describe('useDeepLinkResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    urlListener = undefined;
    mockedNavigationRef.isReady.mockReturnValue(true);
    mockedPendingDeepLink.take.mockReturnValue(null);
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    jest.spyOn(Linking, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'url') urlListener = handler as never;
      return { remove: jest.fn() } as never;
    });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('resolves the initial URL immediately when authenticated and nav is ready', async () => {
    setAuth();
    (Linking.getInitialURL as jest.Mock).mockResolvedValue('homeownershub://community/c1/chat');

    renderHook(() => useDeepLinkResolver(true));

    await waitFor(() => expect(mockedNavigationRef.navigate).toHaveBeenCalledWith('Main', { screen: 'ChatTab' }));
    expect(setActiveCommunity).toHaveBeenCalledWith('c1');
  });

  it('resolves a community detail link to the nested Community screen', async () => {
    setAuth();
    (Linking.getInitialURL as jest.Mock).mockResolvedValue('homeownershub://community/c1');

    renderHook(() => useDeepLinkResolver(true));

    await waitFor(() =>
      expect(mockedNavigationRef.navigate).toHaveBeenCalledWith('Main', {
        screen: 'HomeTab',
        params: { screen: 'Community', params: { communityId: 'c1' } },
      }),
    );
  });

  it('resolves an announcements link', async () => {
    setAuth();
    (Linking.getInitialURL as jest.Mock).mockResolvedValue('homeownershub://community/c1/announcements');

    renderHook(() => useDeepLinkResolver(true));

    await waitFor(() =>
      expect(mockedNavigationRef.navigate).toHaveBeenCalledWith('Main', { screen: 'AnnouncementsTab' }),
    );
  });

  it('resolves a join link to JoinCommunity with the code pre-filled, regardless of membership', async () => {
    setAuth();
    (Linking.getInitialURL as jest.Mock).mockResolvedValue('homeownershub://join/ABC123');

    renderHook(() => useDeepLinkResolver(true));

    await waitFor(() =>
      expect(mockedNavigationRef.navigate).toHaveBeenCalledWith('Main', {
        screen: 'HomeTab',
        params: { screen: 'JoinCommunity', params: { code: 'ABC123' } },
      }),
    );
    expect(setActiveCommunity).not.toHaveBeenCalled();
  });

  it('shows an alert and does not navigate for a community the user is not a member of', async () => {
    setAuth();
    (Linking.getInitialURL as jest.Mock).mockResolvedValue('homeownershub://community/foreign-community');

    renderHook(() => useDeepLinkResolver(true));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    expect(mockedNavigationRef.navigate).not.toHaveBeenCalled();
  });

  it('ignores an unparseable URL', async () => {
    setAuth();
    (Linking.getInitialURL as jest.Mock).mockResolvedValue('homeownershub://not-a-real-path');

    renderHook(() => useDeepLinkResolver(true));

    await waitFor(() => expect(Linking.getInitialURL).toHaveBeenCalled());
    expect(mockedNavigationRef.navigate).not.toHaveBeenCalled();
    expect(mockedPendingDeepLink.set).not.toHaveBeenCalled();
  });

  it('stashes the URL as pending instead of navigating when the user is not authenticated', async () => {
    setAuth({ user: null });
    (Linking.getInitialURL as jest.Mock).mockResolvedValue('homeownershub://community/c1');

    renderHook(() => useDeepLinkResolver(true));

    await waitFor(() => expect(mockedPendingDeepLink.set).toHaveBeenCalledWith('homeownershub://community/c1'));
    expect(mockedNavigationRef.navigate).not.toHaveBeenCalled();
  });

  it('stashes a URL received via the warm-start listener while session restore is still loading', () => {
    setAuth({ isLoading: true });

    renderHook(() => useDeepLinkResolver(false));
    urlListener?.({ url: 'homeownershub://join/ABC123' });

    expect(mockedPendingDeepLink.set).toHaveBeenCalledWith('homeownershub://join/ABC123');
    expect(mockedNavigationRef.navigate).not.toHaveBeenCalled();
  });

  it('replays a pending link once auth and the navigator become ready', () => {
    setAuth();
    mockedPendingDeepLink.take.mockReturnValue('homeownershub://community/c1/chat');

    renderHook(() => useDeepLinkResolver(true));

    expect(mockedNavigationRef.navigate).toHaveBeenCalledWith('Main', { screen: 'ChatTab' });
  });

  it('does not attempt to replay while still loading or not yet nav-ready', () => {
    setAuth({ isLoading: true });
    mockedPendingDeepLink.take.mockReturnValue('homeownershub://community/c1');

    renderHook(() => useDeepLinkResolver(false));

    expect(mockedPendingDeepLink.take).not.toHaveBeenCalled();
    expect(mockedNavigationRef.navigate).not.toHaveBeenCalled();
  });
});
