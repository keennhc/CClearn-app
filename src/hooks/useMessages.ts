import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as messagesService from '../services/messages';
import { SendMessageDto } from '../types/message';

export function useMessages(communityId: string, page = 1) {
  return useQuery({
    queryKey: ['messages', communityId, { page }],
    queryFn: () => messagesService.getMessages(communityId, { page, limit: 50 }),
    enabled: !!communityId,
  });
}

export function useSendMessage(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageDto) => messagesService.sendMessage(communityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', communityId] });
    },
  });
}
