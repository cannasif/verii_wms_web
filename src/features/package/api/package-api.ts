import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import { getLocalizedText } from '@/lib/localized-error';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  PHeaderDto,
  CreatePHeaderDto,
  UpdatePHeaderDto,
  PPackageDto,
  CreatePPackageDto,
  UpdatePPackageDto,
  PLineDto,
  CreatePLineDto,
  UpdatePLineDto,
  PHeadersPagedResponse,
  PPackagesPagedResponse,
  PPackagesResponse,
  PLinesPagedResponse,
  PLinesResponse,
  StokBarcodeResponse,
  AvailableHeaderDto,
  AvailableHeadersResponse,
} from '../types/package';

export const packageApi = {
  getPHeadersPaged: async (params: PagedParams = {}): Promise<PagedResponse<PHeaderDto>> => {
    const requestBody = buildPagedRequest(params, { pageNumber: 1 });

    const response = await api.post<PHeadersPagedResponse>('/api/PHeader/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.packageHeadersLoadFailed'));
  },

  getPHeaderById: async (id: number): Promise<PHeaderDto> => {
    const response = await api.get<ApiResponse<PHeaderDto>>(`/api/PHeader/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.packageHeaderDetailLoadFailed'));
  },

  createPHeader: async (data: CreatePHeaderDto): Promise<number> => {
    const response = await api.post<ApiResponse<PHeaderDto | number>>('/api/PHeader', data);
    if (response.success && response.data) {
      if (typeof response.data === 'number') {
        return response.data;
      }
      if (typeof response.data === 'object' && 'id' in response.data) {
        return (response.data as PHeaderDto).id;
      }
      return 0;
    }
    throw new Error(response.message || getLocalizedText('common.errors.packageHeaderCreateFailed'));
  },

  updatePHeader: async (id: number, data: UpdatePHeaderDto): Promise<void> => {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([key]) => key !== 'sourceType' && key !== 'sourceHeaderId')
    ) as Omit<UpdatePHeaderDto, 'sourceType' | 'sourceHeaderId'>;
    const response = await api.put<ApiResponse<unknown>>(`/api/PHeader/${id}`, cleanData);
    if (!response.success) {
      throw new Error(response.message || getLocalizedText('common.errors.packageHeaderUpdateFailed'));
    }
  },

  deletePHeader: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/PHeader/${id}`);
    if (!response.success) {
      throw new Error(response.message || getLocalizedText('common.errors.packageHeaderDeleteFailed'));
    }
  },

  getPPackagesPaged: async (params: PagedParams = {}): Promise<PagedResponse<PPackageDto>> => {
    const requestBody = buildPagedRequest(params, { pageNumber: 1 });

    const response = await api.post<PPackagesPagedResponse>('/api/PPackage/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.packagesLoadFailed'));
  },

  getPPackageById: async (id: number): Promise<PPackageDto> => {
    const response = await api.get<ApiResponse<PPackageDto>>(`/api/PPackage/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.packageDetailLoadFailed'));
  },

  getPPackagesByHeader: async (packingHeaderId: number): Promise<PPackageDto[]> => {
    const response = await api.get<PPackagesResponse>(`/api/PPackage/header/${packingHeaderId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.packagesByHeaderLoadFailed'));
  },

  createPPackage: async (data: CreatePPackageDto): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/api/PPackage', data);
    if (response.success) {
      return response.data || 0;
    }
    throw new Error(response.message || getLocalizedText('common.errors.packageCreateFailed'));
  },

  updatePPackage: async (id: number, data: UpdatePPackageDto): Promise<void> => {
    const response = await api.put<ApiResponse<unknown>>(`/api/PPackage/${id}`, data);
    if (!response.success) {
      throw new Error(response.message || getLocalizedText('common.errors.packageUpdateFailed'));
    }
  },

  deletePPackage: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/PPackage/${id}`);
    if (!response.success) {
      throw new Error(response.message || getLocalizedText('common.errors.packageDeleteFailed'));
    }
  },

  getPLinesPaged: async (params: PagedParams = {}): Promise<PagedResponse<PLineDto>> => {
    const requestBody = buildPagedRequest(params, { pageNumber: 1 });

    const response = await api.post<PLinesPagedResponse>('/api/PLine/paged', requestBody);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.packageLinesLoadFailed'));
  },

  getPLineById: async (id: number): Promise<PLineDto> => {
    const response = await api.get<ApiResponse<PLineDto>>(`/api/PLine/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.packageLineDetailLoadFailed'));
  },

  getPLinesByHeader: async (packingHeaderId: number): Promise<PLineDto[]> => {
    const response = await api.get<PLinesResponse>(`/api/PLine/header/${packingHeaderId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.packageLinesByHeaderLoadFailed'));
  },

  getPLinesByPackage: async (packageId: number): Promise<PLineDto[]> => {
    const response = await api.get<PLinesResponse>(`/api/PLine/package/${packageId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.packageLinesByHeaderLoadFailed'));
  },

  createPLine: async (data: CreatePLineDto): Promise<number> => {
    const response = await api.post<ApiResponse<number>>('/api/PLine', data);
    if (response.success) {
      return response.data || 0;
    }
    throw new Error(response.message || getLocalizedText('common.errors.packageLineCreateFailed'));
  },

  updatePLine: async (id: number, data: UpdatePLineDto): Promise<void> => {
    const response = await api.put<ApiResponse<unknown>>(`/api/PLine/${id}`, data);
    if (!response.success) {
      throw new Error(response.message || getLocalizedText('common.errors.packageLineUpdateFailed'));
    }
  },

  deletePLine: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/PLine/${id}`);
    if (!response.success) {
      throw new Error(response.message || getLocalizedText('common.errors.packageLineDeleteFailed'));
    }
  },

  getStokBarcode: async (barcode: string, barcodeGroup: string = '1'): Promise<StokBarcodeResponse> => {
    return await api.get<StokBarcodeResponse>('/api/Erp/getStokBarcode', {
      params: { bar: barcode, barkodGrubu: barcodeGroup }
    });
  },

  getAvailableHeadersForMapping: async (sourceType: string): Promise<AvailableHeaderDto[]> => {
    const response = await api.get<AvailableHeadersResponse>(`/api/PHeader/available-for-mapping/${sourceType}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.availableHeadersLoadFailed'));
  },

  matchPlines: async (pHeaderId: number, isMatched: boolean): Promise<boolean> => {
    const response = await api.post<ApiResponse<boolean>>(`/api/PHeader/${pHeaderId}/match-plines`, {
      isMatched,
    });
    if (response.success) {
      return response.data ?? false;
    }
    throw new Error(response.message || getLocalizedText('common.errors.packageMatchFailed'));
  },
};
