import api from './api';
import { ApiResponse } from '../types/api-response';
import { UploadFolder, UploadResponse } from '../types/upload';

export async function uploadFile(
  uri: string,
  folder: UploadFolder
): Promise<UploadResponse> {
  const formData = new FormData();

  const filename = uri.split('/').pop() || 'file';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'application/octet-stream';

  formData.append('file', {
    uri,
    name: filename,
    type,
  } as unknown as Blob);
  formData.append('folder', folder);

  const response = await api.post<ApiResponse<UploadResponse>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}
