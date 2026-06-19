import type { TFunction } from 'i18next';

export function getPrintSourceStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Consumed':
    case 'Tamamlandi':
      return 'wms-ops-status-badge wms-ops-status-badge--done';
    case 'PartiallyConsumed':
    case 'PartiallyPrinted':
      return 'wms-ops-status-badge wms-ops-status-badge--pending';
    case 'Cancelled':
    case 'Void':
    case 'Iptal':
      return 'wms-ops-status-badge wms-ops-status-badge--danger';
    case 'Printed':
    case 'Generated':
    case 'Acik':
    default:
      return 'wms-ops-status-badge wms-ops-status-badge--active';
  }
}

export function localizePrintSourceStatus(
  status: string | null | undefined,
  t: TFunction<'common'>,
): string {
  const value = (status ?? '').trim();
  if (!value) return '-';
  return t(`barcodePrint.statuses.${value}`, { defaultValue: value });
}
