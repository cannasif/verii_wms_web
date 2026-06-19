export function getPreLabelStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Consumed':
      return 'wms-ops-status-badge wms-ops-status-badge--done';
    case 'PartiallyConsumed':
      return 'wms-ops-status-badge wms-ops-status-badge--pending';
    case 'Cancelled':
    case 'Void':
      return 'wms-ops-status-badge wms-ops-status-badge--danger';
    case 'Printed':
    case 'PartiallyPrinted':
    case 'Generated':
    default:
      return 'wms-ops-status-badge wms-ops-status-badge--active';
  }
}
