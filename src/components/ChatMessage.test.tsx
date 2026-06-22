import React from 'react';
import { render } from '@testing-library/react-native';
import ChatMessage from './ChatMessage';

const mockMessage = {
  id: 'm1',
  content: 'Hello everyone!',
  communityId: 'c1',
  senderId: 'u1',
  senderFirstName: 'Jane',
  senderLastName: 'Smith',
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
});
