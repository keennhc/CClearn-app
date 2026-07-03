import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ChatScreen from './ChatScreen';
import { useMessages } from '../../hooks/useMessages';
import { useMessageQueueDrain } from '../../hooks/useMessageQueueDrain';

const mockUser = {
  id: 'u1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@test.com',
  role: 'USER' as const,
  profileImageUrl: null,
  communities: [],
};

const mockEnqueue = jest.fn();
const mockRetry = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../hooks/useMessages', () => ({ useMessages: jest.fn() }));
jest.mock('../../hooks/useMessageQueueDrain', () => ({ useMessageQueueDrain: jest.fn() }));
jest.mock('../../hooks/useSocket', () => ({ useSocket: jest.fn() }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

const mockedUseMessages = useMessages as jest.Mock;
const mockedUseMessageQueueDrain = useMessageQueueDrain as jest.Mock;

function setDrainState(overrides: Partial<{ queuedMessages: unknown[]; isOnline: boolean }> = {}) {
  mockedUseMessageQueueDrain.mockReturnValue({
    queuedMessages: [],
    isOnline: true,
    enqueue: mockEnqueue,
    retry: mockRetry,
    ...overrides,
  });
}

const sentMessage = {
  id: 'm1',
  message: 'Hello there',
  communityId: 'c1',
  userId: 'u2',
  userName: 'Bob Smith',
  senderFirstName: 'Bob',
  senderLastName: 'Smith',
  userRole: 'COMMUNITY_MEMBER',
  attachmentUrl: null,
  attachmentType: null,
  attachmentName: null,
  createdAt: '2024-01-01T10:00:00.000Z',
};

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, activeCommunityId: 'c1' });
    mockedUseMessages.mockReturnValue({ data: { items: [sentMessage] }, isLoading: false });
    setDrainState();
  });

  it('renders sent messages', () => {
    const { getByText } = render(<ChatScreen />);
    expect(getByText('Hello there')).toBeTruthy();
  });

  it('shows the offline banner when not online', () => {
    setDrainState({ isOnline: false });
    const { getByText } = render(<ChatScreen />);
    expect(getByText(/No connection/)).toBeTruthy();
  });

  it('does not show the offline banner when online', () => {
    setDrainState({ isOnline: true });
    const { queryByText } = render(<ChatScreen />);
    expect(queryByText(/No connection/)).toBeNull();
  });

  it('enqueues the message and clears the input on send', async () => {
    mockEnqueue.mockResolvedValue(undefined);
    const { getByPlaceholderText, getByTestId } = render(<ChatScreen />);

    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'New message');
    fireEvent.press(getByTestId('send-button'));

    await waitFor(() => expect(mockEnqueue).toHaveBeenCalledWith({ message: 'New message' }));
    expect(input.props.value).toBe('');
  });

  it('renders a queued message without a "not sent" indicator while pending', () => {
    setDrainState({
      queuedMessages: [
        { localId: 'local-1', communityId: 'c1', message: 'queued text', createdAt: '2024-01-01', status: 'pending' },
      ],
    });

    const { getByText, queryByText } = render(<ChatScreen />);

    expect(getByText('queued text')).toBeTruthy();
    expect(queryByText('Not sent · Tap to retry')).toBeNull();
  });

  it('renders a failed queued message with a retry affordance, and tapping it retries', () => {
    setDrainState({
      queuedMessages: [
        { localId: 'local-1', communityId: 'c1', message: 'failed text', createdAt: '2024-01-01', status: 'failed' },
      ],
    });

    const { getByText, getByTestId } = render(<ChatScreen />);

    expect(getByText('failed text')).toBeTruthy();
    expect(getByText('Not sent · Tap to retry')).toBeTruthy();

    fireEvent.press(getByTestId('chat-message-retry'));

    expect(mockRetry).toHaveBeenCalledWith('local-1');
  });

  it('shows the empty-community state when no community is active', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, activeCommunityId: null });

    const { getByText } = render(<ChatScreen />);

    expect(getByText('No Community Selected')).toBeTruthy();
  });
});
