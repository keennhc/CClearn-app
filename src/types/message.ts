export interface Message {
  id: string;
  content: string;
  communityId: string;
  senderId: string;
  senderFirstName: string;
  senderLastName: string;
  senderProfileImage?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  createdAt: string;
}

export interface SendMessageDto {
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
}
