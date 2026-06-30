export interface ELogoPostboxCompany {
  key: string;
  displayName: string;
  vkn: string;
  source: string;
  isConfigured: boolean;
}

export interface ELogoConnection {
  id: number;
  branchCode: string;
  key: string;
  displayName: string;
  vkn: string;
  username: string;
  source: string;
  endpointUrl?: string | null;
  applicationName?: string | null;
  version?: string | null;
  timeoutSeconds?: number | null;
  isActive: boolean;
  isDefault: boolean;
  isConfigured: boolean;
  description?: string | null;
}

export interface ELogoConnectionUpsert {
  key?: string;
  displayName: string;
  vkn: string;
  username: string;
  password?: string | null;
  source: string;
  endpointUrl?: string | null;
  applicationName?: string | null;
  version?: string | null;
  timeoutSeconds?: number | null;
  isActive: boolean;
  isDefault: boolean;
  description?: string | null;
}

export interface PagedRequest {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string | null;
  sortDirection?: string | null;
  search?: string | null;
  filters?: unknown[];
  filterLogic?: string;
}

export interface PagedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export type IncomingInvoiceKind = 'EInvoice' | 'EArchive' | 'Automatic';

export interface IncomingInvoicePdfRequest {
  companyKey: string;
  uuid: string;
  invoiceKind: IncomingInvoiceKind;
}

export interface IncomingInvoiceDetail {
  header: IncomingInvoiceHeader;
  supplier: IncomingInvoiceParty;
  customer: IncomingInvoiceParty;
  lines: IncomingInvoiceLine[];
  taxes: IncomingInvoiceTax[];
  sourceMethod: string;
  extractedFromZip: boolean;
}

export interface IncomingInvoiceHeader {
  uuid: string;
  invoiceNumber: string;
  invoiceTypeCode: string;
  currencyCode: string;
  issueDate?: string | null;
  lineExtensionAmount?: number | null;
  taxExclusiveAmount?: number | null;
  taxInclusiveAmount?: number | null;
  allowanceTotalAmount?: number | null;
  payableAmount?: number | null;
}

export interface IncomingInvoiceParty {
  vknOrTckn: string;
  name: string;
  taxOffice: string;
  city: string;
  district: string;
  country: string;
  addressLine: string;
}

export interface IncomingInvoiceLine {
  lineId: string;
  stockCode: string;
  stockName: string;
  description: string;
  quantity?: number | null;
  unitCode: string;
  unitPrice?: number | null;
  lineExtensionAmount?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
}

export interface IncomingInvoiceTax {
  taxName: string;
  taxableAmount?: number | null;
  taxAmount?: number | null;
  percent?: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  exceptionMessage?: string;
  data?: T;
}
