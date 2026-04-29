import type { CreateOrUpdateVehicleCheckInDto } from '../../types/vehicle-check-in.types';

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('tr-TR');
}

export function buildCustomerLabel(record: Pick<CreateOrUpdateVehicleCheckInDto, 'customerCode' | 'customerName'>): string | null {
  if (!record.customerCode && !record.customerName) {
    return null;
  }

  return [record.customerCode, record.customerName].filter(Boolean).join(' - ');
}

export function normalizePlateForLookup(value?: string | null): string {
  if (!value) {
    return '';
  }

  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}
