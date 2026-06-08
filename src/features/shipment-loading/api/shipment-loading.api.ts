import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  CreateOrUpdateShipmentLoadingSessionRequest,
  ShipmentLoadingDetail,
  ShipmentLoadingSession,
} from '../types/shipment-loading.types';

export const shipmentLoadingApi = {
  getPaged: async (params: PagedParams = {}): Promise<PagedResponse<ShipmentLoadingSession>> => {
    const response = await api.post<ApiResponse<PagedResponse<ShipmentLoadingSession>>>(
      '/api/ShipmentLoading/paged',
      buildPagedRequest(params),
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Shipment loading sessions could not be loaded.');
  },

  createOrUpdateSession: async (request: CreateOrUpdateShipmentLoadingSessionRequest): Promise<ShipmentLoadingDetail> => {
    const response = await api.post<ApiResponse<ShipmentLoadingDetail>>('/api/ShipmentLoading/session', request);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Shipment loading session could not be saved.');
  },

  stagePackage: async (sessionId: number, packageId: number, note?: string): Promise<ShipmentLoadingDetail> => {
    return shipmentLoadingApi.packageAction(sessionId, 'stage-package', packageId, note);
  },

  loadPackage: async (sessionId: number, packageId: number, note?: string): Promise<ShipmentLoadingDetail> => {
    return shipmentLoadingApi.packageAction(sessionId, 'load-package', packageId, note);
  },

  unloadPackage: async (sessionId: number, packageId: number, note?: string): Promise<ShipmentLoadingDetail> => {
    return shipmentLoadingApi.packageAction(sessionId, 'unload-package', packageId, note);
  },

  closeSession: async (sessionId: number): Promise<ShipmentLoadingDetail> => {
    const response = await api.post<ApiResponse<ShipmentLoadingDetail>>(`/api/ShipmentLoading/${sessionId}/close`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Shipment loading session could not be closed.');
  },

  packageAction: async (sessionId: number, action: string, packageId: number, note?: string): Promise<ShipmentLoadingDetail> => {
    const response = await api.post<ApiResponse<ShipmentLoadingDetail>>(`/api/ShipmentLoading/${sessionId}/${action}`, {
      packageId,
      note,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Package action failed.');
  },
};
