import { api } from '@/lib/axios';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse, PagedResponse } from '@/types/api';
import { buildPagedRequest } from '@/lib/paged';
import { fetchAllPagedData } from '@/lib/fetch-all-paged-data';
import type {
  BarcodeTemplatePrinterProfileMap,
  BarcodeTemplatePrinterProfileMapUpsertRequest,
  PrinterDefinition,
  PrinterDefinitionUpsertRequest,
  PrinterProfile,
  PrinterProfileUpsertRequest,
  PrintJob,
  PrintJobCreateRequest,
} from '../types/printer-management.types';

async function getAllPaged<T>(
  url: string,
  options?: ApiRequestOptions,
  params?: Record<string, number>,
  sortBy = 'Id',
  sortDirection: 'asc' | 'desc' = 'desc',
): Promise<ApiResponse<T[]>> {
  let firstResponse: ApiResponse<PagedResponse<T>> | undefined;
  const data = await fetchAllPagedData({
    fetchPage: async (pageNumber, pageSize) => {
      const response = await api.post<ApiResponse<PagedResponse<T>>>(
        url,
        buildPagedRequest({ pageNumber, pageSize, sortBy, sortDirection }),
        { ...options, params },
      );
      if (!response.success || !response.data) {
        throw new Error(response.message);
      }
      firstResponse ??= response;
      return response.data;
    },
  });

  return { ...firstResponse!, data };
}

export const printerManagementApi = {
  async getPrinters(options?: ApiRequestOptions): Promise<ApiResponse<PrinterDefinition[]>> {
    return getAllPaged<PrinterDefinition>('/api/PrinterManagement/printers/paged', options, undefined, 'DisplayName', 'asc');
  },

  async createPrinter(payload: PrinterDefinitionUpsertRequest, options?: ApiRequestOptions): Promise<ApiResponse<PrinterDefinition>> {
    return await api.post<ApiResponse<PrinterDefinition>>('/api/PrinterManagement/printers', payload, options);
  },

  async updatePrinter(id: number, payload: PrinterDefinitionUpsertRequest, options?: ApiRequestOptions): Promise<ApiResponse<PrinterDefinition>> {
    return await api.put<ApiResponse<PrinterDefinition>>(`/api/PrinterManagement/printers/${id}`, payload, options);
  },

  async setPrinterActive(id: number, isActive: boolean, options?: ApiRequestOptions): Promise<ApiResponse<PrinterDefinition>> {
    return await api.patch<ApiResponse<PrinterDefinition>>(`/api/PrinterManagement/printers/${id}/active`, { isActive }, options);
  },

  async getProfiles(printerDefinitionId?: number, options?: ApiRequestOptions): Promise<ApiResponse<PrinterProfile[]>> {
    return getAllPaged<PrinterProfile>(
      '/api/PrinterManagement/profiles/paged',
      options,
      printerDefinitionId ? { printerDefinitionId } : undefined,
      'DisplayName',
      'asc',
    );
  },

  async createProfile(payload: PrinterProfileUpsertRequest, options?: ApiRequestOptions): Promise<ApiResponse<PrinterProfile>> {
    return await api.post<ApiResponse<PrinterProfile>>('/api/PrinterManagement/profiles', payload, options);
  },

  async updateProfile(id: number, payload: PrinterProfileUpsertRequest, options?: ApiRequestOptions): Promise<ApiResponse<PrinterProfile>> {
    return await api.put<ApiResponse<PrinterProfile>>(`/api/PrinterManagement/profiles/${id}`, payload, options);
  },

  async setProfileActive(id: number, isActive: boolean, options?: ApiRequestOptions): Promise<ApiResponse<PrinterProfile>> {
    return await api.patch<ApiResponse<PrinterProfile>>(`/api/PrinterManagement/profiles/${id}/active`, { isActive }, options);
  },

  async getTemplatePrinterProfiles(templateId: number, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeTemplatePrinterProfileMap[]>> {
    return getAllPaged<BarcodeTemplatePrinterProfileMap>(`/api/PrinterManagement/template-printer-profiles/${templateId}/paged`, options);
  },

  async upsertTemplatePrinterProfile(payload: BarcodeTemplatePrinterProfileMapUpsertRequest, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeTemplatePrinterProfileMap>> {
    return await api.post<ApiResponse<BarcodeTemplatePrinterProfileMap>>('/api/PrinterManagement/template-printer-profiles', payload, options);
  },

  async getPrintJobs(take = 100, options?: ApiRequestOptions): Promise<ApiResponse<PrintJob[]>> {
    const response = await getAllPaged<PrintJob>('/api/PrinterManagement/jobs/paged', options, undefined, 'RequestedAt', 'desc');
    return { ...response, data: response.data.slice(0, Math.max(1, take)) };
  },

  async createPrintJob(payload: PrintJobCreateRequest, options?: ApiRequestOptions): Promise<ApiResponse<PrintJob>> {
    return await api.post<ApiResponse<PrintJob>>('/api/PrinterManagement/jobs', payload, options);
  },

  async retryPrintJob(id: number, options?: ApiRequestOptions): Promise<ApiResponse<PrintJob>> {
    return await api.post<ApiResponse<PrintJob>>(`/api/PrinterManagement/jobs/${id}/retry`, null, options);
  },
};
