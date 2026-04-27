import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import { getLocalizedText } from '@/lib/localized-error';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  CreateSteelGoodReciptAcceptanseReceiptDto,
  SteelGoodReciptAcceptanseCommitImportDto,
  SteelGoodReciptAcceptanseHeaderDto,
  SteelGoodReciptAcceptanseInspectionBatchSearchDto,
  SteelGoodReciptAcceptanseImportPreviewDto,
  SteelGoodReciptAcceptanseImportPreviewRequestDto,
  SteelGoodReciptAcceptanseLineDetailDto,
  SteelGoodReciptAcceptanseLineListItemDto,
  SteelGoodReciptAcceptanseLocationOccupancyItemDto,
  SteelGoodReciptAcceptansePlacementDto,
  SteelGoodReciptAcceptansePhotoDto,
  SteelGoodReciptAcceptanseReceiptHeaderDto,
  SaveSteelGoodReciptAcceptansePlacementDto,
  SaveSteelGoodReciptAcceptanseInspectionDto,
} from '../types/steel-good-recipt-acceptanse.types';

export const steelGoodReciptAcceptanseApi = {
  async previewImport(dto: SteelGoodReciptAcceptanseImportPreviewRequestDto): Promise<SteelGoodReciptAcceptanseImportPreviewDto> {
    const response = await api.post<ApiResponse<SteelGoodReciptAcceptanseImportPreviewDto>>('/api/SteelGoodReciptAcceptanse/import/preview', dto);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async commitImport(dto: SteelGoodReciptAcceptanseCommitImportDto): Promise<SteelGoodReciptAcceptanseHeaderDto> {
    const response = await api.post<ApiResponse<SteelGoodReciptAcceptanseHeaderDto>>('/api/SteelGoodReciptAcceptanse/import/commit', dto);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async getLinesPaged(params: PagedParams = {}): Promise<PagedResponse<SteelGoodReciptAcceptanseLineListItemDto>> {
    const response = await api.post<ApiResponse<PagedResponse<SteelGoodReciptAcceptanseLineListItemDto>>>(
      '/api/SteelGoodReciptAcceptanse/lines/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async getHeadersPaged(params: PagedParams = {}): Promise<PagedResponse<SteelGoodReciptAcceptanseHeaderDto>> {
    const response = await api.post<ApiResponse<PagedResponse<SteelGoodReciptAcceptanseHeaderDto>>>(
      '/api/SteelGoodReciptAcceptanse/headers/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async searchBySerial(serialNo: string): Promise<SteelGoodReciptAcceptanseLineListItemDto[]> {
    const response = await api.get<ApiResponse<SteelGoodReciptAcceptanseLineListItemDto[]>>('/api/SteelGoodReciptAcceptanse/lines/search-by-serial', {
      params: { serialNo },
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async searchInspectionBatches(uniqueValue: string): Promise<SteelGoodReciptAcceptanseInspectionBatchSearchDto[]> {
    const response = await api.get<ApiResponse<SteelGoodReciptAcceptanseInspectionBatchSearchDto[]>>('/api/SteelGoodReciptAcceptanse/inspection/search-by-batch', {
      params: { uniqueValue },
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async getLineDetail(id: number): Promise<SteelGoodReciptAcceptanseLineDetailDto> {
    const response = await api.get<ApiResponse<SteelGoodReciptAcceptanseLineDetailDto>>(`/api/SteelGoodReciptAcceptanse/lines/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async saveInspection(dto: SaveSteelGoodReciptAcceptanseInspectionDto): Promise<SteelGoodReciptAcceptanseLineDetailDto> {
    const response = await api.post<ApiResponse<SteelGoodReciptAcceptanseLineDetailDto>>('/api/SteelGoodReciptAcceptanse/inspection/save', dto);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async getReceiptCandidatesPaged(params: PagedParams = {}): Promise<PagedResponse<SteelGoodReciptAcceptanseLineListItemDto>> {
    const response = await api.post<ApiResponse<PagedResponse<SteelGoodReciptAcceptanseLineListItemDto>>>(
      '/api/SteelGoodReciptAcceptanse/receipt/candidates/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 50, sortBy: 'Id', sortDirection: 'desc' }),
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async getReceiptHeadersPaged(params: PagedParams = {}): Promise<PagedResponse<SteelGoodReciptAcceptanseReceiptHeaderDto>> {
    const response = await api.post<ApiResponse<PagedResponse<SteelGoodReciptAcceptanseReceiptHeaderDto>>>(
      '/api/SteelGoodReciptAcceptanse/receipt/headers/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async createReceipt(dto: CreateSteelGoodReciptAcceptanseReceiptDto): Promise<SteelGoodReciptAcceptanseReceiptHeaderDto> {
    const response = await api.post<ApiResponse<SteelGoodReciptAcceptanseReceiptHeaderDto>>('/api/SteelGoodReciptAcceptanse/receipt/create', dto);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async getPlacementCandidatesPaged(params: PagedParams = {}): Promise<PagedResponse<SteelGoodReciptAcceptanseLineListItemDto>> {
    const response = await api.post<ApiResponse<PagedResponse<SteelGoodReciptAcceptanseLineListItemDto>>>(
      '/api/SteelGoodReciptAcceptanse/placement/candidates/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 50, sortBy: 'Id', sortDirection: 'desc' }),
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async getLocationOccupancy(warehouseId: number, shelfId?: number | null, areaCode?: string | null): Promise<SteelGoodReciptAcceptanseLocationOccupancyItemDto[]> {
    const response = await api.get<ApiResponse<SteelGoodReciptAcceptanseLocationOccupancyItemDto[]>>('/api/SteelGoodReciptAcceptanse/placement/location-occupancy', {
      params: { warehouseId, shelfId, areaCode },
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async savePlacement(dto: SaveSteelGoodReciptAcceptansePlacementDto): Promise<SteelGoodReciptAcceptansePlacementDto> {
    const response = await api.post<ApiResponse<SteelGoodReciptAcceptansePlacementDto>>('/api/SteelGoodReciptAcceptanse/placement/save', dto);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async uploadInspectionPhotos(lineId: number, files: File[], captions: string[] = []): Promise<SteelGoodReciptAcceptansePhotoDto[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    captions.forEach((caption) => formData.append('captions', caption));

    const response = await api.post<ApiResponse<SteelGoodReciptAcceptansePhotoDto[]>>(
      `/api/SteelGoodReciptAcceptanse/inspection/photos/${lineId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },

  async deleteInspectionPhoto(photoId: number): Promise<boolean> {
    const response = await api.delete<ApiResponse<boolean>>(`/api/SteelGoodReciptAcceptanse/inspection/photos/${photoId}`);
    if (response.success) {
      return true;
    }
    throw new Error(response.message || getLocalizedText('common.errors.unknown'));
  },
};
