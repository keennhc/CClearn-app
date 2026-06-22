import api from './api';
import { ApiResponse } from '../types/api-response';
import { Announcement, CreateAnnouncementDto, UpdateAnnouncementDto } from '../types/announcement';

export async function getAnnouncements(communityId: string): Promise<Announcement[]> {
  const response = await api.get<ApiResponse<Announcement[]>>(
    `/communities/${communityId}/announcements`
  );
  return response.data.data;
}

export async function createAnnouncement(
  communityId: string,
  data: CreateAnnouncementDto
): Promise<Announcement> {
  const response = await api.post<ApiResponse<Announcement>>(
    `/communities/${communityId}/announcements`,
    data
  );
  return response.data.data;
}

export async function updateAnnouncement(
  communityId: string,
  id: string,
  data: UpdateAnnouncementDto
): Promise<Announcement> {
  const response = await api.patch<ApiResponse<Announcement>>(
    `/communities/${communityId}/announcements/${id}`,
    data
  );
  return response.data.data;
}

export async function deleteAnnouncement(communityId: string, id: string): Promise<void> {
  await api.delete(`/communities/${communityId}/announcements/${id}`);
}
