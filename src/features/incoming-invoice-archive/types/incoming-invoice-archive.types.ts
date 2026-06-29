export interface ELogoPostboxCompany {
  key: string;
  displayName: string;
  vkn: string;
  source: string;
  isConfigured: boolean;
}

export type IncomingInvoiceKind = 'EInvoice' | 'EArchive' | 'Automatic';

export interface IncomingInvoicePdfRequest {
  companyKey: string;
  uuid: string;
  invoiceKind: IncomingInvoiceKind;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  exceptionMessage?: string;
  data?: T;
}
