import api from './api';

export async function registerToken(token: string, platform: 'ios' | 'android'): Promise<void> {
  await api.post('/notifications/register-token', { token, platform });
}

export async function unregisterToken(token: string): Promise<void> {
  await api.delete('/notifications/register-token', { data: { token } });
}
