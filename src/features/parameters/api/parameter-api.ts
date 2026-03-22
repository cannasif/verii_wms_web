import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse } from '@/types/api';
import type { PagedResponse } from '@/types/api';
import type {
  Parameter,
  ParameterResponse,
  CreateParameterRequest,
  UpdateParameterRequest,
  ParameterType,
} from '../types/parameter';
import { PARAMETER_TYPES } from '../types/parameter';

type ParameterApiErrorPayload = {
  exceptionMessage?: string;
  message?: string;
};

type ParameterApiError = {
  response?: {
    status?: number;
    config?: { url?: string };
    data?: ParameterApiErrorPayload;
  };
  message?: string;
};

const getEndpoint = (type: ParameterType): string => {
  return PARAMETER_TYPES[type].endpoint;
};

const normalizePagedData = (paged: unknown): Parameter[] => {
  const raw = paged as { data?: Parameter[]; items?: Parameter[] };
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
};

const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  const apiError = error as ParameterApiError;
  return apiError.response?.data?.exceptionMessage || apiError.response?.data?.message || apiError.message || fallback;
};

export const parameterApi = {
  getPaged: async (
    type: ParameterType,
    params: {
      pageNumber?: number;
      pageSize?: number;
      sortBy?: string;
      sortDirection?: string;
      filters?: Array<{ column: string; operator: string; value: string }>;
      filterLogic?: 'and' | 'or';
    } = {}
  ): Promise<PagedResponse<Parameter>> => {
    const endpoint = getEndpoint(type);
    const requestBody = buildPagedRequest(params, { pageNumber: 1, pageSize: 1000 });

    const response = await api.post<ApiResponse<PagedResponse<Parameter>>>(`/api/${endpoint}/paged`, requestBody);
    if (response.success && response.data) {
      const normalizedData = normalizePagedData(response.data);
      return { ...response.data, data: normalizedData };
    }
    throw new Error(response.message || 'Parametreler yüklenemedi');
  },

  getAll: async (type: ParameterType): Promise<Parameter[]> => {
    const paged = await parameterApi.getPaged(type, { pageNumber: 1, pageSize: 1000 });
    return paged.data ?? [];
  },

  getFirst: async (type: ParameterType): Promise<Parameter | null> => {
    try {
      const paged = await parameterApi.getPaged(type, { pageNumber: 1, pageSize: 1, sortBy: 'Id', sortDirection: 'desc' });
      if (paged.data && paged.data.length > 0) return paged.data[0];
      return null;
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; config?: { url?: string } } };
        if (axiosError.response?.status === 404) {
          console.warn(`Parameter endpoint not found: ${axiosError.response?.config?.url}`);
          return null;
        }
      }
      throw error;
    }
  },

  getById: async (type: ParameterType, id: number): Promise<Parameter> => {
    const endpoint = getEndpoint(type);
    const response = await api.get<ParameterResponse>(`/api/${endpoint}/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Parametre yüklenemedi');
  },

  create: async (type: ParameterType, data: CreateParameterRequest): Promise<number> => {
    const endpoint = getEndpoint(type);
    try {
      const response = await api.post<ApiResponse<number>>(`/api/${endpoint}`, data);
      if (response.success) {
        return response.data || 0;
      }
      const errorMessage = response.exceptionMessage || response.message || 'Parametre oluşturulamadı';
      throw new Error(errorMessage);
    } catch (error: unknown) {
      throw new Error(extractApiErrorMessage(error, 'Parametre oluşturulamadı'));
    }
  },

  update: async (type: ParameterType, id: number, data: UpdateParameterRequest): Promise<void> => {
    const endpoint = getEndpoint(type);
    try {
      const response = await api.put<ApiResponse<unknown>>(`/api/${endpoint}/${id}`, data);
      if (!response.success) {
        const errorMessage = response.exceptionMessage || response.message || 'Parametre güncellenemedi';
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      throw new Error(extractApiErrorMessage(error, 'Parametre güncellenemedi'));
    }
  },

  upsert: async (type: ParameterType, data: CreateParameterRequest | UpdateParameterRequest): Promise<void> => {
    const existing = await parameterApi.getFirst(type);
    
    if (existing) {
      await parameterApi.update(type, existing.id, data);
    } else {
      await parameterApi.create(type, data);
    }
  },

  delete: async (type: ParameterType, id: number): Promise<void> => {
    const endpoint = getEndpoint(type);
    const response = await api.delete<ApiResponse<boolean>>(`/api/${endpoint}/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Parametre silinemedi');
    }
  },
};
