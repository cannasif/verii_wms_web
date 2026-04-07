import { type ReactElement, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { inventoryCountApi } from '../api/inventory-count-api';
import type { InventoryCountHeader } from '../types/inventory-count';

type InventoryCountColumnKey =
  | 'documentNo'
  | 'documentDate'
  | 'countType'
  | 'scopeMode'
  | 'countMode'
  | 'status'
  | 'lineCount'
  | 'differenceLineCount'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'common.documentNo' },
  { value: 'countType', type: 'string', labelKey: 'inventoryCount.fields.countType' },
  { value: 'scopeMode', type: 'string', labelKey: 'inventoryCount.fields.scopeMode' },
  { value: 'status', type: 'string', labelKey: 'common.status' },
  { value: 'warehouseCode', type: 'string', labelKey: 'inventoryCount.fields.warehouse' },
  { value: 'stockCode', type: 'string', labelKey: 'inventoryCount.fields.stock' },
];

function mapSortBy(value: InventoryCountColumnKey): string {
  switch (value) {
    case 'documentNo':
      return 'DocumentNo';
    case 'documentDate':
      return 'DocumentDate';
    case 'countType':
      return 'CountType';
    case 'scopeMode':
      return 'ScopeMode';
    case 'countMode':
      return 'CountMode';
    case 'status':
      return 'Status';
    case 'lineCount':
      return 'LineCount';
    case 'differenceLineCount':
      return 'DifferenceLineCount';
    default:
      return 'Id';
  }
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR');
}

function getCountTypeLabel(value?: string | null): string {
  switch (value) {
    case 'General': return 'Genel';
    case 'Warehouse': return 'Depo';
    case 'Stock': return 'Stok';
    case 'Rack': return 'Raf';
    case 'Cell': return 'Hucre';
    case 'Combined': return 'Birlesik';
    default: return value || '-';
  }
}

