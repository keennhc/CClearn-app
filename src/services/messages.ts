import api from './api';
import { ApiResponse, PaginatedResponse } from '../types/api-response';
import { Message, SendMessageDto } from '../types/message';

export async function getMessages(
  communityId: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<Message>> {
  const response = await api.get<ApiResponse<PaginatedResponse<Message>>>(
    `/communities/${communityId}/messages`,
    { params }
  );
  return response.data.data;
}

export async function sendMessage(communityId: string, data: SendMessageDto): Promise<Message> {
  const response = await api.post<ApiResponse<Message>>(
    `/communities/${communityId}/messages`,
    data
  );
  return response.data.data;
}
