import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import { getLocalizedText } from '@/lib/localized-error';
import type {
  ApiResponse,
  CreateTransferChainDto,
  CreateTransferChainStepDto,
  PagedParams,
  PagedResponse,
  TransferChainDto,
  TransferChainPagedRowDto,
  TransferChainReadinessDto,
  TransferChainStepDto,
  UpdateTransferChainDto,
  UpdateTransferChainStepDto,
} from '../types/transfer-chain.types';

function extractData<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined) {
    throw new Error(response.message || response.exceptionMessage || getLocalizedText('common.errors.requestFailed'));
  }
  return response.data;
}

function normalizePaged<T>(response: PagedResponse<T>): PagedResponse<T> {
  const raw = response as PagedResponse<T> & { items?: T[] };
  if (raw.items && !raw.data) {
    return { ...response, data: raw.items };
  }
  return response;
}

export const transferChainApi = {
  getList: async (params: PagedParams): Promise<PagedResponse<TransferChainPagedRowDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<TransferChainPagedRowDto>>>(
      '/api/TransferChain/paged',
      buildPagedRequest(params, {
        pageNumber: 0,
        pageSize: 20,
        sortBy: 'Id',
        sortDirection: 'desc',
      }),
    );
    return normalizePaged(extractData(response as ApiResponse<PagedResponse<TransferChainPagedRowDto>>));
  },

  getById: async (id: number): Promise<TransferChainDto> => {
    const response = await api.get<ApiResponse<TransferChainDto>>(`/api/TransferChain/${id}`);
    return extractData(response as ApiResponse<TransferChainDto>);
  },

  create: async (dto: CreateTransferChainDto): Promise<TransferChainDto> => {
    const response = await api.post<ApiResponse<TransferChainDto>>('/api/TransferChain', dto);
    return extractData(response as ApiResponse<TransferChainDto>);
  },

  update: async (id: number, dto: UpdateTransferChainDto): Promise<TransferChainDto> => {
    const response = await api.put<ApiResponse<TransferChainDto>>(`/api/TransferChain/${id}`, dto);
    return extractData(response as ApiResponse<TransferChainDto>);
  },

  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/TransferChain/${id}`);
    const payload = response as ApiResponse<boolean>;
    if (!payload.success) {
      throw new Error(payload.message || payload.exceptionMessage || getLocalizedText('common.errors.deleteFailed'));
    }
  },

  addStep: async (chainId: number, dto: CreateTransferChainStepDto): Promise<TransferChainStepDto> => {
    const response = await api.post<ApiResponse<TransferChainStepDto>>(`/api/TransferChain/${chainId}/steps`, dto);
    return extractData(response as ApiResponse<TransferChainStepDto>);
  },

  updateStep: async (stepId: number, dto: UpdateTransferChainStepDto): Promise<TransferChainStepDto> => {
    const response = await api.put<ApiResponse<TransferChainStepDto>>(`/api/TransferChain/steps/${stepId}`, dto);
    return extractData(response as ApiResponse<TransferChainStepDto>);
  },

  deleteStep: async (stepId: number): Promise<void> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/TransferChain/steps/${stepId}`);
    const payload = response as ApiResponse<boolean>;
    if (!payload.success) {
      throw new Error(payload.message || payload.exceptionMessage || getLocalizedText('common.errors.deleteFailed'));
    }
  },

  getReadiness: async (sourceType: string, sourceHeaderId: number): Promise<TransferChainReadinessDto> => {
    const response = await api.get<ApiResponse<TransferChainReadinessDto>>(`/api/TransferChain/readiness/${sourceType}/${sourceHeaderId}`);
    return extractData(response as ApiResponse<TransferChainReadinessDto>);
  },
};
