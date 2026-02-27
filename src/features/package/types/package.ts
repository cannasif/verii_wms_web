import { z } from 'zod';
import type { ApiResponse, PagedResponse } from '@/types/api';
import type { TFunction } from 'i18next';

export interface StokBarcodeDto {
  barkod: string;
  stokKodu: string;
  stokAdi: string;
  olcuAdi: string;
  yapKod: string | null;
  yapAcik: string | null;
  cevrim: number;
  seriBarkodMu: boolean;
  sktVarmi: string | null;
  isemriNo: string | null;
}

export type StokBarcodeResponse = ApiResponse<StokBarcodeDto[]>;

export interface PHeaderDto {
  id: number;
  warehouseCode?: string;
  packingNo: string;
  packingDate?: string;
  sourceType?: 'GR' | 'WT' | 'PR' | 'PT' | 'SIT' | 'SRT' | 'WI' | 'WO' | 'SH';
  sourceHeaderId?: number;
  customerCode?: string;
  customerName?: string;
  customerAddress?: string;
  status: 'Draft' | 'Packing' | 'Packed' | 'Shipped' | 'Cancelled';
  totalPackageCount?: number;
  totalQuantity?: number;
  totalNetWeight?: number;
  totalGrossWeight?: number;
  totalVolume?: number;
  carrierId?: number;
  carrierServiceType?: string;
  trackingNo?: string;
  isMatched: boolean;
  createdDate?: string;
  updatedDate?: string;
  isDeleted: boolean;
}

export interface CreatePHeaderDto {
  warehouseCode?: string;
  packingNo: string;
  packingDate?: string;
  sourceType?: 'GR' | 'WT' | 'PR' | 'PT' | 'SIT' | 'SRT' | 'WI' | 'WO' | 'SH';
  sourceHeaderId?: number;
  customerCode?: string;
  customerAddress?: string;
  status?: 'Draft' | 'Packing' | 'Packed' | 'Shipped' | 'Cancelled';
  totalPackageCount?: number;
  totalQuantity?: number;
  totalNetWeight?: number;
  totalGrossWeight?: number;
  totalVolume?: number;
  carrierId?: number;
  carrierServiceType?: string;
  trackingNo?: string;
}

export interface UpdatePHeaderDto {
  warehouseCode?: string;
  packingNo?: string;
  packingDate?: string;
  sourceType?: 'GR' | 'WT' | 'PR' | 'PT' | 'SIT' | 'SRT' | 'WI' | 'WO' | 'SH';
  sourceHeaderId?: number;
  customerCode?: string;
  customerAddress?: string;
  status?: 'Draft' | 'Packing' | 'Packed' | 'Shipped' | 'Cancelled';
  totalPackageCount?: number;
  totalQuantity?: number;
  totalNetWeight?: number;
  totalGrossWeight?: number;
  totalVolume?: number;
  carrierId?: number;
  carrierServiceType?: string;
  trackingNo?: string;
  isMatched?: boolean;
}

export interface PPackageDto {
  id: number;
  packingHeaderId: number;
  packageNo: string;
  packageType: 'Box' | 'Pallet' | 'Bag' | 'Custom';
  barcode?: string;
  length?: number;
  width?: number;
  height?: number;
  volume?: number;
  netWeight?: number;
  tareWeight?: number;
  grossWeight?: number;
  isMixed: boolean;
  status: 'Open' | 'Closed' | 'Loaded';
  createdDate?: string;
  updatedDate?: string;
  isDeleted: boolean;
}

export interface CreatePPackageDto {
  packingHeaderId: number;
  packageNo: string;
  packageType?: 'Box' | 'Pallet' | 'Bag' | 'Custom';
  barcode?: string;
  length?: number;
  width?: number;
  height?: number;
  volume?: number;
  netWeight?: number;
  tareWeight?: number;
  grossWeight?: number;
  isMixed?: boolean;
  status?: 'Open' | 'Closed' | 'Loaded';
}

export interface UpdatePPackageDto {
  packingHeaderId?: number;
  packageNo?: string;
  packageType?: 'Box' | 'Pallet' | 'Bag' | 'Custom';
  barcode?: string;
  length?: number;
  width?: number;
  height?: number;
  volume?: number;
  netWeight?: number;
  tareWeight?: number;
  grossWeight?: number;
  isMixed?: boolean;
  status?: 'Open' | 'Closed' | 'Loaded';
}

export interface PLineDto {
  id: number;
  packingHeaderId: number;
  packageId: number;
  barcode?: string;
  stockCode: string;
  stockName?: string;
  yapKod: string;
  yapAcik?: string;
  quantity: number;
  serialNo?: string;
  serialNo2?: string;
  serialNo3?: string;
  serialNo4?: string;
  sourceRouteId?: number;
  createdDate?: string;
  updatedDate?: string;
  isDeleted: boolean;
}

export interface CreatePLineDto {
  packingHeaderId: number;
  packageId: number;
  barcode?: string;
  stockCode: string;
  yapKod?: string;
  quantity: number;
  serialNo?: string;
  serialNo2?: string;
  serialNo3?: string;
  serialNo4?: string;
  sourceRouteId?: number;
}

