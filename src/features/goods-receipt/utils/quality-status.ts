const QUALITY_PENDING_STATUSES = new Set(['pendinginspection', 'quarantined']);

export function isGoodsReceiptQualityPending(qualityStatus?: string | null): boolean {
  if (!qualityStatus) return false;
  return QUALITY_PENDING_STATUSES.has(qualityStatus.trim().toLowerCase());
}
