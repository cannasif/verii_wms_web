import { goodsReceiptApi } from '@/features/goods-receipt/api/goods-receipt-api';
import { packageApi } from '@/features/package/api/package-api';
import { productionTransferApi } from '@/features/production-transfer/api/production-transfer-api';
import { shipmentApi } from '@/features/shipment/api/shipment-api';
import { subcontractingApi } from '@/features/subcontracting/api/subcontracting-api';
import { transferApi } from '@/features/transfer/api/transfer-api';
import { warehouseApi } from '@/features/warehouse/api/warehouse-api';
import type { PagedParams, PagedResponse } from '@/types/api';
import type {
  BarcodePrintSourceModule,
  BarcodeSourceHeaderOption,
  BarcodeSourceLineOption,
  BarcodeSourcePackageOption,
} from '../types/barcode-designer-editor.types';

function includesSearch(value: string | null | undefined, search: string): boolean {
  if (!search.trim()) {
    return true;
  }

  return (value ?? '').toLocaleLowerCase('tr-TR').includes(search.trim().toLocaleLowerCase('tr-TR'));
}

function filterHeaders(items: BarcodeSourceHeaderOption[], search: string): BarcodeSourceHeaderOption[] {
  return items.filter((item) => includesSearch(item.title, search) || includesSearch(item.subtitle, search) || includesSearch(item.status, search));
}

function mapPagedHeaders(
  sourceModule: BarcodePrintSourceModule,
  response: PagedResponse<BarcodeSourceHeaderOption>,
): PagedResponse<BarcodeSourceHeaderOption> {
  return {
    ...response,
    data: response.data.map((item) => ({
      ...item,
      sourceModule,
    })),
  };
}

function normalizeToZeroBasedPage<T>(response: PagedResponse<T>, pageBase: 0 | 1): PagedResponse<T> {
  return {
    ...response,
    pageNumber: pageBase === 1 ? Math.max((response.pageNumber ?? 1) - 1, 0) : response.pageNumber,
  };
}

