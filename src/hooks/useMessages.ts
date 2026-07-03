import { useQuery } from '@tanstack/react-query';
import * as messagesService from '../services/messages';

export function useMessages(communityId: string, page = 1) {
  return useQuery({
    queryKey: ['messages', communityId, { page }],
    queryFn: () => messagesService.getMessages(communityId, { page, limit: 50 }),
    enabled: !!communityId,
  });
}
