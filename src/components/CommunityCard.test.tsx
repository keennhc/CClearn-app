import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CommunityCard from './CommunityCard';

const mockCommunity = {
  id: 'c1',
  name: 'Sunset HOA',
  description: 'A friendly neighborhood',
  joinCode: 'ABC123',
  memberCount: 42,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('CommunityCard', () => {
  it('renders community name', () => {
    const { getByText } = render(
      <CommunityCard community={mockCommunity} onPress={jest.fn()} />
    );
    expect(getByText('Sunset HOA')).toBeTruthy();
  });

  it('renders description', () => {
    const { getByText } = render(
      <CommunityCard community={mockCommunity} onPress={jest.fn()} />
    );
    expect(getByText('A friendly neighborhood')).toBeTruthy();
  });

  it('renders member count with plural', () => {
    const { getByText } = render(
      <CommunityCard community={mockCommunity} onPress={jest.fn()} />
    );
    expect(getByText('42 members')).toBeTruthy();
  });

  it('renders singular member for count of 1', () => {
    const { getByText } = render(
      <CommunityCard community={{ ...mockCommunity, memberCount: 1 }} onPress={jest.fn()} />
    );
    expect(getByText('1 member')).toBeTruthy();
  });

  it('renders role chip when role is provided', () => {
    const { getByText } = render(
      <CommunityCard community={mockCommunity} role="COMMUNITY_ADMIN" onPress={jest.fn()} />
    );
    expect(getByText('Admin')).toBeTruthy();
  });

  it('renders Member chip for COMMUNITY_MEMBER role', () => {
    const { getByText } = render(
      <CommunityCard community={mockCommunity} role="COMMUNITY_MEMBER" onPress={jest.fn()} />
    );
    expect(getByText('Member')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <CommunityCard community={mockCommunity} onPress={onPress} />
    );
    fireEvent.press(getByText('Sunset HOA'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
