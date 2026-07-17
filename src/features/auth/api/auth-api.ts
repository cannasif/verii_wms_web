import { api } from '@/lib/axios';
import type { LoginRequest, LoginResponse, UserDto } from '../types/auth';
import type { ApiResponse, PagedResponse } from '@/types/api';
import type { ApiRequestOptions } from '@/lib/request-utils';
import { buildPagedRequest } from '@/lib/paged';
import { fetchAllPagedData } from '@/lib/fetch-all-paged-data';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(
      '/api/auth/login',
      {
        email: data.email,
        password: data.password,
      },
      { skipSessionExpiredOn401: true },
    );
    return response;
  },
  register: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/register', {
      email: data.email,
      password: data.password,
    });
    return response;
  },
  getActiveUsers: async (options?: ApiRequestOptions): Promise<UserDto[]> => {
    return fetchAllPagedData({
      fetchPage: async (pageNumber, pageSize) => {
        const response = await api.post<ApiResponse<PagedResponse<UserDto>>>(
          '/api/User/paged',
          buildPagedRequest({
            pageNumber,
            pageSize,
            filters: [{ column: 'IsActive', operator: 'Equals', value: 'true' }],
          }),
          options,
        );
        if (!response.success || !response.data) {
          throw new Error(response.message);
        }
        return response.data;
      },
    });
  },
  requestPasswordReset: async (email: string): Promise<ApiResponse<string>> => {
    const response = await api.post<ApiResponse<string>>('/api/auth/forgot-password', {
      email,
    });
    return response;
  },
  resetPassword: async (data: { token: string; newPassword: string }): Promise<ApiResponse<boolean>> => {
    const response = await api.post<ApiResponse<boolean>>('/api/auth/reset-password', {
      token: data.token,
      newPassword: data.newPassword,
    });
    return response;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<string>> => {
    const response = await api.post<ApiResponse<string>>('/api/auth/change-password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return response;
  },
};