export function InventoryCountListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const pageKey = 'inventory-count-list';

  const pagedGrid = usePagedDataGrid<InventoryCountColumnKey>({
    pageKey,
    defaultSortBy: 'documentDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('inventoryCount.list.title', { defaultValue: 'Sayim Emirleri' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<InventoryCountColumnKey>[]>(() => [
    { key: 'documentNo', label: t('common.documentNo', { defaultValue: 'Belge No' }) },
    { key: 'documentDate', label: t('common.documentDate', { defaultValue: 'Belge Tarihi' }) },
    { key: 'countType', label: t('inventoryCount.fields.countType', { defaultValue: 'Sayim tipi' }) },
    { key: 'scopeMode', label: t('inventoryCount.fields.scopeMode', { defaultValue: 'Kapsam' }) },
    { key: 'countMode', label: t('inventoryCount.fields.countMode', { defaultValue: 'Mod' }) },
    { key: 'status', label: t('common.status', { defaultValue: 'Durum' }) },
    { key: 'lineCount', label: t('inventoryCount.fields.lineCount', { defaultValue: 'Satir' }) },
    { key: 'differenceLineCount', label: t('inventoryCount.fields.differenceLineCount', { defaultValue: 'Fark' }) },
    { key: 'actions', label: t('common.actions', { defaultValue: 'Islemler' }), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'documentNo',
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory-count-list', pagedGrid.queryParams],
    queryFn: () => inventoryCountApi.getHeadersPaged(pagedGrid.queryParams),
  });

  const exportColumns = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({
      key,
      label: columns.find((column) => column.key === key)?.label ?? key,
    })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => (
    (data?.data ?? []).map((row) => ({
      documentNo: row.documentNo || '-',
      documentDate: formatDate(row.documentDate),
      countType: getCountTypeLabel(row.countType),
      scopeMode: row.scopeMode || '-',
      countMode: row.countMode || '-',
      status: row.status || '-',
      lineCount: row.lineCount ?? 0,
      differenceLineCount: row.differenceLineCount ?? 0,
    }))
  ), [data?.data]);

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as InventoryCountColumnKey[],
    [orderedVisibleColumns],
  );

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const renderSortIcon = (columnKey: InventoryCountColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="crm-page space-y-6">
      <PagedDataGrid<InventoryCountHeader, InventoryCountColumnKey>
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'documentNo':
              return <span className="font-medium">{row.documentNo || '-'}</span>;
            case 'documentDate':
              return formatDate(row.documentDate);
            case 'countType':
              return getCountTypeLabel(row.countType);
            case 'scopeMode':
              return row.scopeMode || '-';
            case 'countMode':
              return row.countMode === 'Blind' ? 'Kor' : row.countMode === 'Open' ? 'Acik' : (row.countMode || '-');
            case 'status':
              return <Badge variant="secondary">{row.status || 'Draft'}</Badge>;
            case 'lineCount':
              return row.lineCount ?? 0;
            case 'differenceLineCount':
              return row.differenceLineCount ?? 0;
            default:
              return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={(columnKey) => {
          if (columnKey !== 'actions') pagedGrid.handleSort(columnKey);
        }}
        renderSortIcon={renderSortIcon}
        isLoading={isLoading}
        isError={Boolean(error)}
        errorText={error instanceof Error ? error.message : t('inventoryCount.list.error', { defaultValue: 'Sayim emirleri yuklenemedi.' })}
        emptyText={t('inventoryCount.list.noData', { defaultValue: 'Henuz sayim emri bulunmuyor.' })}
        showActionsColumn={orderedVisibleColumns.includes('actions')}
        actionsHeaderLabel={t('common.actions', { defaultValue: 'Islemler' })}
        renderActionsCell={(row) => (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/inventory-count/process?headerId=' + String(row.id))}>
              {t('inventoryCount.actions.process', { defaultValue: 'Direkt Giris' })}
            </Button>
          </div>
        )}
        pageSize={data?.pageSize ?? pagedGrid.pageSize}
        pageSizeOptions={pagedGrid.pageSizeOptions}
        onPageSizeChange={pagedGrid.handlePageSizeChange}
        pageNumber={pagedGrid.getDisplayPageNumber(data)}
        totalPages={Math.max(data?.totalPages ?? 1, 1)}
        hasPreviousPage={Boolean(data?.hasPreviousPage)}
        hasNextPage={Boolean(data?.hasNextPage)}
        onPreviousPage={pagedGrid.goToPreviousPage}
        onNextPage={pagedGrid.goToNextPage}
        previousLabel={t('common.previous', { defaultValue: 'Onceki' })}
        nextLabel={t('common.next', { defaultValue: 'Sonraki' })}
        paginationInfoText={paginationInfoText}
        actionBar={{
          pageKey,
          userId,
          columns: columns.map(({ key, label }) => ({ key, label })),
          visibleColumns,
          columnOrder,
          onVisibleColumnsChange: setVisibleColumns,
          onColumnOrderChange: setColumnOrder,
          exportFileName: 'inventory-count-list',
          exportColumns,
          exportRows,
          filterColumns: advancedFilterColumns,
          defaultFilterColumn: 'documentNo',
          draftFilterRows: pagedGrid.draftFilterRows,
          onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
          filterLogic: pagedGrid.filterLogic,
          onFilterLogicChange: pagedGrid.setFilterLogic,
          onApplyFilters: pagedGrid.applyAdvancedFilters,
          onClearFilters: pagedGrid.clearAdvancedFilters,
          appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
          search: {
            value: pagedGrid.searchInput,
            onValueChange: pagedGrid.searchConfig.onValueChange,
            onSearchChange: pagedGrid.searchConfig.onSearchChange,
            placeholder: t('inventoryCount.list.searchPlaceholder', { defaultValue: 'Belge no, depo ya da stok ara' }),
          },
          leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
          refresh: {
            onRefresh: () => {
              void refetch();
            },
            isLoading,
          },
        }}
      />
    </div>
  );
}