export interface UpdatePLineDto {
  packingHeaderId?: number;
  packageId?: number;
  barcode?: string;
  stockCode?: string;
  yapKod?: string;
  quantity?: number;
  serialNo?: string;
  serialNo2?: string;
  serialNo3?: string;
  serialNo4?: string;
  sourceRouteId?: number;
}

export type PHeaderResponse = ApiResponse<PHeaderDto>;
export type PHeadersPagedResponse = ApiResponse<PagedResponse<PHeaderDto>>;
export type PPackageResponse = ApiResponse<PPackageDto>;
export type PPackagesPagedResponse = ApiResponse<PagedResponse<PPackageDto>>;
export type PPackagesResponse = ApiResponse<PPackageDto[]>;
export type PLineResponse = ApiResponse<PLineDto>;
export type PLinesPagedResponse = ApiResponse<PagedResponse<PLineDto>>;
export type PLinesResponse = ApiResponse<PLineDto[]>;

export interface AvailableHeaderDto {
  id: number;
  documentNo?: string;
  documentDate?: string;
  customerCode?: string;
  customerName?: string;
  documentType?: string;
  branchCode?: string;
  projectCode?: string;
  yearCode?: string;
  sourceWarehouse?: string;
  sourceWarehouseName?: string;
  targetWarehouse?: string;
  targetWarehouseName?: string;
  priority?: string;
  type?: number;
  description1?: string;
  description2?: string;
  description3?: string;
  description4?: string;
  description5?: string;
  createdDate?: string;
  updatedDate?: string;
  isDeleted?: boolean;
}

export type AvailableHeadersResponse = ApiResponse<AvailableHeaderDto[]>;

export const pHeaderFormSchema = (t: TFunction) => {
  void t;
  return z.object({
    warehouseCode: z.string().optional(),
    packingNo: z.string().min(1, t('package.form.packingNoRequired', 'Paketleme No zorunludur')),
    packingDate: z.string().optional(),
    sourceType: z.enum(['GR', 'WT', 'PR', 'PT', 'SIT', 'SRT', 'WI', 'WO', 'SH']).optional(),
    sourceHeaderId: z.number().optional(),
    customerCode: z.string().optional(),
    customerAddress: z.string().optional(),
    status: z.enum(['Draft', 'Packing', 'Packed', 'Shipped', 'Cancelled']).optional(),
    carrierId: z.number().optional(),
    carrierServiceType: z.string().optional(),
    trackingNo: z.string().optional(),
  });
};

export const CargoCompany = {
  None: 0,
  YurtiçiKargo: 1,
  ArasKargo: 2,
  MNGKargo: 3,
  PTTKargo: 4,
  SüratKargo: 5,
  UPS: 6,
  DHL: 7,
  FedEx: 8,
  TNT: 9,
  HorozLojistik: 10,
  CEVA: 11,
  KargoTurk: 12,
  HepsiJET: 13,
  TrendyolExpress: 14,
  AmazonLogistics: 15,
  Scotty: 16,
  KolayGelsin: 17,
  BirGundeKargo: 18,
} as const;

export type CargoCompany = (typeof CargoCompany)[keyof typeof CargoCompany];

export type PHeaderFormData = z.infer<ReturnType<typeof pHeaderFormSchema>>;

export const pPackageFormSchema = (t: TFunction) => {
  void t;
  return z.object({
    packingHeaderId: z.number().min(1, t('package.form.packingHeaderIdRequired', 'Paketleme Başlık ID zorunludur')),
    packageNo: z.string().min(1, t('package.form.packageNoRequired', 'Paket No zorunludur')),
    packageType: z.enum(['Box', 'Pallet', 'Bag', 'Custom']).optional(),
    barcode: z.string().optional(),
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    volume: z.number().optional(),
    netWeight: z.number().optional(),
    tareWeight: z.number().optional(),
    grossWeight: z.number().optional(),
    isMixed: z.boolean().optional(),
    status: z.enum(['Open', 'Closed', 'Loaded']).optional(),
  });
};

export type PPackageFormData = z.infer<ReturnType<typeof pPackageFormSchema>>;

export const pLineFormSchema = (t: TFunction) => {
  void t;
  return z.object({
    packingHeaderId: z.number().min(1, t('package.form.packingHeaderIdRequired', 'Paketleme Başlık ID zorunludur')),
    packageId: z.number().min(1, t('package.form.packageIdRequired', 'Paket ID zorunludur')),
    barcode: z.string().optional(),
    stockCode: z.string().min(1, t('package.form.stockCodeRequired', 'Stok Kodu zorunludur')),
    yapKod: z.string().optional(),
    quantity: z.number().min(0.01, t('package.form.quantityRequired', 'Miktar zorunludur')),
    serialNo: z.string().optional(),
    serialNo2: z.string().optional(),
    serialNo3: z.string().optional(),
    serialNo4: z.string().optional(),
    sourceRouteId: z.number().optional(),
  });
};

export type PLineFormData = z.infer<ReturnType<typeof pLineFormSchema>>;

export interface PackageWizardState {
  currentStep: number;
  headerId?: number;
  headerData?: PHeaderDto;
  packages: PPackageDto[];
  lines: PLineDto[];
  isDirty: boolean;
}

