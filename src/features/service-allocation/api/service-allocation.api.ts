import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  AllocationRecomputeResponse,
  AllocationQueueRow,
  AssignServiceCaseRequest,
  BusinessDocumentLinkRow,
  CompleteServiceCaseWorkRequest,
  CreateServiceCaseLineRequest,
  CreateServiceCaseRequest,
  GenerateServiceCaseDispositionDocumentRequest,
  RegisterServiceCaseDispositionLinkRequest,
  ServiceCaseAssignmentRow,
  ServiceCaseDispositionPlan,
  ServiceCaseRow,
  ServiceCaseTimelineResponse,
  ServiceCaseWorkSessionRow,
  StartServiceCaseWorkRequest,
  UpdateServiceCaseRequest,
} from '../types/service-allocation.types';

export const serviceAllocationApi = {
  async getServiceCases(params: PagedParams = {}): Promise<PagedResponse<ServiceCaseRow>> {
    const response = await api.post<ApiResponse<PagedResponse<ServiceCaseRow>>>(
      '/api/ServiceCase/paged',
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
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
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
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
      buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' }),
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

  async getServiceCaseDispositionPlan(id: number): Promise<ServiceCaseDispositionPlan> {
    const response = await api.get<ApiResponse<ServiceCaseDispositionPlan>>(`/api/ServiceCase/${id}/disposition-plan`);
    if (!response.data) {
      throw new Error(response.message || 'Service case disposition plan could not be loaded.');
    }

    return response.data;
  },

  async registerServiceCaseDispositionLink(
    id: number,
    payload: RegisterServiceCaseDispositionLinkRequest,
  ): Promise<BusinessDocumentLinkRow> {
    const response = await api.post<ApiResponse<BusinessDocumentLinkRow>>(`/api/ServiceCase/${id}/disposition-link`, payload);
    if (!response.data) {
      throw new Error(response.message || 'Service case disposition document could not be linked.');
    }

    return response.data;
  },

  async generateServiceCaseDispositionDocument(
    id: number,
    payload: GenerateServiceCaseDispositionDocumentRequest,
  ): Promise<BusinessDocumentLinkRow> {
    const response = await api.post<ApiResponse<BusinessDocumentLinkRow>>(
      `/api/ServiceCase/${id}/generate-disposition-document`,
      payload,
    );
    if (!response.data) {
      throw new Error(response.message || 'Service case disposition document could not be generated.');
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

  async deleteServiceCase(id: number): Promise<ApiResponse<boolean>> {
    return await api.delete<ApiResponse<boolean>>(`/api/ServiceCase/${id}`);
  },

  async assignServiceCase(id: number, payload: AssignServiceCaseRequest): Promise<ServiceCaseAssignmentRow> {
    const response = await api.post<ApiResponse<ServiceCaseAssignmentRow>>(`/api/ServiceCase/${id}/assign`, payload);
    if (!response.data) {
      throw new Error(response.message || 'Service case could not be assigned.');
    }

    return response.data;
  },

  async startServiceCaseWork(id: number, payload: StartServiceCaseWorkRequest): Promise<ServiceCaseWorkSessionRow> {
    const formData = new FormData();
    formData.append('assignmentId', String(payload.assignmentId));
    if (payload.startNote) {
      formData.append('startNote', payload.startNote);
    }
    payload.beforeRepairPhotos.forEach((file) => formData.append('beforeRepairPhotos', file));

    const response = await api.post<ApiResponse<ServiceCaseWorkSessionRow>>(`/api/ServiceCase/${id}/start-work`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!response.data) {
      throw new Error(response.message || 'Service work could not be started.');
    }

    return response.data;
  },

  async completeServiceCaseWork(id: number, payload: CompleteServiceCaseWorkRequest): Promise<ServiceCaseWorkSessionRow> {
    const formData = new FormData();
    formData.append('workSessionId', String(payload.workSessionId));
    formData.append('decisionType', String(payload.decisionType));
    if (payload.decisionReason) {
      formData.append('decisionReason', payload.decisionReason);
    }
    if (payload.resolutionNote) {
      formData.append('resolutionNote', payload.resolutionNote);
    }
    if (payload.completionNote) {
      formData.append('completionNote', payload.completionNote);
    }
    payload.completionMedia.forEach((file) => formData.append('completionMedia', file));

    const response = await api.post<ApiResponse<ServiceCaseWorkSessionRow>>(`/api/ServiceCase/${id}/complete-work`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!response.data) {
      throw new Error(response.message || 'Service work could not be completed.');
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
