import type { UseFormReturn } from 'react-hook-form';

export type ServiceCaseFormValues = {
  caseNo: string;
  requestSource: string;
  requestReference: string;
  customerCode: string;
  customerId?: string;
  incomingStockCode: string;
  incomingStockId?: string;
  incomingSerialNo: string;
  barcode: string;
  saleDate: string;
  warrantyPeriodMonths: string;
  warrantyStatus: string;
  forceWarrantyOverride: boolean;
  warrantyOverrideReason: string;
  intakeWarehouseId?: string;
  currentWarehouseId?: string;
  serviceWarehouseId?: string;
  serviceShelfId?: string;
  customerComplaint: string;
  faultDescription: string;
  diagnosisNote: string;
  resolutionNote: string;
  status: string;
  receivedAt: string;
  closedAt: string;
  initialLineType: string;
  initialProcessType: string;
  initialLineStockCode: string;
  initialLineStockId?: string;
  initialLineQuantity?: string;
  initialLineUnit: string;
  initialLineErpOrderNo: string;
  initialLineErpOrderId: string;
  initialLineDescription: string;
};

export type ServiceCaseFormApi = UseFormReturn<ServiceCaseFormValues>;

export function toDateInput(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
}
