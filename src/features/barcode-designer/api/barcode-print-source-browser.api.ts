import { goodsReceiptApi } from '@/features/goods-receipt/api/goods-receipt-api';
import { packageApi } from '@/features/package/api/package-api';
import { productionTransferApi } from '@/features/production-transfer/api/production-transfer-api';
import { shipmentApi } from '@/features/shipment/api/shipment-api';
import { subcontractingApi } from '@/features/subcontracting/api/subcontracting-api';
import { transferApi } from '@/features/transfer/api/transfer-api';
import { warehouseApi } from '@/features/warehouse/api/warehouse-api';
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

export const barcodePrintSourceBrowserApi = {
  async getHeaders(sourceModule: BarcodePrintSourceModule, search = ''): Promise<BarcodeSourceHeaderOption[]> {
    switch (sourceModule) {
      case 'goods-receipt': {
        const headers = await goodsReceiptApi.getGrHeadersPaged({ pageNumber: 1, pageSize: 50, search });
        return filterHeaders(headers.data.map((header) => ({
          id: header.id,
          sourceModule,
          title: header.documentNo,
          subtitle: [header.customerCode, header.customerName].filter(Boolean).join(' - '),
          status: header.isCompleted ? 'Tamamlandi' : 'Acik',
          documentDate: header.documentDate,
        })), search);
      }
      case 'transfer': {
        const headers = await transferApi.getHeadersPaged({ pageNumber: 1, pageSize: 50, search });
        return filterHeaders(headers.data.map((header) => ({
          id: header.id,
          sourceModule,
          title: header.documentNo,
          subtitle: [header.customerCode, header.customerName].filter(Boolean).join(' - '),
          status: header.isCompleted ? 'Tamamlandi' : 'Acik',
          documentDate: header.documentDate,
        })), search);
      }
      case 'warehouse-inbound': {
        const headers = await warehouseApi.getInboundHeadersPaged({ pageNumber: 1, pageSize: 50, search });
        return filterHeaders(headers.data.map((header) => ({
          id: header.id,
          sourceModule,
          title: header.documentNo,
          subtitle: [header.sourceWarehouse, header.customerCode].filter(Boolean).join(' - '),
          status: header.isCompleted ? 'Tamamlandi' : 'Acik',
          documentDate: header.documentDate,
        })), search);
      }
      case 'warehouse-outbound': {
        const headers = await warehouseApi.getOutboundHeadersPaged({ pageNumber: 1, pageSize: 50, search });
        return filterHeaders(headers.data.map((header) => ({
          id: header.id,
          sourceModule,
          title: header.documentNo,
          subtitle: [header.targetWarehouse, header.customerCode].filter(Boolean).join(' - '),
          status: header.isCompleted ? 'Tamamlandi' : 'Acik',
          documentDate: header.documentDate,
        })), search);
      }
      case 'shipment': {
        const headers = await shipmentApi.getHeadersPaged({ pageNumber: 1, pageSize: 50, search });
        return filterHeaders(headers.data.map((header) => ({
          id: header.id,
          sourceModule,
          title: header.documentNo,
          subtitle: [header.customerCode, header.customerName].filter(Boolean).join(' - '),
          status: header.isCompleted ? 'Tamamlandi' : 'Acik',
          documentDate: header.documentDate,
        })), search);
      }
      case 'subcontracting-issue': {
        const headers = await subcontractingApi.getIssueHeadersPaged({ pageNumber: 1, pageSize: 50, search });
        return filterHeaders(headers.data.map((header) => ({
          id: header.id,
          sourceModule,
          title: header.documentNo,
          subtitle: [header.customerCode, header.customerName].filter(Boolean).join(' - '),
          status: header.isCompleted ? 'Tamamlandi' : 'Acik',
          documentDate: header.documentDate,
        })), search);
      }
      case 'subcontracting-receipt': {
        const headers = await subcontractingApi.getReceiptHeadersPaged({ pageNumber: 1, pageSize: 50, search });
        return filterHeaders(headers.data.map((header) => ({
          id: header.id,
          sourceModule,
          title: header.documentNo,
          subtitle: [header.customerCode, header.customerName].filter(Boolean).join(' - '),
          status: header.isCompleted ? 'Tamamlandi' : 'Acik',
          documentDate: header.documentDate,
        })), search);
      }
      case 'package': {
        const headers = await packageApi.getPHeadersPaged({ pageNumber: 1, pageSize: 50, search });
        return filterHeaders(headers.data.map((header) => ({
          id: header.id,
          sourceModule,
          title: header.packingNo,
          subtitle: [header.customerCode, header.sourceType].filter(Boolean).join(' - '),
          status: header.status,
          documentDate: header.packingDate,
        })), search);
      }
      case 'production-transfer': {
        const headers = await productionTransferApi.getHeadersPaged({ pageNumber: 1, pageSize: 50, search });
        return filterHeaders(headers.data.map((header) => ({
          id: header.id,
          sourceModule,
          title: header.documentNo,
          subtitle: [header.productionOrderId ? `Uretim #${header.productionOrderId}` : null, header.transferPurpose].filter(Boolean).join(' - '),
          status: header.isCompleted ? 'Tamamlandi' : 'Acik',
          documentDate: header.documentDate,
        })), search);
      }
      default:
        return [];
    }
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
