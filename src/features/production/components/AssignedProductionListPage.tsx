import { type ReactElement, useEffect, useMemo } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { productionApi } from '../api/production-api';
import type { ProductionHeaderListItem } from '../types/production';

type AssignedProductionColumnKey =
  | 'documentNo'
  | 'documentDate'
  | 'mainStockCode'
  | 'mainYapKod'
  | 'executionMode'
  | 'plannedQuantity'
  | 'status'
  | 'projectCode'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'common.documentNo' },
  { value: 'mainStockCode', type: 'string', labelKey: 'production.create.mainStockCode' },
  { value: 'mainYapKod', type: 'string', labelKey: 'production.create.mainYapKod' },
  { value: 'executionMode', type: 'string', labelKey: 'production.create.executionMode' },
  { value: 'status', type: 'string', labelKey: 'common.status' },
  { value: 'projectCode', type: 'string', labelKey: 'common.projectCode' },
];

function mapSortBy(value: AssignedProductionColumnKey): string {
  switch (value) {
    case 'documentNo':
      return 'DocumentNo';
    case 'documentDate':
      return 'DocumentDate';
    case 'mainStockCode':
      return 'MainStockCode';
    case 'mainYapKod':
      return 'MainYapKod';
    case 'executionMode':
      return 'ExecutionMode';
    case 'plannedQuantity':
      return 'PlannedQuantity';
    case 'status':
      return 'Status';
    case 'projectCode':
      return 'ProjectCode';
    case 'actions':
    default:
      return 'Id';
  }
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function AssignedProductionListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const authUserId = useAuthStore((state) => state.user?.id);
  const pageKey = 'production-assigned-list';

  const pagedGrid = usePagedDataGrid<AssignedProductionColumnKey>({
    pageKey,
    defaultSortBy: 'documentDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('production.assigned.title', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<AssignedProductionColumnKey>[]>(() => [
    { key: 'documentNo', label: t('common.documentNo') },
    { key: 'documentDate', label: t('common.documentDate', { defaultValue: 'Missing translation' }) },
    { key: 'mainStockCode', label: t('production.create.mainStockCode', { defaultValue: 'Missing translation' }) },
    { key: 'mainYapKod', label: t('production.create.mainYapKod', { defaultValue: 'Missing translation' }) },
    { key: 'executionMode', label: t('production.create.executionMode', { defaultValue: 'Missing translation' }) },
    { key: 'plannedQuantity', label: t('production.create.plannedQuantity', { defaultValue: 'Missing translation' }) },
    { key: 'status', label: t('common.status', { defaultValue: 'Missing translation' }) },
    { key: 'projectCode', label: t('common.projectCode', { defaultValue: 'Missing translation' }) },
    { key: 'actions', label: t('common.actions', { defaultValue: 'Missing translation' }), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'documentNo',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['production-assigned-headers-paged', authUserId, pagedGrid.queryParams],
    queryFn: () => productionApi.getAssignedHeaders(authUserId || 0, {
      ...pagedGrid.queryParams,
      filters: [
        ...(pagedGrid.queryParams.filters ?? []),
        { column: 'Status', operator: 'neq', value: 'Completed' },
      ],
    }),
    enabled: Boolean(authUserId),
  });

  const exportColumns = useMemo(
    () => orderedVisibleColumns
      .filter((key) => key !== 'actions')
      .map((key) => ({
        key,
        label: columns.find((column) => column.key === key)?.label ?? key,
      })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    return (data?.data ?? []).map((item) => ({
      documentNo: item.documentNo || '-',
      documentDate: formatDate(item.documentDate),
      mainStockCode: item.mainStockCode || '-',
      mainYapKod: item.mainYapKod || '-',
      executionMode: item.executionMode || '-',
      plannedQuantity: item.plannedQuantity ?? 0,
      status: item.status || '-',
      projectCode: item.projectCode || '-',
    }));
  }, [data?.data]);

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as AssignedProductionColumnKey[],
    [orderedVisibleColumns],
  );

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const renderSortIcon = (columnKey: AssignedProductionColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="crm-page space-y-6">
      <PagedDataGrid<ProductionHeaderListItem, AssignedProductionColumnKey>
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
            case 'mainStockCode':
              return row.mainStockCode || '-';
            case 'mainYapKod':
              return row.mainYapKod || '-';
            case 'executionMode':
              return row.executionMode || '-';
            case 'plannedQuantity':
              return row.plannedQuantity ?? 0;
            case 'status':
              return <Badge variant="secondary">{row.status || 'Draft'}</Badge>;
            case 'projectCode':
              return row.projectCode || '-';
            case 'actions':
            default:
              return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={(columnKey) => {
          if (columnKey === 'actions') return;
          pagedGrid.handleSort(columnKey);
        }}
        renderSortIcon={renderSortIcon}
        isLoading={isLoading}
        isError={Boolean(error)}
        errorText={error instanceof Error ? error.message : t('production.assigned.error', { defaultValue: 'Missing translation' })}
        emptyText={t('production.assigned.noData', { defaultValue: 'Missing translation' })}
        showActionsColumn={orderedVisibleColumns.includes('actions')}
        actionsHeaderLabel={t('common.actions', { defaultValue: 'Missing translation' })}
        renderActionsCell={(row) => (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/production/detail/${row.id}`)}>
              {t('production.list.openDetail', { defaultValue: 'Missing translation' })}
            </Button>
            <Button type="button" size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600" onClick={() => navigate(`/production/process/${row.id}`)}>
              {t('common.start', { defaultValue: 'Missing translation' })}
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
        previousLabel={t('common.previous')}
        nextLabel={t('common.next')}
        paginationInfoText={paginationInfoText}
        actionBar={{
          pageKey,
          userId,
          columns: columns.map(({ key, label }) => ({ key, label })),
          visibleColumns,
          columnOrder,
          onVisibleColumnsChange: setVisibleColumns,
          onColumnOrderChange: setColumnOrder,
          exportFileName: 'production-assigned-list',
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
            placeholder: t('production.assigned.searchPlaceholder', { defaultValue: 'Missing translation' }),
          },
          leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
        }}
      />
    </div>
  );
}
