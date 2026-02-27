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
