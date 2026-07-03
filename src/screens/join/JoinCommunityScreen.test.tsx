import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import JoinCommunityScreen from './JoinCommunityScreen';

const mockSetActiveCommunity = jest.fn();
const mockNavigate = jest.fn();
const mockJoinMutateAsync = jest.fn();
const mockCreateMutateAsync = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ setActiveCommunity: mockSetActiveCommunity }),
}));

jest.mock('../../hooks/useCommunities', () => ({
  useJoinCommunity: () => ({ mutateAsync: mockJoinMutateAsync, isPending: false }),
  useCreateCommunity: () => ({ mutateAsync: mockCreateMutateAsync, isPending: false }),
}));

const createProps = (code?: string) => ({
  navigation: { navigate: mockNavigate } as any,
  route: { key: 'join', name: 'JoinCommunity' as const, params: code ? { code } : undefined },
});

describe('JoinCommunityScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('defaults to an empty code field when no code param is given', () => {
    const { UNSAFE_getAllByType } = render(<JoinCommunityScreen {...createProps()} />);
    const [codeInput] = UNSAFE_getAllByType('TextInput' as any);
    expect(codeInput.props.value).toBe('');
  });

  it('pre-fills the join code from a deep-link route param', () => {
    const { UNSAFE_getAllByType } = render(<JoinCommunityScreen {...createProps('ABC123')} />);
    const [codeInput] = UNSAFE_getAllByType('TextInput' as any);
    expect(codeInput.props.value).toBe('ABC123');
  });

  it('shows an error when submitting an empty code', () => {
    const { getByText } = render(<JoinCommunityScreen {...createProps()} />);
    fireEvent.press(getByText('Join Community'));
    expect(getByText('Please enter a community code')).toBeTruthy();
    expect(mockJoinMutateAsync).not.toHaveBeenCalled();
  });

  it('joins the community, sets it active, and navigates on success', async () => {
    mockJoinMutateAsync.mockResolvedValue({ id: 'c1', code: 'ABC123' });
    const { getByText } = render(<JoinCommunityScreen {...createProps('ABC123')} />);

    fireEvent.press(getByText('Join Community'));

    await waitFor(() => expect(mockJoinMutateAsync).toHaveBeenCalledWith({ code: 'ABC123' }));
    expect(mockSetActiveCommunity).toHaveBeenCalledWith('c1');
    expect(mockNavigate).toHaveBeenCalledWith('Community', { communityId: 'c1' });
  });

  it('shows the server error message when joining fails', async () => {
    mockJoinMutateAsync.mockRejectedValue({
      response: { data: { message: 'Community not found' } },
    });
    const { getByText } = render(<JoinCommunityScreen {...createProps('BADCODE')} />);

    fireEvent.press(getByText('Join Community'));

    await waitFor(() => expect(getByText('Community not found')).toBeTruthy());
  });

  it('switches to create mode and creates a community on success', async () => {
    mockCreateMutateAsync.mockResolvedValue({ id: 'c2' });
    const { getByText, UNSAFE_getAllByType } = render(<JoinCommunityScreen {...createProps()} />);

    fireEvent.press(getByText('Create New'));
    const [nameInput] = UNSAFE_getAllByType('TextInput' as any);
    fireEvent.changeText(nameInput, 'Sunset HOA');
    fireEvent.press(getByText('Create Community'));

    await waitFor(() =>
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({ name: 'Sunset HOA', description: undefined }),
    );
    expect(mockSetActiveCommunity).toHaveBeenCalledWith('c2');
    expect(mockNavigate).toHaveBeenCalledWith('Community', { communityId: 'c2' });
  });
});
