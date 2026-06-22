import api from './api';
import { LoginDto, RegisterDto, LoginResponse, RegisterResponse } from '../types/auth';
import { AuthProfile } from '../types/user';
import { ApiResponse } from '../types/api-response';

export async function login(data: LoginDto): Promise<LoginResponse> {
  const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
  return response.data.data;
}

export async function register(data: RegisterDto): Promise<RegisterResponse> {
  const response = await api.post<ApiResponse<RegisterResponse>>('/auth/register', data);
  return response.data.data;
}

export async function getProfile(): Promise<AuthProfile> {
  const response = await api.get<ApiResponse<AuthProfile>>('/auth/me');
  return response.data.data;
}
