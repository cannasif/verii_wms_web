import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';

export type ErpReferenceKind = 'customer' | 'stock' | 'warehouse' | 'yapkod';

export interface CustomerReferenceDto {
  id: number;
  branchCode?: string;
  customerCode: string;
  customerName: string;
  city?: string;
  phone1?: string;
  lastSyncDate?: string;
}

export interface StockReferenceDto {
  id: number;
  branchCode?: string;
  erpStockCode: string;
  stockName: string;
  unit?: string;
  grupKodu?: string;
  grupAdi?: string;
  lastSyncDate?: string;
}

export interface WarehouseReferenceDto {
  id: number;
  branchCode?: string;
  warehouseCode: number;
  warehouseName: string;
}

export interface YapKodReferenceDto {
  id: number;
  branchCode?: string;
  yapKod: string;
  yapAcik: string;
  yplndrStokKod?: string;
  lastSyncDate?: string;
}

export type ErpReferenceRow =
  | CustomerReferenceDto
  | StockReferenceDto
  | WarehouseReferenceDto
  | YapKodReferenceDto;

export type ErpReferencePagedResponse<T extends ErpReferenceRow> = Promise<PagedResponse<T>>;
export type ErpReferenceApiResponse<T> = Promise<ApiResponse<T>>;
export type ErpReferencePagedParams = PagedParams;
