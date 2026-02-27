import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type {
  Parameter,
  ParametersResponse,
  ParameterResponse,
  CreateParameterRequest,
  UpdateParameterRequest,
  ParameterType,
} from '../types/parameter';
import { PARAMETER_TYPES } from '../types/parameter';

const getEndpoint = (type: ParameterType): string => {
  return PARAMETER_TYPES[type].endpoint;
};

export const parameterApi = {
  getAll: async (type: ParameterType): Promise<Parameter[]> => {
    const endpoint = getEndpoint(type);
    const response = await api.get<ParametersResponse>(`/api/${endpoint}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Parametreler yüklenemedi');
  },

  getFirst: async (type: ParameterType): Promise<Parameter | null> => {
    try {
      const endpoint = getEndpoint(type);
      const url = `/api/${endpoint}`;
      const response = await api.get<ParametersResponse>(url);
      if (response.success && response.data && response.data.length > 0) {
        return response.data[0];
      }
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
    } catch (error: any) {
      if (error?.response?.data) {
        const apiError = error.response.data;
        const errorMessage = apiError.exceptionMessage || apiError.message || 'Parametre oluşturulamadı';
        throw new Error(errorMessage);
      }
      throw error;
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
    } catch (error: any) {
      if (error?.response?.data) {
        const apiError = error.response.data;
        const errorMessage = apiError.exceptionMessage || apiError.message || 'Parametre güncellenemedi';
        throw new Error(errorMessage);
      }
      throw error;
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

