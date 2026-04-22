import type { ApiResponse, PagedResponse } from '@/types/api';

export interface ShelfDefinitionDto {
  id: number;
  warehouseId: number;
  warehouseCode?: number | null;
  warehouseName?: string | null;
  parentShelfId?: number | null;
  parentShelfCode?: string | null;
  parentShelfName?: string | null;
  code: string;
  name: string;
  locationType: 'Zone' | 'Rack' | 'Shelf' | 'Cell';
  barcodeEntryMode: 'Manual' | 'Auto';
  barcode?: string | null;
  capacity?: number | null;
  levelNo?: number | null;
  isActive: boolean;
  description?: string | null;
}

export interface ShelfUpsertRequest {
  warehouseId: number;
  parentShelfId?: number | null;
  code: string;
  name: string;
  locationType: 'Zone' | 'Rack' | 'Shelf' | 'Cell';
  barcodeEntryMode: 'Manual' | 'Auto';
  barcode?: string | null;
  capacity?: number | null;
  levelNo?: number | null;
  isActive: boolean;
  description?: string | null;
}

export type ShelfPagedResponse = ApiResponse<PagedResponse<ShelfDefinitionDto>>;
