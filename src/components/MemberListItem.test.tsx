import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MemberListItem from './MemberListItem';

const mockMember = {
  id: 'm1',
  userId: 'u1',
  firstName: 'Alice',
  lastName: 'Johnson',
  email: 'alice@test.com',
  role: 'COMMUNITY_MEMBER' as const,
  joinedAt: '2024-01-01',
};

describe('MemberListItem', () => {
  it('renders member full name', () => {
    const { getByText } = render(<MemberListItem member={mockMember} />);
    expect(getByText('Alice Johnson')).toBeTruthy();
  });

  it('renders member email', () => {
    const { getByText } = render(<MemberListItem member={mockMember} />);
    expect(getByText('alice@test.com')).toBeTruthy();
  });

  it('renders Member role chip for COMMUNITY_MEMBER', () => {
    const { getByText } = render(<MemberListItem member={mockMember} />);
    expect(getByText('Member')).toBeTruthy();
  });

  it('renders Admin role chip for COMMUNITY_ADMIN', () => {
    const adminMember = { ...mockMember, role: 'COMMUNITY_ADMIN' as const };
    const { getByText } = render(<MemberListItem member={adminMember} />);
    expect(getByText('Admin')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MemberListItem member={mockMember} onPress={onPress} />);
    fireEvent.press(getByText('Alice Johnson'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
