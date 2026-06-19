import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { AdvancedFilter } from './AdvancedFilter';
import { ColumnPreferencesPopover, type ColumnDef } from './ColumnPreferencesPopover';
import { GridExportMenu } from './GridExportMenu';
import { OpsActionButton } from './OpsActionButton';
import { OpsListSearchField } from './OpsListSearchField';
import { cn } from '@/lib/utils';
import type { FilterColumnConfig, FilterRow } from '@/lib/advanced-filter-types';
import type { GridExportColumn } from '@/lib/grid-export';

export type DataTableVariant = 'default' | 'ops';

export interface DataTableSearchConfig {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  minLength?: number;
  resetKey?: string | number;
}

export interface DataTableRefreshConfig {
  onRefresh: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  cooldownSeconds?: number;
  label?: string;
}

export interface DataTableActionBarProps {
  pageKey: string;
  userId?: number;
  columns: ColumnDef[];
  visibleColumns: string[];
  columnOrder: string[];
  onVisibleColumnsChange: (visible: string[]) => void;
  onColumnOrderChange: (order: string[]) => void;
  lockedKeys?: string[];
  exportFileName: string;
  exportColumns: GridExportColumn[];
  exportRows: Record<string, unknown>[];
  getExportData?: () => Promise<{ columns: GridExportColumn[]; rows: Record<string, unknown>[] }>;
  filterColumns: readonly FilterColumnConfig[];
  defaultFilterColumn: string;
  draftFilterRows: FilterRow[];
  onDraftFilterRowsChange: (rows: FilterRow[]) => void;
  filterLogic?: 'and' | 'or';
  onFilterLogicChange?: (value: 'and' | 'or') => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  translationNamespace?: string;
  appliedFilterCount?: number;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  searchClassName?: string;
  search?: DataTableSearchConfig;
  refresh?: DataTableRefreshConfig;
  searchDebounceMs?: number;
  leftSlot?: React.ReactNode;
  afterRefreshSlot?: React.ReactNode;
  variant?: DataTableVariant;
}

