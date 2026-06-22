import { useQuery } from '@tanstack/react-query';
import * as authService from '../services/auth';
import { useAuth } from '../context/AuthContext';

export function useProfile() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
    enabled: !!token,
  });
}
