import { api } from '@/lib/axios';
import type { ApiResponse, IncomingInvoiceDetail, IncomingInvoicePdfRequest, ELogoPostboxCompany } from '../types/incoming-invoice-archive.types';

function extractData<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined) {
    throw new Error(response.message || response.exceptionMessage || 'Request failed');
  }

  return response.data;
}

async function extractBlobError(error: unknown): Promise<string> {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  if (responseData instanceof Blob) {
    try {
      const text = await responseData.text();
      const parsed = JSON.parse(text) as { message?: string; exceptionMessage?: string };
      return parsed.message || parsed.exceptionMessage || text;
    } catch {
      return 'PDF indirilemedi.';
    }
  }

  return error instanceof Error ? error.message : 'PDF indirilemedi.';
}

export const incomingInvoiceArchiveApi = {
  async getCompanies(): Promise<ELogoPostboxCompany[]> {
    const response = await api.get<ApiResponse<ELogoPostboxCompany[]>>('/api/incoming-invoice-archive/companies');
    return extractData(response as ApiResponse<ELogoPostboxCompany[]>);
  },

  async downloadInvoicePdf(input: IncomingInvoicePdfRequest): Promise<{ blob: Blob; fileName: string }> {
    try {
      const response = await api.post<Blob>('/api/incoming-invoice-archive/invoice-pdf', input, {
        responseType: 'blob',
      });
      const blob = response as unknown as Blob;

      return {
        blob,
        fileName: `${input.uuid}.pdf`,
      };
    } catch (error) {
      throw new Error(await extractBlobError(error));
    }
  },

  async getInvoiceDetail(input: IncomingInvoicePdfRequest): Promise<IncomingInvoiceDetail> {
    const response = await api.post<ApiResponse<IncomingInvoiceDetail>>('/api/incoming-invoice-archive/invoice-detail', input);
    return extractData(response as ApiResponse<IncomingInvoiceDetail>);
  },
};
