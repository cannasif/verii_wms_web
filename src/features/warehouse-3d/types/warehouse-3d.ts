export interface WarehouseShelvesWithStockInformationDto {
  depoKodu: string;
  hucreKodu: string;
  stokKodu: string;
  stokAdi: string;
  yapKod: string | null;
  yapAcik: string | null;
  seriNo: string;
  bakiye: number;
}

export interface ParsedLocation {
  row: string;
  column: number;
  level: number;
}

export interface WarehouseSlot {
  hucreKodu: string;
  position: { x: number; y: number; z: number };
  stocks: Array<{
    stokKodu: string;
    stokAdi: string;
    bakiye: number;
  }>;
  totalBakiye: number;
}

export interface LayoutConfig {
  aisleSpacing: number;
  baySpacing: number;
  levelHeight: number;
  origin: { x: number; z: number };
}

export interface SteelPlacementVisualizationItemDto {
  placementId: number;
  lineId: number;
  dCode: string;
  stockCode: string;
  stockName?: string | null;
  serialNo: string;
  serialNo2?: string | null;
  supplierCode: string;
  headerDocumentNo?: string | null;
  quantity: number;
  placementType: string;
  stackOrderNo?: number | null;
  rowNo?: number | null;
  positionNo?: number | null;
  imageUrl?: string | null;
}

export interface SteelPlacementVisualizationLocationDto {
  locationKey: string;
  shelfId?: number | null;
  shelfCode?: string | null;
  shelfName?: string | null;
  areaCode?: string | null;
  plateCount: number;
  items: SteelPlacementVisualizationItemDto[];
}

export interface SteelPlacementVisualizationDto {
  warehouseId: number;
  warehouseCode: number;
  warehouseName: string;
  totalLocationCount: number;
  totalPlateCount: number;
  locations: SteelPlacementVisualizationLocationDto[];
}
