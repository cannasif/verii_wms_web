import type { UseFormReturn } from 'react-hook-form';

export type ServiceCaseFormValues = {
  caseNo: string;
  customerCode: string;
  customerId?: string;
  incomingStockCode: string;
  incomingStockId?: string;
  incomingSerialNo: string;
  intakeWarehouseId?: string;
  currentWarehouseId?: string;
  diagnosisNote: string;
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
