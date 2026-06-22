import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as announcementsService from '../services/announcements';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from '../types/announcement';

export function useAnnouncements(communityId: string) {
  return useQuery({
    queryKey: ['announcements', communityId],
    queryFn: () => announcementsService.getAnnouncements(communityId),
    enabled: !!communityId,
  });
}

export function useCreateAnnouncement(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAnnouncementDto) => announcementsService.createAnnouncement(communityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', communityId] });
    },
  });
}

export function useUpdateAnnouncement(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementDto }) =>
      announcementsService.updateAnnouncement(communityId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', communityId] });
    },
  });
}

export function useDeleteAnnouncement(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => announcementsService.deleteAnnouncement(communityId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', communityId] });
    },
  });
}
