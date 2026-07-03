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
  approvalRuleId?: number | null;
  approvalStepOrder?: number | null;
  approvalSubmittedAt?: string | null;
  approvedByUserId?: number | null;
  approvedAt?: string | null;
  rejectedByUserId?: number | null;
  rejectedAt?: string | null;
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
  notes?: PurchaseNotesDto;
}

export interface PurchaseNotesDto {
  note1?: string | null;
  note2?: string | null;
  note3?: string | null;
  note4?: string | null;
  note5?: string | null;
  note6?: string | null;
  note7?: string | null;
  note8?: string | null;
  note9?: string | null;
  note10?: string | null;
  note11?: string | null;
  note12?: string | null;
  note13?: string | null;
  note14?: string | null;
  note15?: string | null;
}

export interface PurchaseApprovalRuleDto {
  id: number;
  branchCode?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
  ruleName: string;
  documentKind: string;
  stepOrder: number;
  approverUserId: number;
  department?: string | null;
  projectCode?: string | null;
  currencyCode?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  isActive: boolean;
  requireAllPreviousSteps: boolean;
  description?: string | null;
}

export interface CreatePurchaseApprovalRuleDto {
  ruleName: string;
  documentKind: string;
  stepOrder: number;
  approverUserId: number;
  department?: string | null;
  projectCode?: string | null;
  currencyCode?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  isActive: boolean;
  requireAllPreviousSteps: boolean;
  description?: string | null;
}
