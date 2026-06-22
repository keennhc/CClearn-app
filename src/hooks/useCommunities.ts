import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as communitiesService from '../services/communities';
import { CreateCommunityDto, JoinCommunityDto, AddMemberDto, UpdateMemberRoleDto } from '../types/community';

export function useMyCommunities() {
  return useQuery({
    queryKey: ['communities', 'mine'],
    queryFn: communitiesService.getMyCommunities,
  });
}

export function useCommunity(id: string) {
  return useQuery({
    queryKey: ['communities', id],
    queryFn: () => communitiesService.getCommunity(id),
    enabled: !!id,
  });
}

export function useCommunityStats(id: string) {
  return useQuery({
    queryKey: ['communities', id, 'stats'],
    queryFn: () => communitiesService.getCommunityStats(id),
    enabled: !!id,
  });
}

export function useMembers(communityId: string, page = 1, search = '') {
  return useQuery({
    queryKey: ['communities', communityId, 'members', { page, search }],
    queryFn: () => communitiesService.getMembers(communityId, { page, limit: 20, search: search || undefined }),
    enabled: !!communityId,
  });
}

export function useCreateCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommunityDto) => communitiesService.createCommunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinCommunityDto) => communitiesService.joinCommunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useRegenerateJoinCode(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => communitiesService.regenerateJoinCode(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId] });
    },
  });
}

export function useAddMember(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberDto) => communitiesService.addMember(communityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'members'] });
    },
  });
}

export function useUpdateMemberRole(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: UpdateMemberRoleDto }) =>
      communitiesService.updateMemberRole(communityId, memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'members'] });
    },
  });
}

export function useRemoveMember(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => communitiesService.removeMember(communityId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'members'] });
    },
  });
}
