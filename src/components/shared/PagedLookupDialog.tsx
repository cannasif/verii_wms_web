import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PagedResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { OpsActionButton } from './OpsActionButton';
import { OpsFieldShell } from './OpsFieldShell';
import { OPS_FIELD_CLASS } from './ops-field-styles';

interface PagedLookupDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  value?: string | null;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  variant?: 'default' | 'ops';
  autoSearchMinLength?: number;
  triggerClassName?: string;
  queryKey: readonly unknown[];
  fetchPage: (args: {
    pageNumber: number;
    pageSize: number;
    search: string;
    signal?: AbortSignal;
  }) => Promise<PagedResponse<T>>;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
}

export function PagedLookupDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  value,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
  variant = 'default',
  autoSearchMinLength,
  triggerClassName,
  queryKey,
  fetchPage,
  getKey,
  getLabel,
  onSelect,
}: PagedLookupDialogProps<T>): ReactElement {
  const { t } = useTranslation('common');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: [...queryKey, search],
    enabled: open,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchPage({
        pageNumber: pageParam,
        pageSize: 20,
        search,
        signal,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [query.data?.pages],
  );

  useEffect(() => {
    if (!open) {
      setSearch('');
      setSearchInput('');
    }
  }, [open]);

  useEffect(() => {
    if (!open || autoSearchMinLength === undefined) {
      return;
    }

    const trimmed = searchInput.trim();

    if (trimmed.length === 0) {
      setSearch('');
      return;
    }

    if (trimmed.length < autoSearchMinLength) {
      setSearch('');
      return;
    }

    const timer = window.setTimeout(() => {
      setSearch(trimmed);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoSearchMinLength, open, searchInput]);

  const handleScroll = (): void => {
    const element = listRef.current;
    if (!element || query.isFetchingNextPage || !query.hasNextPage) {
      return;
    }

    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (remaining < 80) {
      void query.fetchNextPage();
    }
  };

  const isOps = variant === 'ops';
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('paged.searchPlaceholder');

  const trigger = isOps ? (
    <OpsFieldShell>
      <button
        type="button"
        className={cn(
          'wms-ops-lookup-trigger wms-ops-field',
          !value && 'wms-ops-field--placeholder',
          triggerClassName,
        )}
        onClick={() => onOpenChange(true)}
        disabled={disabled}
      >
        <span className="truncate">{value || placeholder}</span>
        <Search className="size-4 shrink-0 opacity-60" aria-hidden />
      </button>
    </OpsFieldShell>
  ) : (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'w-full justify-between font-normal',
        !value && 'text-muted-foreground',
        triggerClassName,
      )}
      onClick={() => onOpenChange(true)}
      disabled={disabled}
    >
      <span className="truncate">{value || placeholder}</span>
      <Search className="size-4 opacity-50" />
    </Button>
  );

  return (
    <>
      {trigger}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            isOps ? 'wms-ops-lookup-dialog sm:max-w-2xl lg:max-w-3xl' : 'sm:max-w-xl',
          )}
        >
          <DialogHeader className={isOps ? 'wms-ops-lookup-dialog__header' : undefined}>
            <DialogTitle className={isOps ? 'wms-ops-lookup-dialog__title' : undefined}>
              {title}
            </DialogTitle>
            {description && !isOps ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className={cn('flex gap-2', isOps && 'items-end')}>
              {isOps ? (
                <OpsFieldShell className="min-w-0 flex-1">
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        setSearch(searchInput.trim());
                      }
                    }}
                    placeholder={resolvedSearchPlaceholder}
                    className={OPS_FIELD_CLASS}
                    aria-label={resolvedSearchPlaceholder}
                  />
                </OpsFieldShell>
              ) : (
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      setSearch(searchInput.trim());
                    }
                  }}
                  placeholder={resolvedSearchPlaceholder}
                  className="min-w-0 flex-1"
                  aria-label={resolvedSearchPlaceholder}
                />
              )}
              {isOps ? (
                <OpsActionButton
                  type="button"
                  variant="secondary"
                  className="wms-ops-lookup-search-btn shrink-0"
                  onClick={() => setSearch(searchInput.trim())}
                >
                  <Search className="size-3.5" aria-hidden />
                  {t('paged.search')}
                </OpsActionButton>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 shrink-0 gap-1.5 px-4"
                  onClick={() => setSearch(searchInput.trim())}
                >
                  <Search className="size-4 opacity-80" aria-hidden />
                  {t('paged.search')}
                </Button>
              )}
            </div>

            <div
              ref={listRef}
              onScroll={handleScroll}
              className={cn(
                'max-h-[min(360px,50vh)] space-y-2 overflow-y-auto p-3',
                isOps
                  ? 'wms-ops-lookup-list'
                  : 'rounded-2xl border border-slate-200/70 bg-slate-50/80 dark:border-white/10 dark:bg-white/3',
              )}
            >
              {query.isLoading ? (
                <div
                  className={cn(
                    'flex items-center justify-center py-8 text-sm',
                    isOps ? 'wms-ops-lookup-empty' : 'text-slate-500',
                  )}
                >
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('common.loading')}
                </div>
              ) : items.length === 0 ? (
                <div
                  className={cn(
                    'py-8 text-center text-sm',
                    isOps ? 'wms-ops-lookup-empty' : 'text-slate-500',
                  )}
                >
                  {emptyText ?? t('common.noResults')}
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={getKey(item)}
                    type="button"
                    className={cn(
                      'flex w-full items-start px-3 py-2 text-left text-sm transition',
                      isOps
                        ? 'wms-ops-lookup-item'
                        : 'rounded-xl border border-slate-200/70 bg-white/80 hover:border-sky-300 hover:bg-sky-50/70 dark:border-white/10 dark:bg-white/4 dark:hover:border-sky-400/50 dark:hover:bg-sky-500/10',
                    )}
                    onClick={() => {
                      onSelect(item);
                      onOpenChange(false);
                    }}
                  >
                    <span className={isOps ? 'wms-ops-lookup-item__label' : 'font-medium text-slate-900 dark:text-white'}>
                      {getLabel(item)}
                    </span>
                  </button>
                ))
              )}

              {query.isFetchingNextPage ? (
                <div
                  className={cn(
                    'flex items-center justify-center py-3 text-xs',
                    isOps ? 'wms-ops-lookup-empty' : 'text-slate-500',
                  )}
                >
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('common.loading')}
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
