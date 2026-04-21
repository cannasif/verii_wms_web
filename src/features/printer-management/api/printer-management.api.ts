import { api } from '@/lib/axios';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse } from '@/types/api';
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

export const printerManagementApi = {
  async getPrinters(options?: ApiRequestOptions): Promise<ApiResponse<PrinterDefinition[]>> {
    return await api.get<ApiResponse<PrinterDefinition[]>>('/api/PrinterManagement/printers', options);
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
    return await api.get<ApiResponse<PrinterProfile[]>>('/api/PrinterManagement/profiles', {
      ...options,
      params: printerDefinitionId ? { printerDefinitionId } : undefined,
    });
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
    return await api.get<ApiResponse<BarcodeTemplatePrinterProfileMap[]>>(`/api/PrinterManagement/template-printer-profiles/${templateId}`, options);
  },

  async upsertTemplatePrinterProfile(payload: BarcodeTemplatePrinterProfileMapUpsertRequest, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeTemplatePrinterProfileMap>> {
    return await api.post<ApiResponse<BarcodeTemplatePrinterProfileMap>>('/api/PrinterManagement/template-printer-profiles', payload, options);
  },

  async getPrintJobs(take = 100, options?: ApiRequestOptions): Promise<ApiResponse<PrintJob[]>> {
    return await api.get<ApiResponse<PrintJob[]>>('/api/PrinterManagement/jobs', {
      ...options,
      params: { take },
    });
  },

  async createPrintJob(payload: PrintJobCreateRequest, options?: ApiRequestOptions): Promise<ApiResponse<PrintJob>> {
    return await api.post<ApiResponse<PrintJob>>('/api/PrinterManagement/jobs', payload, options);
  },

  async retryPrintJob(id: number, options?: ApiRequestOptions): Promise<ApiResponse<PrintJob>> {
    return await api.post<ApiResponse<PrintJob>>(`/api/PrinterManagement/jobs/${id}/retry`, null, options);
  },
};
