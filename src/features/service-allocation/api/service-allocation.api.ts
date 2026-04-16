import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  AllocationRecomputeResponse,
  AllocationQueueRow,
  BusinessDocumentLinkRow,
  CreateServiceCaseLineRequest,
  CreateServiceCaseRequest,
  ServiceCaseRow,
  ServiceCaseTimelineResponse,
  UpdateServiceCaseRequest,
} from '../types/service-allocation.types';

export const serviceAllocationApi = {
  async getServiceCases(params: PagedParams = {}): Promise<PagedResponse<ServiceCaseRow>> {
    const response = await api.post<ApiResponse<PagedResponse<ServiceCaseRow>>>(
      '/api/ServiceCase/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );

    return response.data ?? {
      data: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 20,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  },

  async getAllocationQueue(params: PagedParams = {}): Promise<PagedResponse<AllocationQueueRow>> {
    const response = await api.post<ApiResponse<PagedResponse<AllocationQueueRow>>>(
      '/api/OrderAllocationLine/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );

    return response.data ?? {
      data: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 20,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  },

  async getDocumentLinks(params: PagedParams = {}): Promise<PagedResponse<BusinessDocumentLinkRow>> {
    const response = await api.post<ApiResponse<PagedResponse<BusinessDocumentLinkRow>>>(
      '/api/BusinessDocumentLink/paged',
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
    );

    return response.data ?? {
      data: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 20,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };
  },

  async getServiceCaseTimeline(id: number): Promise<ServiceCaseTimelineResponse> {
    const response = await api.get<ApiResponse<ServiceCaseTimelineResponse>>(`/api/ServiceCase/${id}/timeline`);
    if (!response.data) {
      throw new Error(response.message || 'Service case timeline could not be loaded.');
    }

    return response.data;
  },

  async recomputeAllocation(stockId: number, availableQuantity = 0): Promise<AllocationRecomputeResponse> {
    const response = await api.post<ApiResponse<AllocationRecomputeResponse>>('/api/OrderAllocationLine/recompute', {
      stockId,
      availableQuantity,
    });

    if (!response.data) {
      throw new Error(response.message || 'Allocation recompute could not be completed.');
    }

    return response.data;
  },

  async getServiceCase(id: number): Promise<ServiceCaseRow> {
    const response = await api.get<ApiResponse<ServiceCaseRow>>(`/api/ServiceCase/${id}`);
    if (!response.data) {
      throw new Error(response.message || 'Service case could not be loaded.');
    }

    return response.data;
  },

  async createServiceCase(payload: CreateServiceCaseRequest): Promise<ServiceCaseRow> {
    const response = await api.post<ApiResponse<ServiceCaseRow>>('/api/ServiceCase', payload);
    if (!response.data) {
      throw new Error(response.message || 'Service case could not be created.');
    }

    return response.data;
  },

  async updateServiceCase(id: number, payload: UpdateServiceCaseRequest): Promise<ServiceCaseRow> {
    const response = await api.put<ApiResponse<ServiceCaseRow>>(`/api/ServiceCase/${id}`, payload);
    if (!response.data) {
      throw new Error(response.message || 'Service case could not be updated.');
    }

    return response.data;
  },

  async createServiceCaseLine(payload: CreateServiceCaseLineRequest) {
    const response = await api.post<ApiResponse<unknown>>('/api/ServiceCaseLine', payload);
    if (!response.success) {
      throw new Error(response.message || 'Service case line could not be created.');
    }

    return response;
  },
};
