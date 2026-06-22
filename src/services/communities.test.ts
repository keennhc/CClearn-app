import {
  getMyCommunities,
  getCommunity,
  createCommunity,
  joinCommunity,
  updateCommunity,
  getCommunityStats,
  regenerateJoinCode,
  addMember,
  removeMember,
} from './communities';
import api from './api';

jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockCommunity = {
  id: 'c1',
  name: 'Test Community',
  description: 'A test',
  joinCode: 'ABC123',
  memberCount: 5,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('communities service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches user communities', async () => {
    mockedApi.get.mockResolvedValue({
      data: { success: true, data: [mockCommunity] },
    });
    const result = await getMyCommunities();
    expect(mockedApi.get).toHaveBeenCalledWith('/communities/mine');
    expect(result).toEqual([mockCommunity]);
  });

  it('fetches a single community by id', async () => {
    mockedApi.get.mockResolvedValue({
      data: { success: true, data: mockCommunity },
    });
    const result = await getCommunity('c1');
    expect(mockedApi.get).toHaveBeenCalledWith('/communities/c1');
    expect(result).toEqual(mockCommunity);
  });

  it('creates a community', async () => {
    mockedApi.post.mockResolvedValue({
      data: { success: true, data: mockCommunity },
    });
    const result = await createCommunity({ name: 'Test Community', description: 'A test' });
    expect(mockedApi.post).toHaveBeenCalledWith('/communities', {
      name: 'Test Community',
      description: 'A test',
    });
    expect(result).toEqual(mockCommunity);
  });

  it('joins a community by code', async () => {
    mockedApi.post.mockResolvedValue({
      data: { success: true, data: mockCommunity },
    });
    const result = await joinCommunity({ code: 'ABC123' });
    expect(mockedApi.post).toHaveBeenCalledWith('/communities/join', { code: 'ABC123' });
    expect(result).toEqual(mockCommunity);
  });

  it('updates a community', async () => {
    const updated = { ...mockCommunity, name: 'Updated' };
    mockedApi.patch.mockResolvedValue({
      data: { success: true, data: updated },
    });
    const result = await updateCommunity('c1', { name: 'Updated' });
    expect(mockedApi.patch).toHaveBeenCalledWith('/communities/c1', { name: 'Updated' });
    expect(result.name).toBe('Updated');
  });

  it('fetches community stats', async () => {
    const stats = { memberCount: 5, messageCount: 20, announcementCount: 3 };
    mockedApi.get.mockResolvedValue({
      data: { success: true, data: stats },
    });
    const result = await getCommunityStats('c1');
    expect(mockedApi.get).toHaveBeenCalledWith('/communities/c1/stats');
    expect(result).toEqual(stats);
  });

  it('regenerates join code', async () => {
    mockedApi.post.mockResolvedValue({
      data: { success: true, data: { joinCode: 'NEW123' } },
    });
    const result = await regenerateJoinCode('c1');
    expect(mockedApi.post).toHaveBeenCalledWith('/communities/c1/regenerate-code');
    expect(result.joinCode).toBe('NEW123');
  });

  it('adds a member by email', async () => {
    const member = { id: 'm1', userId: 'u1', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com', role: 'COMMUNITY_MEMBER', joinedAt: '2024-01-01' };
    mockedApi.post.mockResolvedValue({
      data: { success: true, data: member },
    });
    const result = await addMember('c1', { email: 'jane@test.com' });
    expect(mockedApi.post).toHaveBeenCalledWith('/communities/c1/members', { email: 'jane@test.com' });
    expect(result.email).toBe('jane@test.com');
  });

  it('removes a member', async () => {
    mockedApi.delete.mockResolvedValue({});
    await removeMember('c1', 'm1');
    expect(mockedApi.delete).toHaveBeenCalledWith('/communities/c1/members/m1');
  });
});
