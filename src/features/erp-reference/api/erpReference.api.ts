import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type {
  CustomerReferenceDto,
  ErpReferenceKind,
  StockReferenceDto,
  WarehouseReferenceDto,
  YapKodReferenceDto,
} from '../types/erpReference.types';

function normalizeCustomer(row: Record<string, unknown>): CustomerReferenceDto {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    branchCode: row.branchCode ? String(row.branchCode) : row.BranchCode ? String(row.BranchCode) : undefined,
    customerCode: String(row.customerCode ?? row.CustomerCode ?? ''),
    customerName: String(row.customerName ?? row.CustomerName ?? ''),
    city: row.city ? String(row.city) : row.City ? String(row.City) : undefined,
    phone1: row.phone1 ? String(row.phone1) : row.Phone1 ? String(row.Phone1) : undefined,
    lastSyncDate: row.lastSyncDate ? String(row.lastSyncDate) : row.LastSyncDate ? String(row.LastSyncDate) : undefined,
  };
}

function normalizeStock(row: Record<string, unknown>): StockReferenceDto {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    branchCode: row.branchCode ? String(row.branchCode) : row.BranchCode ? String(row.BranchCode) : undefined,
    erpStockCode: String(row.erpStockCode ?? row.ErpStockCode ?? ''),
    stockName: String(row.stockName ?? row.StockName ?? ''),
    unit: row.unit ? String(row.unit) : row.Unit ? String(row.Unit) : undefined,
    grupKodu: row.grupKodu ? String(row.grupKodu) : row.GrupKodu ? String(row.GrupKodu) : undefined,
    grupAdi: row.grupAdi ? String(row.grupAdi) : row.GrupAdi ? String(row.GrupAdi) : undefined,
    lastSyncDate: row.lastSyncDate ? String(row.lastSyncDate) : row.LastSyncDate ? String(row.LastSyncDate) : undefined,
  };
}

function normalizeWarehouse(row: Record<string, unknown>): WarehouseReferenceDto {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    branchCode: row.branchCode ? String(row.branchCode) : row.BranchCode ? String(row.BranchCode) : undefined,
    warehouseCode: Number(row.warehouseCode ?? row.WarehouseCode ?? 0),
    warehouseName: String(row.warehouseName ?? row.WarehouseName ?? ''),
  };
}

function normalizeYapKod(row: Record<string, unknown>): YapKodReferenceDto {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    branchCode: row.branchCode ? String(row.branchCode) : row.BranchCode ? String(row.BranchCode) : undefined,
    yapKod: String(row.yapKod ?? row.YapKod ?? ''),
    yapAcik: String(row.yapAcik ?? row.YapAcik ?? ''),
    yplndrStokKod: row.yplndrStokKod ? String(row.yplndrStokKod) : row.YplndrStokKod ? String(row.YplndrStokKod) : undefined,
    lastSyncDate: row.lastSyncDate ? String(row.lastSyncDate) : row.LastSyncDate ? String(row.LastSyncDate) : undefined,
  };
}

function getEndpoint(kind: ErpReferenceKind): string {
  switch (kind) {
    case 'customer': return '/api/Customer/paged';
    case 'stock': return '/api/Stock/paged';
    case 'warehouse': return '/api/Warehouse/paged';
    case 'yapkod': return '/api/YapKod/paged';
  }
}

function normalizePaged<T>(
  response: ApiResponse<PagedResponse<Record<string, unknown>>>,
  mapRow: (row: Record<string, unknown>) => T,
): PagedResponse<T> {
  const data = response.data;
  return {
    ...(data ?? {
      data: [],
      totalCount: 0,
      pageNumber: 0,
      pageSize: 20,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    }),
    data: (data?.data ?? []).map((row) => mapRow(row)),
  };
}

export const erpReferenceApi = {
  async getCustomers(params: PagedParams = {}): Promise<PagedResponse<CustomerReferenceDto>> {
    const response = await api.post<ApiResponse<PagedResponse<Record<string, unknown>>>>(
      getEndpoint('customer'),
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'CustomerCode', sortDirection: 'asc' }),
    );
    return normalizePaged(response, normalizeCustomer);
  },

  async getStocks(params: PagedParams = {}): Promise<PagedResponse<StockReferenceDto>> {
    const response = await api.post<ApiResponse<PagedResponse<Record<string, unknown>>>>(
      getEndpoint('stock'),
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'ErpStockCode', sortDirection: 'asc' }),
    );
    return normalizePaged(response, normalizeStock);
  },

  async getWarehouses(params: PagedParams = {}): Promise<PagedResponse<WarehouseReferenceDto>> {
    const response = await api.post<ApiResponse<PagedResponse<Record<string, unknown>>>>(
      getEndpoint('warehouse'),
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'WarehouseCode', sortDirection: 'asc' }),
    );
    return normalizePaged(response, normalizeWarehouse);
  },

  async getYapKodlar(params: PagedParams = {}): Promise<PagedResponse<YapKodReferenceDto>> {
    const response = await api.post<ApiResponse<PagedResponse<Record<string, unknown>>>>(
      getEndpoint('yapkod'),
      buildPagedRequest(params, { pageNumber: 0, pageSize: 20, sortBy: 'YapKod', sortDirection: 'asc' }),
    );
    return normalizePaged(response, normalizeYapKod);
  },
};
