export interface SteelGoodReciptAcceptanseExcelRowDto {
  rowNumber: number;
  netsisOrderNo: string;
  netsisOrderLineNo: string;
  netsisLineSequenceNo?: string | null;
  stockCode: string;
  stockName?: string | null;
  combinedSize?: string | null;
  serialNo: string;
  serialNo2?: string | null;
  expectedQuantity: number;
  unit?: string | null;
  depotCode?: string | null;
  materialQuality?: string | null;
  heatNumber?: string | null;
  certificateNumber?: string | null;
  exportRefNo?: string | null;
}

export interface SteelGoodReciptAcceptanseImportPreviewRequestDto {
  branchCode?: string;
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  excelRecordNo: string;
  exportRefNo?: string | null;
  fileName: string;
  rows: SteelGoodReciptAcceptanseExcelRowDto[];
}

export interface SteelGoodReciptAcceptanseCommitImportDto extends SteelGoodReciptAcceptanseImportPreviewRequestDto {}

export interface SteelGoodReciptAcceptanseImportPreviewRowDto {
  rowNumber: number;
  stockCode: string;
  serialNo: string;
  serialNo2?: string | null;
  expectedQuantity: number;
  actionType: 'New' | 'Update' | string;
  existingLineId?: number | null;
  existingDCode?: string | null;
  existingStatus?: string | null;
  compositeKey: string;
  errors: string[];
}

export interface SteelGoodReciptAcceptanseImportPreviewDto {
  supplierCode: string;
  supplierName: string;
  excelRecordNo: string;
  exportRefNo?: string | null;
  fileName: string;
  totalRows: number;
  newRowCount: number;
  updateRowCount: number;
  errorRowCount: number;
  totalExpectedQuantity: number;
  rows: SteelGoodReciptAcceptanseImportPreviewRowDto[];
}

export interface SteelGoodReciptAcceptanseHeaderDto {
  id: number;
  documentNo?: string | null;
  documentDate?: string | null;
  supplierCode: string;
  supplierName: string;
  excelRecordNo: string;
  exportRefNo?: string | null;
  uploadFileName: string;
  status: string;
  totalLineCount: number;
  expectedTotalQuantity: number;
  importedAt: string;
}

export interface SteelGoodReciptAcceptanseLineListItemDto {
  id: number;
  headerId: number;
  headerDocumentNo?: string | null;
  dCode: string;
  supplierCode: string;
  supplierName: string;
  netsisOrderNo: string;
  netsisOrderLineNo: string;
  stockCode: string;
  description?: string | null;
  serialNo: string;
  serialNo2?: string | null;
  expectedQuantity: number;
  arrivedQuantity: number;
  approvedQuantity: number;
  rejectedQuantity: number;
  status: string;
  materialQuality?: string | null;
  heatNumber?: string | null;
  exportRefNo?: string | null;
  isArrived: boolean;
  isApproved: boolean;
  rejectReason?: string | null;
  checkedAt?: string | null;
}

export interface SteelGoodReciptAcceptansePhotoDto {
  id: number;
  lineId: number;
  imageUrl: string;
  caption?: string | null;
  createdDate?: string | null;
}

export interface SteelGoodReciptAcceptanseLineDetailDto extends SteelGoodReciptAcceptanseLineListItemDto {
  combinedSize?: string | null;
  depotCode?: string | null;
  certificateNumber?: string | null;
  hasPlacement: boolean;
  hasReceiptTransfer: boolean;
  photos: SteelGoodReciptAcceptansePhotoDto[];
}

export interface SaveSteelGoodReciptAcceptanseInspectionDto {
  lineId: number;
  isArrived: boolean;
  isApproved: boolean;
  arrivedQuantity: number;
  approvedQuantity: number;
  rejectedQuantity: number;
  rejectReason?: string | null;
  note?: string | null;
}

export interface SteelGoodReciptAcceptanseReceiptHeaderDto {
  id: number;
  documentNo?: string | null;
  documentDate?: string | null;
  supplierCode: string;
  supplierName: string;
  exportRefNo?: string | null;
  status: string;
  totalLineCount: number;
  totalReceiptQuantity: number;
  createdAt: string;
}

export interface CreateSteelGoodReciptAcceptanseReceiptDto {
  branchCode?: string;
  lineIds: number[];
  note?: string | null;
}
