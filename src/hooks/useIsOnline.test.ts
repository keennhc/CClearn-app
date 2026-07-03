import { renderHook, waitFor, act } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { useIsOnline } from './useIsOnline';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));

const mockedAddEventListener = NetInfo.addEventListener as jest.Mock;

describe('useIsOnline', () => {
  beforeEach(() => jest.clearAllMocks());

  it('defaults to online before NetInfo reports back', () => {
    mockedAddEventListener.mockReturnValue(jest.fn());

    const { result } = renderHook(() => useIsOnline());

    expect(result.current).toBe(true);
  });

  it('reflects NetInfo reporting the device is offline', async () => {
    let listener: ((state: { isConnected: boolean | null }) => void) | undefined;
    mockedAddEventListener.mockImplementation((cb) => {
      listener = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useIsOnline());

    act(() => listener?.({ isConnected: false }));

    await waitFor(() => expect(result.current).toBe(false));
  });

  it('treats a null isConnected as offline', async () => {
    let listener: ((state: { isConnected: boolean | null }) => void) | undefined;
    mockedAddEventListener.mockImplementation((cb) => {
      listener = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useIsOnline());

    act(() => listener?.({ isConnected: null }));

    await waitFor(() => expect(result.current).toBe(false));
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = jest.fn();
    mockedAddEventListener.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useIsOnline());
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