export const barcodePrintSourceBrowserApi = {
  async getHeadersPaged(sourceModule: BarcodePrintSourceModule, params: PagedParams = {}): Promise<PagedResponse<BarcodeSourceHeaderOption>> {
    switch (sourceModule) {
      case 'goods-receipt': {
        const headers = await goodsReceiptApi.getGrHeadersPaged({
          pageNumber: Math.max(1, (params.pageNumber ?? 0) + 1),
          pageSize: params.pageSize ?? 20,
          search: params.search,
          sortBy: params.sortBy,
          sortDirection: params.sortDirection,
          filters: params.filters,
          filterLogic: params.filterLogic,
        });
        return mapPagedHeaders(sourceModule, {
          ...normalizeToZeroBasedPage(headers, 1),
          data: filterHeaders(headers.data.map((header) => ({
            id: header.id,
            sourceModule,
            title: header.documentNo,
            subtitle: [header.customerCode, header.customerName].filter(Boolean).join(' - '),
            status: header.isCompleted ? 'Tamamlandi' : 'Acik',
            documentDate: header.documentDate,
          })), params.search ?? ''),
        });
      }
      case 'transfer': {
        const headers = await transferApi.getHeadersPaged(params);
        return mapPagedHeaders(sourceModule, {
          ...headers,
          data: filterHeaders(headers.data.map((header) => ({
            id: header.id,
            sourceModule,
            title: header.documentNo,
            subtitle: [header.customerCode, header.customerName].filter(Boolean).join(' - '),
            status: header.isCompleted ? 'Tamamlandi' : 'Acik',
            documentDate: header.documentDate,
          })), params.search ?? ''),
        });
      }
      case 'warehouse-inbound': {
        const headers = await warehouseApi.getInboundHeadersPaged(params);
        return mapPagedHeaders(sourceModule, {
          ...headers,
          data: filterHeaders(headers.data.map((header) => ({
            id: header.id,
            sourceModule,
            title: header.documentNo,
            subtitle: [header.sourceWarehouse, header.customerCode].filter(Boolean).join(' - '),
            status: header.isCompleted ? 'Tamamlandi' : 'Acik',
            documentDate: header.documentDate,
          })), params.search ?? ''),
        });
      }
      case 'warehouse-outbound': {
        const headers = await warehouseApi.getOutboundHeadersPaged(params);
        return mapPagedHeaders(sourceModule, {
          ...headers,
          data: filterHeaders(headers.data.map((header) => ({
            id: header.id,
            sourceModule,
            title: header.documentNo,
            subtitle: [header.targetWarehouse, header.customerCode].filter(Boolean).join(' - '),
            status: header.isCompleted ? 'Tamamlandi' : 'Acik',
            documentDate: header.documentDate,
          })), params.search ?? ''),
        });
      }
      case 'shipment': {
        const headers = await shipmentApi.getHeadersPaged(params);
        return mapPagedHeaders(sourceModule, {
          ...headers,
          data: filterHeaders(headers.data.map((header) => ({
            id: header.id,
            sourceModule,
            title: header.documentNo,
            subtitle: [header.customerCode, header.customerName].filter(Boolean).join(' - '),
            status: header.isCompleted ? 'Tamamlandi' : 'Acik',
            documentDate: header.documentDate,
          })), params.search ?? ''),
        });
      }
      case 'subcontracting-issue': {
        const headers = await subcontractingApi.getIssueHeadersPaged(params);
        return mapPagedHeaders(sourceModule, {
          ...headers,
          data: filterHeaders(headers.data.map((header) => ({
            id: header.id,
            sourceModule,
            title: header.documentNo,
            subtitle: [header.customerCode, header.customerName].filter(Boolean).join(' - '),
            status: header.isCompleted ? 'Tamamlandi' : 'Acik',
            documentDate: header.documentDate,
          })), params.search ?? ''),
        });
      }
      case 'subcontracting-receipt': {
        const headers = await subcontractingApi.getReceiptHeadersPaged(params);
        return mapPagedHeaders(sourceModule, {
          ...headers,
          data: filterHeaders(headers.data.map((header) => ({
            id: header.id,
            sourceModule,
            title: header.documentNo,
            subtitle: [header.customerCode, header.customerName].filter(Boolean).join(' - '),
            status: header.isCompleted ? 'Tamamlandi' : 'Acik',
            documentDate: header.documentDate,
          })), params.search ?? ''),
        });
      }
      case 'package': {
        const headers = await packageApi.getPHeadersPaged({
          ...params,
          pageNumber: (params.pageNumber ?? 0) + 1,
        });
        return mapPagedHeaders(sourceModule, {
          ...normalizeToZeroBasedPage(headers, 1),
          data: filterHeaders(headers.data.map((header) => ({
            id: header.id,
            sourceModule,
            title: header.packingNo,
            subtitle: [header.customerCode, header.sourceType].filter(Boolean).join(' - '),
            status: header.status,
            documentDate: header.packingDate,
          })), params.search ?? ''),
        });
      }
      case 'production-transfer': {
        const headers = await productionTransferApi.getHeadersPaged(params);
        return mapPagedHeaders(sourceModule, {
          ...headers,
          data: filterHeaders(headers.data.map((header) => ({
            id: header.id,
            sourceModule,
            title: header.documentNo,
            subtitle: [header.productionOrderId ? `Uretim #${header.productionOrderId}` : null, header.transferPurpose].filter(Boolean).join(' - '),
            status: header.isCompleted ? 'Tamamlandi' : 'Acik',
            documentDate: header.documentDate,
          })), params.search ?? ''),
        });
      }
      default:
        return {
          data: [],
          totalCount: 0,
          pageNumber: params.pageNumber ?? 0,
          pageSize: params.pageSize ?? 20,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        };
    }
  },

  async getHeaders(sourceModule: BarcodePrintSourceModule, search = ''): Promise<BarcodeSourceHeaderOption[]> {
    const paged = await barcodePrintSourceBrowserApi.getHeadersPaged(sourceModule, { pageNumber: 0, pageSize: 50, search });
    return paged.data;
  },

  async getLines(sourceModule: BarcodePrintSourceModule, headerId: number): Promise<BarcodeSourceLineOption[]> {
    switch (sourceModule) {
      case 'goods-receipt': {
        const lines = await goodsReceiptApi.getGrLines(headerId);
        return lines.map((line) => ({
          id: line.id,
          headerId,
          sourceModule,
          title: line.stockCode,
          subtitle: [line.description, line.erpOrderNo].filter(Boolean).join(' - '),
          quantity: line.quantity,
          stockCode: line.stockCode,
        }));
      }
      case 'transfer': {
        const response = await transferApi.getLines(headerId);
        return (response.data ?? []).map((line) => ({
          id: line.id,
          headerId,
          sourceModule,
          title: line.stockCode,
          subtitle: [line.description, line.erpOrderNo].filter(Boolean).join(' - '),
          quantity: line.quantity,
          stockCode: line.stockCode,
        }));
      }
      case 'warehouse-inbound': {
        const response = await warehouseApi.getInboundLines(headerId);
        return (response.data ?? []).map((line) => ({
          id: line.id,
          headerId,
          sourceModule,
          title: line.stockCode,
          subtitle: [line.description, line.erpOrderNo].filter(Boolean).join(' - '),
          quantity: line.quantity,
          stockCode: line.stockCode,
        }));
      }
      case 'warehouse-outbound': {
        const response = await warehouseApi.getOutboundLines(headerId);
        return (response.data ?? []).map((line) => ({
          id: line.id,
          headerId,
          sourceModule,
          title: line.stockCode,
          subtitle: [line.description, line.erpOrderNo].filter(Boolean).join(' - '),
          quantity: line.quantity,
          stockCode: line.stockCode,
        }));
      }
      case 'shipment': {
        const response = await shipmentApi.getLines(headerId);
        return (response.data ?? []).map((line) => ({
          id: line.id,
          headerId,
          sourceModule,
          title: line.stockCode ?? `Satir #${line.id}`,
          subtitle: [line.description, line.erpOrderNo].filter(Boolean).join(' - '),
          quantity: line.quantity,
          stockCode: line.stockCode,
        }));
      }
      case 'subcontracting-issue': {
        const response = await subcontractingApi.getIssueLines(headerId);
        return (response.data ?? []).map((line) => ({
          id: line.id,
          headerId,
          sourceModule,
          title: line.stockCode,
          subtitle: [line.description, line.erpOrderNo].filter(Boolean).join(' - '),
          quantity: line.quantity,
          stockCode: line.stockCode,
        }));
      }
      case 'subcontracting-receipt': {
        const response = await subcontractingApi.getReceiptLines(headerId);
        return (response.data ?? []).map((line) => ({
          id: line.id,
          headerId,
          sourceModule,
          title: line.stockCode,
          subtitle: [line.description, line.erpOrderNo].filter(Boolean).join(' - '),
          quantity: line.quantity,
          stockCode: line.stockCode,
        }));
      }
      case 'package': {
        const lines = await packageApi.getPLinesByHeader(headerId);
        return lines.map((line) => ({
          id: line.id,
          headerId,
          sourceModule,
          title: line.stockCode,
          subtitle: [line.yapKod, line.serialNo].filter(Boolean).join(' - '),
          quantity: line.quantity,
          stockCode: line.stockCode,
          serialNo: line.serialNo,
        }));
      }
      case 'production-transfer': {
        const detail = await productionTransferApi.getProductionTransferDetail(headerId);
        return detail.lines.map((line) => ({
          id: line.id,
          headerId,
          sourceModule,
          title: line.stockCode,
          subtitle: [line.lineRole, line.productionOrderNo].filter(Boolean).join(' - '),
          quantity: line.quantity,
          stockCode: line.stockCode,
        }));
      }
      default:
        return [];
    }
  },

  async getPackages(headerId: number): Promise<BarcodeSourcePackageOption[]> {
    const packages = await packageApi.getPPackagesByHeader(headerId);
    return packages.map((item) => ({
      id: item.id,
      headerId,
      sourceModule: 'package',
      title: item.packageNo,
      subtitle: item.packageType,
      barcode: item.barcode,
      status: item.status,
    }));
  },
};
