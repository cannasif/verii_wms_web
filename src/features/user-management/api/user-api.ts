import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedResponse, PagedParams } from '@/types/api';
import { getLocalizedText } from '@/lib/localized-error';
import type { UserDto, CreateUserDto, UpdateUserDto } from '../types/user-types';

export const userApi = {
  getList: async (params: PagedParams): Promise<PagedResponse<UserDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<UserDto>>>(
      '/api/User/paged',
      buildPagedRequest(params, {
        pageNumber: 0,
        pageSize: 20,
        sortBy: 'Id',
        sortDirection: 'asc',
      }),
    );
    
    if (response.success && response.data) {
      const pagedData = response.data;
      
      const rawData = pagedData as unknown as { items?: UserDto[], data?: UserDto[] };
      if (rawData.items && !rawData.data) {
        return {
          ...pagedData,
          data: rawData.items,
        };
      }
      
      return pagedData;
    }
    throw new Error(response.message || getLocalizedText('common.errors.userListLoadFailed'));
  },

  getById: async (id: number): Promise<UserDto> => {
    const response = await api.get<ApiResponse<UserDto>>(`/api/User/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.userDetailLoadFailed'));
  },

  create: async (data: CreateUserDto): Promise<UserDto> => {
    const payload = {
      ...data,
      permissionGroupIds: data.permissionGroupIds ?? [],
    };
    const response = await api.post<ApiResponse<UserDto>>('/api/User', payload);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.userCreateFailed'));
  },

  update: async (id: number, data: UpdateUserDto): Promise<UserDto> => {
    const response = await api.put<ApiResponse<UserDto>>(`/api/User/${id}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.userUpdateFailed'));
  },

  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<object>>(`/api/User/${id}`);
    if (!response.success) {
      throw new Error(response.message || getLocalizedText('common.errors.userDeleteFailed'));
    }
  },
};
