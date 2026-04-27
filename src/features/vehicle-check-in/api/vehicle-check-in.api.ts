import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import { getLocalizedText } from '@/lib/localized-error';
import type {
  CreateOrUpdateVehicleCheckInDto,
  VehicleCheckInHeaderDto,
  VehicleCheckInImageDto,
  VehicleCheckInPagedRowDto,
} from '../types/vehicle-check-in.types';

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && response.data !== undefined && response.data !== null) {
    return response.data;
  }

  throw new Error(response.message || response.exceptionMessage || getLocalizedText('common.errors.unknown'));
}

export const vehicleCheckInApi = {
  async findTodayByPlate(plateNo: string): Promise<VehicleCheckInHeaderDto> {
    const response = await api.get<ApiResponse<VehicleCheckInHeaderDto>>('/api/VehicleCheckIn/today-by-plate', {
      params: { plateNo },
    });
    return extractData(response);
  },

  async save(dto: CreateOrUpdateVehicleCheckInDto): Promise<VehicleCheckInHeaderDto> {
    const response = await api.post<ApiResponse<VehicleCheckInHeaderDto>>('/api/VehicleCheckIn/save', dto);
    return extractData(response);
  },

  async getById(id: number): Promise<VehicleCheckInHeaderDto> {
    const response = await api.get<ApiResponse<VehicleCheckInHeaderDto>>(`/api/VehicleCheckIn/${id}`);
    return extractData(response);
  },

  async getPaged(params: PagedParams = {}): Promise<PagedResponse<VehicleCheckInPagedRowDto>> {
    const response = await api.post<ApiResponse<PagedResponse<VehicleCheckInPagedRowDto>>>(
      '/api/VehicleCheckIn/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'EntryDate', sortDirection: 'desc' }),
    );
    return extractData(response);
  },

  async uploadImages(headerId: number, files: File[]): Promise<VehicleCheckInImageDto[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await api.post<ApiResponse<VehicleCheckInImageDto[]>>(
      `/api/VehicleCheckIn/${headerId}/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    return extractData(response);
  },

  async deleteImage(imageId: number): Promise<boolean> {
    const response = await api.delete<ApiResponse<boolean>>(`/api/VehicleCheckIn/images/${imageId}`);
    return extractData(response);
  },
};
