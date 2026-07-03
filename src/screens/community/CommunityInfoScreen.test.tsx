import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Share, Alert } from 'react-native';
import CommunityInfoScreen from './CommunityInfoScreen';
import { useCommunity, useRegenerateJoinCode } from '../../hooks/useCommunities';
import * as communitiesService from '../../services/communities';

jest.mock('../../hooks/useCommunities', () => ({
  useCommunity: jest.fn(),
  useRegenerateJoinCode: jest.fn(),
}));
jest.mock('../../services/communities', () => ({
  updateCommunity: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock('./MembersScreen', () => () => null);

const mockedUseCommunity = useCommunity as jest.Mock;
const mockedUseRegenerateJoinCode = useRegenerateJoinCode as jest.Mock;
const mockRegenerateMutate = jest.fn();

const mockCommunity = {
  id: 'c1',
  name: 'Sunset HOA',
  code: 'ABC123',
  description: 'A nice place',
  isActive: true,
  memberCount: 5,
  messageCount: 10,
  announcementCount: 2,
  createdBy: 'u1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const createProps = () => ({
  route: { key: 'info', name: 'CommunityInfo' as const, params: { communityId: 'c1' } },
  navigation: {} as any,
});

describe('CommunityInfoScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCommunity.mockReturnValue({ data: mockCommunity, isLoading: false });
    mockedUseRegenerateJoinCode.mockReturnValue({ mutate: mockRegenerateMutate, isPending: false });
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
  });

  it('shows a loading screen while the community is loading', () => {
    mockedUseCommunity.mockReturnValue({ data: undefined, isLoading: true });
    const { queryByText } = render(<CommunityInfoScreen {...createProps()} />);
    expect(queryByText('Sunset HOA')).toBeNull();
  });

  it('renders the community name and join code', () => {
    const { getByText } = render(<CommunityInfoScreen {...createProps()} />);
    expect(getByText('Sunset HOA')).toBeTruthy();
    expect(getByText('ABC123')).toBeTruthy();
  });

  it('shares an invite link containing the join code', () => {
    const { getByText } = render(<CommunityInfoScreen {...createProps()} />);

    fireEvent.press(getByText('Share Invite Link'));

    expect(Share.share).toHaveBeenCalledWith({
      message: expect.stringContaining('homeownershub://join/ABC123'),
    });
  });

  it('regenerates the join code after confirming the alert', () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((b) => b.text === 'Regenerate')?.onPress?.();
    });
    const { getByText } = render(<CommunityInfoScreen {...createProps()} />);

    fireEvent.press(getByText('Regenerate Code'));

    expect(mockRegenerateMutate).toHaveBeenCalled();
  });

  it('does not regenerate the join code when the alert is dismissed', () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(<CommunityInfoScreen {...createProps()} />);

    fireEvent.press(getByText('Regenerate Code'));

    expect(mockRegenerateMutate).not.toHaveBeenCalled();
  });

  it('saves edited community details', async () => {
    (communitiesService.updateCommunity as jest.Mock).mockResolvedValue(undefined);
    const { getByText, UNSAFE_getAllByType } = render(<CommunityInfoScreen {...createProps()} />);

    fireEvent.press(getByText('Edit Details'));
    const [nameInput] = UNSAFE_getAllByType('TextInput' as any);
    fireEvent.changeText(nameInput, 'Oak Park HOA');
    fireEvent.press(getByText('Save'));

    await waitFor(() =>
      expect(communitiesService.updateCommunity).toHaveBeenCalledWith('c1', {
        name: 'Oak Park HOA',
        description: 'A nice place',
      }),
    );
  });
});
