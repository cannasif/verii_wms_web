export interface PurchaseListRowDto {
  id: number;
  branchCode?: string;
  documentNo?: string | null;
  documentKind: string;
  status: string;
  supplier?: string | null;
  buyerUserId?: number | null;
  currencyCode: string;
  grandTotal: number;
  sourceDocumentNo?: string | null;
  documentDate: string;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface CreatePurchaseLineDto {
  stockId?: number | null;
  productCode?: string | null;
  productName: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  discount1: number;
  discount2: number;
  discount3: number;
  vatRate: number;
  deliveryDate?: string | null;
  description1?: string | null;
  description2?: string | null;
  description3?: string | null;
  imagePath?: string | null;
  erpProjectCode?: string | null;
  purchaseRequestLineId?: number | null;
  supplierQuotationLineId?: number | null;
}

export interface CreatePurchaseDocumentDto {
  requestNo?: string | null;
  rfqNo?: string | null;
  quotationNo?: string | null;
  orderNo?: string | null;
  revisionNo?: string | null;
  requestDate?: string | null;
  rfqDate?: string | null;
  quotationDate?: string | null;
  orderDate?: string | null;
  neededDate?: string | null;
  dueDate?: string | null;
  validUntil?: string | null;
  deliveryDate?: string | null;
  supplierId?: number | null;
  buyerUserId?: number | null;
  documentSeriesDefinitionId?: number | null;
  purchaseType?: string | null;
  paymentTypeCode?: string | null;
  currencyCode: string;
  exchangeRate?: number | null;
  department?: string | null;
  projectCode?: string | null;
  erpProjectCode?: string | null;
  ozelKod1?: string | null;
  ozelKod2?: string | null;
  subject?: string | null;
  message?: string | null;
  description?: string | null;
  deliveryTerms?: string | null;
  paymentTerms?: string | null;
  generalDiscountRate?: number | null;
  generalDiscountAmount?: number | null;
  lines: CreatePurchaseLineDto[];
  suppliers?: Array<{ supplierId: number; email?: string | null }>;
  exchangeRates?: Array<{ currency: string; exchangeRate: number; exchangeRateDate?: string | null; isOfficial: boolean }>;
  notes?: Record<string, string | null>;
}
