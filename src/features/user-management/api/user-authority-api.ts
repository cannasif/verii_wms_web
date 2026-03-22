import { api } from '@/lib/axios';
import type { ApiResponse, PagedResponse } from '@/types/api';
import type { UserAuthorityDto } from '../types/user-types';

export const userAuthorityApi = {
  getList: async (): Promise<UserAuthorityDto[]> => {
    const response = await api.get<ApiResponse<PagedResponse<UserAuthorityDto>>>('/api/UserAuthority', {
      params: {
        pageNumber: 0,
        pageSize: 100,
        sortBy: 'Id',
        sortDirection: 'asc',
      },
    });
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message ?? 'Role list could not be loaded');
  },
};
