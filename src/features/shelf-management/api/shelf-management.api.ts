import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse } from '@/types/api';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ShelfDefinitionDto, ShelfPagedResponse, ShelfUpsertRequest } from '../types/shelf-management.types';

export const shelfManagementApi = {
  async getPaged(params?: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
  }, options?: ApiRequestOptions): Promise<ShelfPagedResponse> {
    return await api.post<ShelfPagedResponse>(
      '/api/Shelf/paged',
      buildPagedRequest({
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 20,
        search: params?.search ?? '',
      }),
      options,
    );
  },

  async getAll(options?: ApiRequestOptions): Promise<ApiResponse<ShelfDefinitionDto[]>> {
    return await api.get<ApiResponse<ShelfDefinitionDto[]>>('/api/Shelf/all', options);
  },

  async getLookup(warehouseId: number, includeInactive = false, options?: ApiRequestOptions): Promise<ApiResponse<ShelfDefinitionDto[]>> {
    return await api.get<ApiResponse<ShelfDefinitionDto[]>>('/api/Shelf/lookup', {
      ...options,
      params: { warehouseId, includeInactive },
    });
  },

  async create(payload: ShelfUpsertRequest, options?: ApiRequestOptions): Promise<ApiResponse<ShelfDefinitionDto>> {
    return await api.post<ApiResponse<ShelfDefinitionDto>>('/api/Shelf', payload, options);
  },

  async update(id: number, payload: Partial<ShelfUpsertRequest>, options?: ApiRequestOptions): Promise<ApiResponse<ShelfDefinitionDto>> {
    return await api.put<ApiResponse<ShelfDefinitionDto>>(`/api/Shelf/${id}`, payload, options);
  },

  async remove(id: number, options?: ApiRequestOptions): Promise<ApiResponse<boolean>> {
    return await api.delete<ApiResponse<boolean>>(`/api/Shelf/${id}`, options);
  },
};
