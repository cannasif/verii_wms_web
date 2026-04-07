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
import { useAuthStore } from '@/stores/auth-store';
import { inventoryCountApi } from '../api/inventory-count-api';
import type { InventoryCountHeader } from '../types/inventory-count';

type AssignedInventoryCountColumnKey =
  | 'documentNo'
  | 'countType'
  | 'countMode'
  | 'status'
  | 'lineCount'
  | 'differenceLineCount'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'common.documentNo' },
  { value: 'countType', type: 'string', labelKey: 'inventoryCount.fields.countType' },
  { value: 'status', type: 'string', labelKey: 'common.status' },
];

function mapSortBy(value: AssignedInventoryCountColumnKey): string {
  switch (value) {
    case 'documentNo':
      return 'DocumentNo';
    case 'countType':
      return 'CountType';
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

export function AssignedInventoryCountListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const authUserId = useAuthStore((state) => state.user?.id);
  const pageKey = 'inventory-count-assigned-list';

  const pagedGrid = usePagedDataGrid<AssignedInventoryCountColumnKey>({
    pageKey,
    defaultSortBy: 'documentNo',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('inventoryCount.assigned.title', { defaultValue: 'Atanmis Sayim Emirleri' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<AssignedInventoryCountColumnKey>[]>(() => [
    { key: 'documentNo', label: t('common.documentNo', { defaultValue: 'Belge No' }) },
    { key: 'countType', label: t('inventoryCount.fields.countType', { defaultValue: 'Sayim tipi' }) },
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-count-assigned-list', authUserId, pagedGrid.queryParams],
    queryFn: () => inventoryCountApi.getAssignedHeadersPaged(authUserId || 0, pagedGrid.queryParams),
    enabled: Boolean(authUserId),
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
      countType: getCountTypeLabel(row.countType),
      countMode: row.countMode || '-',
      status: row.status || '-',
      lineCount: row.lineCount ?? 0,
      differenceLineCount: row.differenceLineCount ?? 0,
    }))
  ), [data?.data]);

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as AssignedInventoryCountColumnKey[],
    [orderedVisibleColumns],
  );

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const renderSortIcon = (columnKey: AssignedInventoryCountColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="crm-page space-y-6">
      <PagedDataGrid<InventoryCountHeader, AssignedInventoryCountColumnKey>
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'documentNo':
              return <span className="font-medium">{row.documentNo || '-'}</span>;
            case 'countType':
              return getCountTypeLabel(row.countType);
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
        errorText={error instanceof Error ? error.message : t('inventoryCount.assigned.error', { defaultValue: 'Atanmis sayim emirleri yuklenemedi.' })}
        emptyText={t('inventoryCount.assigned.noData', { defaultValue: 'Size atanmis aktif sayim emri bulunmuyor.' })}
        showActionsColumn={orderedVisibleColumns.includes('actions')}
        actionsHeaderLabel={t('common.actions', { defaultValue: 'Islemler' })}
        renderActionsCell={(row) => (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" size="sm" onClick={() => navigate('/inventory-count/process?headerId=' + String(row.id))}>
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
          exportFileName: 'inventory-count-assigned-list',
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
            placeholder: t('inventoryCount.assigned.searchPlaceholder', { defaultValue: 'Belge no ya da sayim tipi ara' }),
          },
          leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
        }}
      />
    </div>
  );
}
