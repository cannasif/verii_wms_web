import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { UserAuthorityDto } from '../types/user-types';

export const userAuthorityApi = {
  getList: async (): Promise<UserAuthorityDto[]> => {
    const response = await api.get<ApiResponse<UserAuthorityDto[]>>('/api/UserAuthority');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message ?? 'Role list could not be loaded');
  },
};
