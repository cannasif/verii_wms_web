import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  CreateInventoryCountEntryRequest,
  CreateInventoryCountHeaderRequest,
  CreateInventoryCountScopeRequest,
  InventoryCountEntry,
  InventoryCountHeader,
  InventoryCountLine,
  InventoryCountScope,
} from '../types/inventory-count';

export const inventoryCountApi = {
  getHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<InventoryCountHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<InventoryCountHeader>>>(
      '/api/IcHeader/paged',
      buildPagedRequest(params),
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Sayim emirleri yuklenemedi');
  },

  getAssignedHeadersPaged: async (userId: number, params: PagedParams = {}): Promise<PagedResponse<InventoryCountHeader>> => {
    const response = await api.post<ApiResponse<PagedResponse<InventoryCountHeader>>>(
      `/api/IcHeader/assigned/${userId}/paged`,
      buildPagedRequest(params),
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Atanmis sayim emirleri yuklenemedi');
  },

  getHeaderById: async (id: number): Promise<InventoryCountHeader> => {
    const response = await api.get<ApiResponse<InventoryCountHeader>>(`/api/IcHeader/${id}`);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Sayim emri yuklenemedi');
  },

  createHeader: async (request: CreateInventoryCountHeaderRequest): Promise<InventoryCountHeader> => {
    const response = await api.post<ApiResponse<InventoryCountHeader>>('/api/IcHeader', request);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Sayim emri olusturulamadi');
  },

  updateHeader: async (
    id: number,
    request: Partial<CreateInventoryCountHeaderRequest> & { status?: string },
  ): Promise<InventoryCountHeader> => {
    const response = await api.put<ApiResponse<InventoryCountHeader>>(`/api/IcHeader/${id}`, request);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Sayim emri guncellenemedi');
  },

  createScope: async (request: CreateInventoryCountScopeRequest): Promise<InventoryCountScope> => {
    const response = await api.post<ApiResponse<InventoryCountScope>>('/api/IcScope', request);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Sayim kapsami kaydedilemedi');
  },

  getScopesByHeader: async (headerId: number): Promise<InventoryCountScope[]> => {
    const response = await api.get<ApiResponse<InventoryCountScope[]>>(`/api/IcScope/by-header/${headerId}`);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Sayim kapsamlari yuklenemedi');
  },

  generateLines: async (headerId: number): Promise<boolean> => {
    const response = await api.post<ApiResponse<boolean>>(`/api/IcHeader/${headerId}/generate-lines`);
    if (response.success) return Boolean(response.data);
    throw new Error(response.message || 'Sayim satirlari hazirlanamadi');
  },

  getLinesByHeader: async (headerId: number): Promise<InventoryCountLine[]> => {
    const response = await api.get<ApiResponse<InventoryCountLine[]>>(`/api/IcLine/by-header/${headerId}`);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Sayim satirlari yuklenemedi');
  },

  addCountEntry: async (request: CreateInventoryCountEntryRequest): Promise<InventoryCountEntry> => {
    const response = await api.post<ApiResponse<InventoryCountEntry>>('/api/IcCountEntry', request);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Sayim girisi kaydedilemedi');
  },

  getEntriesByLine: async (lineId: number): Promise<InventoryCountEntry[]> => {
    const response = await api.get<ApiResponse<InventoryCountEntry[]>>(`/api/IcCountEntry/by-line/${lineId}`);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || 'Sayim girisleri yuklenemedi');
  },

  softDeleteHeader: async (id: number): Promise<boolean> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/IcHeader/${id}`);
    if (response.success) return Boolean(response.data);
    throw new Error(response.message || 'Sayim emri silinemedi');
  },
};
