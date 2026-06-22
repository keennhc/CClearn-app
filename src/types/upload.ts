export type UploadFolder = 'profile-images' | 'chat-media';

export interface UploadResponse {
  url: string;
  filename: string;
}
