import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from './announcements';
import api from './api';

jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockAnnouncement = {
  id: 'a1',
  title: 'Test Announcement',
  content: 'This is a test',
  communityId: 'c1',
  authorId: 'u1',
  authorFirstName: 'John',
  authorLastName: 'Doe',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('announcements service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches announcements for a community', async () => {
    mockedApi.get.mockResolvedValue({
      data: { success: true, data: [mockAnnouncement] },
    });
    const result = await getAnnouncements('c1');
    expect(mockedApi.get).toHaveBeenCalledWith('/communities/c1/announcements');
    expect(result).toEqual([mockAnnouncement]);
  });

  it('creates an announcement', async () => {
    mockedApi.post.mockResolvedValue({
      data: { success: true, data: mockAnnouncement },
    });
    const result = await createAnnouncement('c1', { title: 'Test Announcement', content: 'This is a test' });
    expect(mockedApi.post).toHaveBeenCalledWith('/communities/c1/announcements', {
      title: 'Test Announcement',
      content: 'This is a test',
    });
    expect(result).toEqual(mockAnnouncement);
  });

  it('updates an announcement', async () => {
    const updated = { ...mockAnnouncement, title: 'Updated' };
    mockedApi.patch.mockResolvedValue({
      data: { success: true, data: updated },
    });
    const result = await updateAnnouncement('c1', 'a1', { title: 'Updated' });
    expect(mockedApi.patch).toHaveBeenCalledWith('/communities/c1/announcements/a1', { title: 'Updated' });
    expect(result.title).toBe('Updated');
  });

  it('deletes an announcement', async () => {
    mockedApi.delete.mockResolvedValue({});
    await deleteAnnouncement('c1', 'a1');
    expect(mockedApi.delete).toHaveBeenCalledWith('/communities/c1/announcements/a1');
  });
});