export function DataTableActionBar({
  pageKey,
  userId,
  columns,
  visibleColumns,
  columnOrder,
  onVisibleColumnsChange,
  onColumnOrderChange,
  lockedKeys = ['id'],
  exportFileName,
  exportColumns,
  exportRows,
  getExportData,
  filterColumns,
  defaultFilterColumn,
  draftFilterRows,
  onDraftFilterRowsChange,
  filterLogic,
  onFilterLogicChange,
  onApplyFilters,
  onClearFilters,
  translationNamespace = 'common',
  appliedFilterCount = 0,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  searchClassName = 'h-9 w-[200px]',
  search,
  refresh,
  searchDebounceMs = 700,
  leftSlot,
  afterRefreshSlot,
  variant = 'default',
}: DataTableActionBarProps): ReactElement {
  const { t } = useTranslation([translationNamespace, 'common']);
  const isOps = variant === 'ops';
  const [showFilters, setShowFilters] = useState(false);
  const [internalSearchValue, setInternalSearchValue] = useState(search?.defaultValue ?? '');
  const [legacyDisplayValue, setLegacyDisplayValue] = useState(searchValue ?? '');
  const [refreshCooldownUntil, setRefreshCooldownUntil] = useState<number | null>(null);
  const [refreshNow, setRefreshNow] = useState(() => Date.now());
  const lastEmittedLegacyRef = useRef(searchValue ?? '');

  const isSearchControlled = search?.value !== undefined;
  const useLegacySearch = Boolean(onSearchChange && !search);
  const debouncedLegacyValue = useDebouncedValue(legacyDisplayValue, searchDebounceMs);

  useEffect(() => {
    if (!useLegacySearch) return;
    if (debouncedLegacyValue === lastEmittedLegacyRef.current) return;
    lastEmittedLegacyRef.current = debouncedLegacyValue;
    onSearchChange?.(debouncedLegacyValue);
  }, [debouncedLegacyValue, onSearchChange, useLegacySearch]);

  useEffect(() => {
    if (!useLegacySearch) return;
    if (searchValue === '') {
      setLegacyDisplayValue('');
      lastEmittedLegacyRef.current = '';
      return;
    }
    if (searchValue === lastEmittedLegacyRef.current) {
      setLegacyDisplayValue(searchValue);
    }
  }, [searchValue, useLegacySearch]);

  useEffect(() => {
    if (!search?.resetKey || isSearchControlled) return;
    setInternalSearchValue(search.defaultValue ?? '');
  }, [isSearchControlled, search?.defaultValue, search?.resetKey]);

  useEffect(() => {
    if (!refreshCooldownUntil) return;
    if (refreshCooldownUntil <= Date.now()) {
      setRefreshCooldownUntil(null);
      return;
    }

    const interval = window.setInterval(() => {
      setRefreshNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [refreshCooldownUntil]);

  const currentSearchValue = search
    ? (isSearchControlled ? (search.value ?? '') : internalSearchValue)
    : legacyDisplayValue;
  const debouncedSearchConfigValue = useDebouncedValue(currentSearchValue, search?.debounceMs ?? 700);
  const debouncedSearchValue = search ? debouncedSearchConfigValue : debouncedLegacyValue;
  const normalizedSearchValue = useMemo(() => {
    const trimmed = debouncedSearchValue.trim();
    if (!trimmed) return '';
    const minLength = Math.max(search?.minLength ?? 0, 0);
    return trimmed.length < minLength ? '' : trimmed;
  }, [debouncedSearchValue, search?.minLength]);

  const searchOnSearchChangeRef = useRef(search?.onSearchChange);
  searchOnSearchChangeRef.current = search?.onSearchChange;
  useEffect(() => {
    if (!searchOnSearchChangeRef.current) return;
    searchOnSearchChangeRef.current(normalizedSearchValue);
  }, [normalizedSearchValue]);

  const handleSearchInputChange = (value: string): void => {
    if (search) {
      if (!isSearchControlled) {
        setInternalSearchValue(value);
      }
      search.onValueChange?.(value);
      return;
    }
    setLegacyDisplayValue(value);
  };

  const resolvedSearchPlaceholder = search?.placeholder ?? searchPlaceholder ?? t('common.search');
  const resolvedSearchClassName = search?.className ?? (isOps ? 'md:w-64' : searchClassName);
  const shouldRenderSearch = Boolean(search || onSearchChange);
  const refreshCooldownSeconds = Math.max(refresh?.cooldownSeconds ?? 60, 0);
  const refreshRemainingSeconds = refreshCooldownUntil == null
    ? 0
    : Math.max(0, Math.ceil((refreshCooldownUntil - refreshNow) / 1000));
  const isRefreshDisabled = Boolean(refresh?.disabled || refresh?.isLoading || refreshRemainingSeconds > 0);
  const refreshLabel = refresh?.label ?? t('refresh', { ns: 'common' });

  const handleRefresh = (): void => {
    if (!refresh || isRefreshDisabled) return;
    refresh.onRefresh();
    if (refreshCooldownSeconds > 0) {
      setRefreshCooldownUntil(Date.now() + refreshCooldownSeconds * 1000);
      setRefreshNow(Date.now());
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2', isOps && 'wms-ops-data-grid-toolbar')}>
      <div className={cn('flex min-w-0 items-center gap-2', isOps && 'wms-ops-data-grid-toolbar__start')}>
        {shouldRenderSearch && (
          isOps ? (
            <OpsListSearchField
              value={currentSearchValue}
              placeholder={resolvedSearchPlaceholder}
              onValueChange={handleSearchInputChange}
              rightSlot={leftSlot}
              className={resolvedSearchClassName}
            />
          ) : (
            <Input
              placeholder={resolvedSearchPlaceholder}
              value={currentSearchValue}
              onChange={(event) => handleSearchInputChange(event.target.value)}
              className={resolvedSearchClassName}
            />
          )
        )}
        {refresh && (
          isOps ? (
            <OpsActionButton
              type="button"
              variant="secondary"
              className="wms-ops-list-toolbar-btn"
              onClick={handleRefresh}
              disabled={isRefreshDisabled}
            >
              <RefreshCw className={cn('size-3.5', refresh?.isLoading && 'animate-spin')} aria-hidden />
              {refreshRemainingSeconds > 0 ? `${refreshLabel} (${refreshRemainingSeconds}s)` : refreshLabel}
            </OpsActionButton>
          ) : (
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshDisabled}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refresh?.isLoading ? 'animate-spin' : ''}`} />
              {refreshRemainingSeconds > 0 ? `${refreshLabel} (${refreshRemainingSeconds}s)` : refreshLabel}
            </Button>
          )
        )}
        {afterRefreshSlot ? (
          <div className={cn('flex shrink-0 flex-wrap items-center gap-1.5', isOps && 'wms-ops-data-grid-toolbar__after-refresh')}>
            {afterRefreshSlot}
          </div>
        ) : null}
        {(!isOps || !shouldRenderSearch) && leftSlot ? leftSlot : null}
      </div>
      <div className={cn('flex flex-wrap items-center gap-2', isOps && 'wms-ops-data-grid-toolbar__end')}>
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            {isOps ? (
              <OpsActionButton
                type="button"
                variant="secondary"
                className={cn(
                  'wms-ops-list-toolbar-btn',
                  appliedFilterCount > 0 && 'wms-ops-list-toolbar-btn--active',
                )}
              >
                <Filter className="size-3.5" aria-hidden />
                {t('common.filters')}
                {appliedFilterCount > 0 && (
                  <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-none bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                    {appliedFilterCount}
                  </span>
                )}
              </OpsActionButton>
            ) : (
              <Button
                variant={appliedFilterCount > 0 ? 'default' : 'outline'}
                size="sm"
                className={`h-9 border-dashed border-slate-300 dark:border-white/20 text-xs sm:text-sm ${
                  appliedFilterCount > 0
                    ? 'bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30 hover:bg-pink-500/30'
                    : 'bg-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <Filter className="mr-2 h-4 w-4" />
                {t('common.filters')}
                {appliedFilterCount > 0 && (
                  <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                    {appliedFilterCount}
                  </span>
                )}
              </Button>
            )}
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            className={cn(
              isOps
                ? 'wms-ops-list-popover wms-ops-list-popover--filter w-[640px] max-w-[95vw] p-0 border-0 shadow-none'
                : 'w-[560px] max-w-[95vw] p-0 rounded-2xl overflow-hidden',
            )}
          >
            <div className={cn(isOps ? 'wms-ops-list-popover__header' : 'flex items-center justify-between p-3 border-b border-white/5')}>
              <h3 className={cn(isOps ? 'wms-ops-list-popover__title' : 'text-sm font-semibold text-slate-700 dark:text-slate-200')}>
                {t('advancedFilter.title', { ns: translationNamespace, defaultValue: t('advancedFilter.title', { ns: 'common' }) })}
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className={cn(isOps ? 'wms-ops-list-popover__close' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors')}
                aria-label={t('common.close')}
              >
                <X size={16} />
              </button>
            </div>
            <div className={cn(isOps ? 'wms-ops-list-popover__body' : 'max-h-[420px] overflow-y-auto p-3')}>
              <AdvancedFilter
                columns={filterColumns}
                defaultColumn={defaultFilterColumn}
                draftRows={draftFilterRows}
                onDraftRowsChange={onDraftFilterRowsChange}
                filterLogic={filterLogic}
                onFilterLogicChange={onFilterLogicChange}
                onSearch={() => {
                  onApplyFilters();
                  setShowFilters(false);
                }}
                onClear={() => {
                  onClearFilters();
                  setShowFilters(false);
                }}
                translationNamespace={translationNamespace}
                embedded
                variant={variant}
                appliedFilterCount={appliedFilterCount}
              />
            </div>
          </PopoverContent>
        </Popover>

        <GridExportMenu
          fileName={exportFileName}
          columns={exportColumns}
          rows={exportRows}
          getExportData={getExportData}
          variant={variant}
        />

        <ColumnPreferencesPopover
          pageKey={pageKey}
          userId={userId}
          columns={columns}
          visibleColumns={visibleColumns}
          columnOrder={columnOrder}
          onVisibleColumnsChange={onVisibleColumnsChange}
          onColumnOrderChange={onColumnOrderChange}
          lockedKeys={lockedKeys}
          variant={variant}
        />
      </div>
    </div>
  );
}
