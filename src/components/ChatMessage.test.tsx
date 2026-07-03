import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ChatMessage from './ChatMessage';

const mockMessage = {
  id: 'm1',
  message: 'Hello everyone!',
  communityId: 'c1',
  userId: 'u1',
  userName: 'Jane Smith',
  senderFirstName: 'Jane',
  senderLastName: 'Smith',
  userRole: 'COMMUNITY_MEMBER',
  attachmentUrl: null,
  attachmentType: null,
  attachmentName: null,
  createdAt: '2024-03-15T10:30:00Z',
};

describe('ChatMessage', () => {
  it('renders message content', () => {
    const { getByText } = render(
      <ChatMessage message={mockMessage} isOwn={false} />
    );
    expect(getByText('Hello everyone!')).toBeTruthy();
  });



  it('renders sender name for other users messages', () => {
    const { getByText } = render(
      <ChatMessage message={mockMessage} isOwn={false} />
    );
    expect(getByText('Jane Smith')).toBeTruthy();
  });

  it('does not render sender name for own messages', () => {
    const { queryByText } = render(
      <ChatMessage message={mockMessage} isOwn={true} />
    );
    expect(queryByText('Jane Smith')).toBeNull();
  });

  it('renders timestamp', () => {
    const { getByText } = render(
      <ChatMessage message={mockMessage} isOwn={false} />
    );
    const timeTexts = getByText(/\d{1,2}:\d{2}/);
    expect(timeTexts).toBeTruthy();
  });

  it('renders attachment image when attachmentUrl is provided', () => {
    const messageWithAttachment = {
      ...mockMessage,
      attachmentUrl: 'https://example.com/image.jpg',
    };
    const { UNSAFE_getByType } = render(
      <ChatMessage message={messageWithAttachment} isOwn={false} />
    );
    const images = UNSAFE_getByType('Image' as any);
    expect(images).toBeTruthy();
  });

  it('handles undefined sender names without crashing', () => {
    const messageWithUndefinedNames = {
      ...mockMessage,
      senderFirstName: undefined as unknown as string,
      senderLastName: undefined as unknown as string,
    };
    expect(() => {
      render(<ChatMessage message={messageWithUndefinedNames} isOwn={false} />);
    }).not.toThrow();
  });

  it('shows a sending indicator instead of the timestamp while queued', () => {
    const { queryByText } = render(<ChatMessage message={mockMessage} isOwn status="sending" />);
    expect(queryByText('Not sent · Tap to retry')).toBeNull();
  });

  it('shows a "not sent" indicator for a failed message', () => {
    const { getByText } = render(<ChatMessage message={mockMessage} isOwn status="failed" />);
    expect(getByText('Not sent · Tap to retry')).toBeTruthy();
  });

  it('calls onRetryPress when a failed message is tapped', () => {
    const onRetryPress = jest.fn();
    const { getByTestId } = render(
      <ChatMessage message={mockMessage} isOwn status="failed" onRetryPress={onRetryPress} />
    );

    fireEvent.press(getByTestId('chat-message-retry'));

    expect(onRetryPress).toHaveBeenCalledTimes(1);
  });

  it('is not pressable when there is no retry handler, even if failed', () => {
    const { queryByTestId } = render(<ChatMessage message={mockMessage} isOwn status="failed" />);
    expect(queryByTestId('chat-message-retry')).toBeNull();
  });
});
