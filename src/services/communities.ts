import api from './api';
import { ApiResponse, PaginatedResponse } from '../types/api-response';
import {
  Community,
  CommunityMember,
  CommunityStats,
  CreateCommunityDto,
  JoinCommunityDto,
  UpdateCommunityDto,
  AddMemberDto,
  UpdateMemberRoleDto,
} from '../types/community';

export async function getMyCommunities(): Promise<Community[]> {
  const response = await api.get<ApiResponse<Community[]>>('/communities/mine');
  return response.data.data;
}

export async function getCommunity(id: string): Promise<Community> {
  const response = await api.get<ApiResponse<Community>>(`/communities/${id}`);
  return response.data.data;
}

export async function createCommunity(data: CreateCommunityDto): Promise<Community> {
  const response = await api.post<ApiResponse<Community>>('/communities', data);
  return response.data.data;
}

export async function joinCommunity(data: JoinCommunityDto): Promise<Community> {
  const response = await api.post<ApiResponse<Community>>('/communities/join', data);
  return response.data.data;
}

export async function updateCommunity(id: string, data: UpdateCommunityDto): Promise<Community> {
  const response = await api.patch<ApiResponse<Community>>(`/communities/${id}`, data);
  return response.data.data;
}

export async function getCommunityStats(id: string): Promise<CommunityStats> {
  const response = await api.get<ApiResponse<CommunityStats>>(`/communities/${id}/stats`);
  return response.data.data;
}

export async function regenerateJoinCode(id: string): Promise<{ joinCode: string }> {
  const response = await api.post<ApiResponse<{ joinCode: string }>>(`/communities/${id}/regenerate-code`);
  return response.data.data;
}

export async function getMembers(
  communityId: string,
  params?: { page?: number; limit?: number; search?: string }
): Promise<PaginatedResponse<CommunityMember>> {
  const response = await api.get<ApiResponse<PaginatedResponse<CommunityMember>>>(
    `/communities/${communityId}/members`,
    { params }
  );
  return response.data.data;
}

export async function getNonMembers(
  communityId: string,
  search: string
): Promise<{ id: string; firstName: string; lastName: string; email: string }[]> {
  const response = await api.get<ApiResponse<{ id: string; firstName: string; lastName: string; email: string }[]>>(
    `/communities/${communityId}/non-members`,
    { params: { search } }
  );
  return response.data.data;
}

export async function addMember(communityId: string, data: AddMemberDto): Promise<CommunityMember> {
  const response = await api.post<ApiResponse<CommunityMember>>(`/communities/${communityId}/members`, data);
  return response.data.data;
}

export async function updateMemberRole(
  communityId: string,
  memberId: string,
  data: UpdateMemberRoleDto
): Promise<CommunityMember> {
  const response = await api.patch<ApiResponse<CommunityMember>>(
    `/communities/${communityId}/members/${memberId}`,
    data
  );
  return response.data.data;
}

export async function removeMember(communityId: string, memberId: string): Promise<void> {
  await api.delete(`/communities/${communityId}/members/${memberId}`);
}
