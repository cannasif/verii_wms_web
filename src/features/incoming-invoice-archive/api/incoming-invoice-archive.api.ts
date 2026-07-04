import { api } from '@/lib/axios';
import type {
  ApiResponse,
  ELogoConnection,
  ELogoConnectionUpsert,
  ELogoPostboxCompany,
  IncomingInvoiceDetail,
  IncomingInvoicePdfRequest,
  PagedRequest,
  PagedResponse,
} from '../types/incoming-invoice-archive.types';

const invoiceKindApiValueMap: Record<IncomingInvoicePdfRequest['invoiceKind'], 1 | 2 | 3> = {
  EInvoice: 1,
  EArchive: 2,
  Automatic: 3,
};

function toApiRequest(input: IncomingInvoicePdfRequest): Omit<IncomingInvoicePdfRequest, 'invoiceKind'> & { invoiceKind: 1 | 2 | 3 } {
  return {
    ...input,
    invoiceKind: invoiceKindApiValueMap[input.invoiceKind],
  };
}

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
      const response = await api.post<Blob>('/api/incoming-invoice-archive/invoice-pdf', toApiRequest(input), {
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

  async downloadInvoiceXml(input: IncomingInvoicePdfRequest): Promise<{ blob: Blob; fileName: string }> {
    try {
      const response = await api.post<Blob>('/api/incoming-invoice-archive/invoice-xml', toApiRequest(input), {
        responseType: 'blob',
      });
      const blob = response as unknown as Blob;

      return {
        blob,
        fileName: `${input.uuid}.xml`,
      };
    } catch (error) {
      throw new Error(await extractBlobError(error));
    }
  },

  async getInvoiceDetail(input: IncomingInvoicePdfRequest): Promise<IncomingInvoiceDetail> {
    const response = await api.post<ApiResponse<IncomingInvoiceDetail>>('/api/incoming-invoice-archive/invoice-detail', toApiRequest(input));
    return extractData(response as ApiResponse<IncomingInvoiceDetail>);
  },

  async getConnectionsPaged(input: PagedRequest): Promise<PagedResponse<ELogoConnection>> {
    const response = await api.post<ApiResponse<PagedResponse<ELogoConnection>>>('/api/incoming-invoice-archive/connections/paged', input);
    return extractData(response as ApiResponse<PagedResponse<ELogoConnection>>);
  },

  async createConnection(input: ELogoConnectionUpsert): Promise<ELogoConnection> {
    const response = await api.post<ApiResponse<ELogoConnection>>('/api/incoming-invoice-archive/connections', input);
    return extractData(response as ApiResponse<ELogoConnection>);
  },

  async updateConnection(id: number, input: ELogoConnectionUpsert): Promise<ELogoConnection> {
    const response = await api.put<ApiResponse<ELogoConnection>>(`/api/incoming-invoice-archive/connections/${id}`, input);
    return extractData(response as ApiResponse<ELogoConnection>);
  },

  async deleteConnection(id: number): Promise<boolean> {
    const response = await api.delete<ApiResponse<boolean>>(`/api/incoming-invoice-archive/connections/${id}`);
    return extractData(response as ApiResponse<boolean>);
  },
};
