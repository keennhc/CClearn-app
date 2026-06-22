import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AnnouncementCard from './AnnouncementCard';

const mockAnnouncement = {
  id: 'a1',
  title: 'Important Update',
  content: 'This is the full content of the announcement',
  communityId: 'c1',
  authorId: 'u1',
  authorFirstName: 'John',
  authorLastName: 'Doe',
  createdAt: '2024-03-15T10:30:00Z',
  updatedAt: '2024-03-15T10:30:00Z',
};

describe('AnnouncementCard', () => {
  it('renders title and content', () => {
    const { getByText } = render(
      <AnnouncementCard announcement={mockAnnouncement} />
    );
    expect(getByText('Important Update')).toBeTruthy();
    expect(getByText('This is the full content of the announcement')).toBeTruthy();
  });

  it('renders author name', () => {
    const { getByText } = render(
      <AnnouncementCard announcement={mockAnnouncement} />
    );
    expect(getByText(/John Doe/)).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnnouncementCard announcement={mockAnnouncement} onPress={onPress} />
    );
    fireEvent.press(getByText('Important Update'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onLongPress when long pressed', () => {
    const onLongPress = jest.fn();
    const { getByText } = render(
      <AnnouncementCard announcement={mockAnnouncement} onLongPress={onLongPress} />
    );
    fireEvent(getByText('Important Update'), 'longPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});
