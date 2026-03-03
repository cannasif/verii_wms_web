import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const PAGE_SIZE_STORAGE_PREFIX = 'page-size';

interface UsePageSizePreferenceOptions {
  pageKey: string;
  defaultPageSize?: number;
  options?: number[];
}

interface UsePageSizePreferenceResult {
  pageSize: number;
  pageSizeOptions: number[];
  setPageSize: (value: number) => void;
}

function getStorageKey(pageKey: string, userId?: number): string {
  const uid = userId ?? 'anonymous';
  return `${PAGE_SIZE_STORAGE_PREFIX}:${pageKey}:${uid}`;
}

export function usePageSizePreference({
  pageKey,
  defaultPageSize = 10,
  options = [10, 20, 50, 100],
}: UsePageSizePreferenceOptions): UsePageSizePreferenceResult {
  const userId = useAuthStore((state) => state.user?.id);
  const normalizedOptions = useMemo(() => {
    const sorted = [...options].filter((opt) => Number.isFinite(opt) && opt > 0);
    return sorted.length > 0 ? sorted : [defaultPageSize];
  }, [defaultPageSize, options]);
  const fallbackSize = normalizedOptions.includes(defaultPageSize)
    ? defaultPageSize
    : normalizedOptions[0];
  const [pageSize, setPageSizeState] = useState<number>(fallbackSize);

  useEffect(() => {
    const key = getStorageKey(pageKey, userId);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        setPageSizeState(fallbackSize);
        return;
      }

      const parsed = Number.parseInt(raw, 10);
      if (Number.isNaN(parsed) || !normalizedOptions.includes(parsed)) {
        setPageSizeState(fallbackSize);
        return;
      }

      setPageSizeState(parsed);
    } catch {
      setPageSizeState(fallbackSize);
    }
  }, [fallbackSize, normalizedOptions, pageKey, userId]);

  const setPageSize = (value: number): void => {
    const next = normalizedOptions.includes(value) ? value : fallbackSize;
    setPageSizeState(next);

    const key = getStorageKey(pageKey, userId);
    try {
      localStorage.setItem(key, String(next));
    } catch {
      // Ignore localStorage errors.
    }
  };

  return {
    pageSize,
    pageSizeOptions: normalizedOptions,
    setPageSize,
  };
}
