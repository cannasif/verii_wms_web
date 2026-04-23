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
  parentPackageId?: number | null;
  parentPackageNo?: string | null;
  packagingMaterialId?: number | null;
  packagingMaterialCode?: string | null;
  packagingMaterialName?: string | null;
  currentWarehouseId?: number | null;
  currentWarehouseCode?: number | null;
  currentWarehouseName?: string | null;
  currentShelfId?: number | null;
  currentShelfCode?: string | null;
  currentShelfName?: string | null;
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
  totalChildPackageCount?: number;
  totalProductQuantity?: number;
  totalNetWeight?: number;
  totalGrossWeight?: number;
  totalVolume?: number;
  isMixed: boolean;
  status: 'Draft' | 'Packed' | 'Sealed' | 'Loaded' | 'Transferred' | 'Shipped' | 'Cancelled' | 'Open' | 'Closed';
  createdDate?: string;
  updatedDate?: string;
  isDeleted: boolean;
}

export interface CreatePPackageDto {
  packingHeaderId: number;
  parentPackageId?: number | null;
  packagingMaterialId?: number | null;
  currentWarehouseId?: number | null;
  currentShelfId?: number | null;
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
  status?: 'Draft' | 'Packed' | 'Sealed' | 'Loaded' | 'Transferred' | 'Shipped' | 'Cancelled' | 'Open' | 'Closed';
}

export interface UpdatePPackageDto {
  packageNo?: string;
  parentPackageId?: number | null;
  packagingMaterialId?: number | null;
  currentWarehouseId?: number | null;
  currentShelfId?: number | null;
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
  status?: 'Draft' | 'Packed' | 'Sealed' | 'Loaded' | 'Transferred' | 'Shipped' | 'Cancelled' | 'Open' | 'Closed';
}

export interface PPackageTreeDto {
  package: PPackageDto;
  children: PPackageTreeDto[];
}

export interface PackageLabelPrintRequestDto {
  printerDefinitionId: number;
  printerProfileId?: number | null;
  barcodeTemplateId: number;
  packageId?: number | null;
  packingHeaderId?: number | null;
  packageIds?: number[];
  printMode?: string;
  copies?: number;
  includeChildren?: boolean;
  useGs1SsccForPallets?: boolean;
}

export interface PackageLabelPrintResultDto {
  printJobId?: number | null;
  printedPackageCount: number;
  printedPackageIds: number[];
  packingHeaderId?: number | null;
}

export interface MovePackagesToSourceHeaderDto {
  targetSourceType: 'WT' | 'SH';
  targetSourceHeaderId: number;
  packageIds: number[];
  targetWarehouseId?: number | null;
  targetShelfId?: number | null;
  targetPackageStatus?: string | null;
  note?: string | null;
}

export interface PackageMoveResultDto {
  targetPackingHeaderId: number;
  targetWarehouseId?: number | null;
  targetShelfId?: number | null;
  packageCount: number;
  lineCount: number;
  movedPackageIds: number[];
}

export interface PLineDto {
  id: number;
  packingHeaderId: number;
  packageId: number;
  barcode?: string;
  stockCode: string;
  stockId?: number;
  stockName?: string;
  yapKodId?: number;
  yapKod?: string;
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
  stockId?: number;
  yapKodId?: number;
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
  stockId?: number;
  yapKodId?: number;
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
export type PPackageTreeResponse = ApiResponse<PPackageTreeDto[]>;
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
export type AvailableHeadersPagedResponse = ApiResponse<PagedResponse<AvailableHeaderDto>>;

export const pHeaderFormSchema = (t: TFunction) => {
  void t;
  return z.object({
    warehouseCode: z.string().optional(),
    packingNo: z.string().min(1, t('package.form.packingNoRequired')),
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
    packingHeaderId: z.number().min(1, t('package.form.packingHeaderIdRequired')),
    packageNo: z.string().min(1, t('package.form.packageNoRequired')),
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
    status: z.enum(['Draft', 'Packed', 'Sealed', 'Loaded', 'Transferred', 'Shipped', 'Cancelled', 'Open', 'Closed']).optional(),
  });
};

export type PPackageFormData = z.infer<ReturnType<typeof pPackageFormSchema>>;

export const pLineFormSchema = (t: TFunction) => {
  void t;
  return z.object({
    packingHeaderId: z.number().min(1, t('package.form.packingHeaderIdRequired')),
    packageId: z.number().min(1, t('package.form.packageIdRequired')),
    barcode: z.string().optional(),
    stockCode: z.string().min(1, t('package.form.stockCodeRequired')),
    stockId: z.number().optional(),
    yapKodId: z.number().optional(),
    yapAcik: z.string().optional(),
    quantity: z.number().min(0.01, t('package.form.quantityRequired')),
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
