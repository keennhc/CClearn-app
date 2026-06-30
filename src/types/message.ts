export interface Message {
  id: string;
  message: string | null;
  communityId: string;
  userId: string;
  userName: string;
  senderFirstName: string;
  senderLastName: string;
  userRole: string;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  createdAt: string;
}

export interface SendMessageDto {
  message?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
}
