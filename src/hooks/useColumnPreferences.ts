import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { loadColumnPreferences, saveColumnPreferences, pinLeadingLockedKeys } from '@/lib/column-preferences';
import type { ColumnDef } from '@/components/shared';
import { normalizeColumnWeights, resizeColumnWeightPair } from '@/components/shared/data-table-grid/column-widths';

interface UseColumnPreferencesOptions {
  pageKey: string;
  columns: ColumnDef[];
  idColumnKey?: string;
  defaultWidths?: Record<string, number>;
  actionsColumnWeight?: number;
  includeActionsColumn?: boolean;
}

interface UseColumnPreferencesResult {
  userId?: number;
  columnOrder: string[];
  visibleColumns: string[];
  orderedVisibleColumns: string[];
  columnWidths: Record<string, number>;
  setColumnOrder: (order: string[]) => void;
  setVisibleColumns: (columns: string[]) => void;
  resizeColumnPair: (leftKey: string, rightKey: string, deltaWeight: number) => void;
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function widthsEqual(left: Record<string, number>, right: Record<string, number>): boolean {
  const leftKeys = Object.keys(left);
  if (leftKeys.length !== Object.keys(right).length) return false;
  return leftKeys.every((key) => left[key] === right[key]);
}

export function useColumnPreferences({
  pageKey,
  columns,
  idColumnKey = 'id',
  defaultWidths = {},
  actionsColumnWeight,
  includeActionsColumn = false,
}: UseColumnPreferencesOptions): UseColumnPreferencesResult {
  const userId = useAuthStore((state) => state.user?.id);
  const columnSignature = columns.map((column) => column.key).join('|');
  const defaultOrder = useMemo(() => (columnSignature ? columnSignature.split('|') : []), [columnSignature]);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrder);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultOrder);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    normalizeColumnWeights(defaultOrder, defaultWidths, actionsColumnWeight, includeActionsColumn),
  );

  useEffect(() => {
    const prefs = loadColumnPreferences(pageKey, userId, defaultOrder, idColumnKey, defaultWidths);
    const validOrder = prefs.order.filter((key) => defaultOrder.includes(key));
    const missingOrderKeys = defaultOrder.filter((key) => !validOrder.includes(key));
    const normalizedOrder = pinLeadingLockedKeys(
      validOrder.length > 0 ? [...validOrder, ...missingOrderKeys] : defaultOrder,
      defaultOrder.includes(idColumnKey) ? [idColumnKey] : [],
    );
    const validVisible = prefs.visibleKeys.filter((key) => normalizedOrder.includes(key));
    const missingVisibleKeys = missingOrderKeys.filter((key) => !validVisible.includes(key));
    const normalizedVisible = validVisible.length > 0 ? [...validVisible, ...missingVisibleKeys] : normalizedOrder;
    const normalizedWidths = normalizeColumnWeights(
      normalizedVisible.filter((key) => key !== 'actions'),
      prefs.widths ?? defaultWidths,
      actionsColumnWeight,
      includeActionsColumn,
    );

    setColumnOrder((current) => (arraysEqual(current, normalizedOrder) ? current : normalizedOrder));
    setVisibleColumns((current) => (arraysEqual(current, normalizedVisible) ? current : normalizedVisible));
    setColumnWidths((current) => (widthsEqual(current, normalizedWidths) ? current : normalizedWidths));
  }, [actionsColumnWeight, columnSignature, defaultOrder, defaultWidths, idColumnKey, includeActionsColumn, pageKey, userId]);

  const setColumnOrderPinned = useCallback((order: string[]) => {
    setColumnOrder(
      defaultOrder.includes(idColumnKey)
        ? pinLeadingLockedKeys(order, [idColumnKey])
        : order,
    );
  }, [defaultOrder, idColumnKey]);

  const orderedVisibleColumns = useMemo(
    () => columnOrder.filter((key) => visibleColumns.includes(key)),
    [columnOrder, visibleColumns],
  );

  const persistWidths = useCallback((nextWidths: Record<string, number>) => {
    saveColumnPreferences(pageKey, userId, {
      visibleKeys: visibleColumns,
      order: columnOrder,
      widths: nextWidths,
    });
  }, [columnOrder, pageKey, userId, visibleColumns]);

  const resizeColumnPair = useCallback((leftKey: string, rightKey: string, deltaWeight: number): void => {
    setColumnWidths((current) => {
      const next = resizeColumnWeightPair(current, leftKey, rightKey, deltaWeight);
      if (next === current) return current;
      persistWidths(next);
      return next;
    });
  }, [persistWidths]);

  return {
    userId,
    columnOrder,
    visibleColumns,
    orderedVisibleColumns,
    columnWidths,
    setColumnOrder: setColumnOrderPinned,
    setVisibleColumns,
    resizeColumnPair,
  };
}
