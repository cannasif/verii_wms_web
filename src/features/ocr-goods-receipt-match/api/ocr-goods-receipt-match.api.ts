import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import { getLocalizedText } from '@/lib/localized-error';
import type {
  CreateOcrGoodsReceiptCustomerStockMatchDto,
  OcrGoodsReceiptCustomerStockMatchDto,
  OcrGoodsReceiptCustomerStockMatchPagedRowDto,
  UpdateOcrGoodsReceiptCustomerStockMatchDto,
} from '../types/ocr-goods-receipt-match.types';

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && response.data !== undefined && response.data !== null) {
    return response.data;
  }

  throw new Error(response.message || response.exceptionMessage || getLocalizedText('common.errors.unknown'));
}

function buildPagedQueryParams(params: PagedParams = {}): URLSearchParams {
  const request = buildPagedRequest(params, { pageNumber: 1, pageSize: 20, sortBy: 'Id', sortDirection: 'desc' });
  const searchParams = new URLSearchParams();

  searchParams.set('pageNumber', String(request.pageNumber));
  searchParams.set('pageSize', String(request.pageSize));
  searchParams.set('sortBy', request.sortBy);
  searchParams.set('sortDirection', request.sortDirection);
  searchParams.set('search', request.search);
  searchParams.set('filterLogic', request.filterLogic);

  request.filters.forEach((filter, index) => {
    searchParams.set(`filters[${index}].column`, filter.column);
    searchParams.set(`filters[${index}].operator`, filter.operator);
    searchParams.set(`filters[${index}].value`, filter.value);
  });

  return searchParams;
}

export const ocrGoodsReceiptMatchApi = {
  async create(dto: CreateOcrGoodsReceiptCustomerStockMatchDto): Promise<OcrGoodsReceiptCustomerStockMatchDto> {
    const response = await api.post<ApiResponse<OcrGoodsReceiptCustomerStockMatchDto>>('/api/OcrGoodsReceiptMatch', dto);
    return extractData(response);
  },

  async update(id: number, dto: UpdateOcrGoodsReceiptCustomerStockMatchDto): Promise<OcrGoodsReceiptCustomerStockMatchDto> {
    const response = await api.put<ApiResponse<OcrGoodsReceiptCustomerStockMatchDto>>(`/api/OcrGoodsReceiptMatch/${id}`, dto);
    return extractData(response);
  },

  async getById(id: number): Promise<OcrGoodsReceiptCustomerStockMatchDto> {
    const response = await api.get<ApiResponse<OcrGoodsReceiptCustomerStockMatchDto>>(`/api/OcrGoodsReceiptMatch/${id}`);
    return extractData(response);
  },

  async getPaged(params: PagedParams = {}): Promise<PagedResponse<OcrGoodsReceiptCustomerStockMatchPagedRowDto>> {
    const response = await api.get<ApiResponse<PagedResponse<OcrGoodsReceiptCustomerStockMatchPagedRowDto>>>('/api/OcrGoodsReceiptMatch/paged', {
      params: buildPagedQueryParams(params),
    });
    return extractData(response);
  },

  async remove(id: number): Promise<boolean> {
    const response = await api.delete<ApiResponse<boolean>>(`/api/OcrGoodsReceiptMatch/${id}`);
    return extractData(response);
  },
};
