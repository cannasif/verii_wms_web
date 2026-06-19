const COLUMN_STORAGE_PREFIX = 'page-columns';

export interface ColumnPreferences {
  visibleKeys: string[];
  order: string[];
  widths?: Record<string, number>;
}

export function getColumnStorageKey(pageKey: string, userId: number | undefined): string {
  const uid = userId ?? 'anonymous';
  return `${COLUMN_STORAGE_PREFIX}:${pageKey}:${uid}`;
}

export function pinLeadingLockedKeys(order: string[], lockedKeys: string[] = ['id']): string[] {
  const lockedSet = new Set(lockedKeys);
  const pinned = lockedKeys.filter((key) => order.includes(key));
  const rest = order.filter((key) => !lockedSet.has(key));
  return [...pinned, ...rest];
}

export function loadColumnPreferences(
  pageKey: string,
  userId: number | undefined,
  defaultOrder: string[],
  idColumnKey = 'id',
  defaultWidths: Record<string, number> = {},
): ColumnPreferences {
  const key = getColumnStorageKey(pageKey, userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { visibleKeys: [...defaultOrder], order: [...defaultOrder], widths: { ...defaultWidths } };
    }

    const parsed = JSON.parse(raw) as { visibleKeys?: string[]; order?: string[]; widths?: Record<string, number> };
    const storedOrder = Array.isArray(parsed.order) ? parsed.order : [...defaultOrder];
    const storedVisible = Array.isArray(parsed.visibleKeys) ? parsed.visibleKeys : [...defaultOrder];

    const validOrder = storedOrder.filter((k) => defaultOrder.includes(k));
    const missingOrder = defaultOrder.filter((k) => !validOrder.includes(k));
    let order = validOrder.length > 0 ? [...validOrder, ...missingOrder] : [...defaultOrder];

    const visibleKeys = storedVisible.filter((k) => defaultOrder.includes(k));
    const visibleWithDefaults = visibleKeys.length > 0 ? visibleKeys : [...defaultOrder];

    if (defaultOrder.includes(idColumnKey)) {
      order = pinLeadingLockedKeys(order, [idColumnKey]);
    }

    const mergedWidths = { ...defaultWidths, ...(parsed.widths ?? {}) };

    return { visibleKeys: visibleWithDefaults, order, widths: mergedWidths };
  } catch {
    return { visibleKeys: [...defaultOrder], order: [...defaultOrder], widths: { ...defaultWidths } };
  }
}

export function saveColumnPreferences(
  pageKey: string,
  userId: number | undefined,
  prefs: ColumnPreferences
): void {
  const key = getColumnStorageKey(pageKey, userId);
  try {
    const existingRaw = localStorage.getItem(key);
    const existing = existingRaw ? JSON.parse(existingRaw) as Partial<ColumnPreferences> : {};
    localStorage.setItem(key, JSON.stringify({
      visibleKeys: prefs.visibleKeys,
      order: prefs.order,
      widths: prefs.widths ?? existing.widths,
    }));
  } catch {
    // Ignore localStorage write failures.
  }
}
