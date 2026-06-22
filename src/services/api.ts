import axios from 'axios';
import Constants from 'expo-constants';
import { tokenStorage } from '../utils/storage';

export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.0.30:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

let logoutCallback: (() => void) | null = null;

export function setLogoutCallback(callback: () => void) {
  logoutCallback = callback;
}

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await tokenStorage.remove();
      logoutCallback?.();
    }
    return Promise.reject(error);
  }
);

export default api;
