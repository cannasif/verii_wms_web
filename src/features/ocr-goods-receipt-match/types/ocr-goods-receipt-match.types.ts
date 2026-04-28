export interface CreateOcrGoodsReceiptCustomerStockMatchDto {
  branchCode?: string;
  customerId: number;
  customerStockCode: string;
  customerStockName?: string | null;
  customerBarcode?: string | null;
  ourStockId: number;
  unit?: string | null;
  isActive: boolean;
  description?: string | null;
}

export interface UpdateOcrGoodsReceiptCustomerStockMatchDto extends CreateOcrGoodsReceiptCustomerStockMatchDto {}

export interface OcrGoodsReceiptCustomerStockMatchDto {
  id: number;
  branchCode?: string | null;
  customerId: number;
  customerCode: string;
  customerName: string;
  customerStockCode: string;
  customerStockCodeNormalized: string;
  customerStockName?: string | null;
  customerBarcode?: string | null;
  ourStockId: number;
  ourStockCode: string;
  ourStockName: string;
  unit?: string | null;
  isActive: boolean;
  description?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface OcrGoodsReceiptCustomerStockMatchPagedRowDto {
  id: number;
  branchCode?: string | null;
  customerId: number;
  customerCode: string;
  customerName: string;
  customerStockCode: string;
  customerStockName?: string | null;
  customerBarcode?: string | null;
  ourStockId: number;
  ourStockCode: string;
  ourStockName: string;
  unit?: string | null;
  isActive: boolean;
  description?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}
