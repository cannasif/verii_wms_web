import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, PlayCircle, Trash2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
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

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  documentNo: 14,
  documentDate: 12,
  mainStockCode: 12,
  mainYapKod: 10,
  executionMode: 10,
  plannedQuantity: 10,
  status: 10,
  projectCode: 10,
};

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
  const permission = useCrudPermission('wms.production');
  const pageKey = 'production-assigned-list';
  const showActionsColumn = permission.canView || permission.canUpdate || permission.canDelete;
  const [itemToDelete, setItemToDelete] = useState<ProductionHeaderListItem | null>(null);

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
    { key: 'documentNo', label: t('common.documentNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentDate', label: t('common.documentDate', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'mainStockCode', label: t('production.create.mainStockCode', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'mainYapKod', label: t('production.create.mainYapKod', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'executionMode', label: t('production.create.executionMode', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'plannedQuantity', label: t('production.create.plannedQuantity', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'status', label: t('common.status', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'projectCode', label: t('common.projectCode', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('common.actions', { defaultValue: 'Missing translation' }), sortable: false },
  ], [t]);

  const {
    userId,
    columnOrder,
    visibleColumns,
    orderedVisibleColumns,
    columnWidths,
    setColumnOrder,
    setVisibleColumns,
    resizeColumnPair,
  } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'documentNo',
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    includeActionsColumn: showActionsColumn,
  });

  const { data, isLoading, error, refetch } = useQuery({
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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productionApi.softDeleteProductionPlan(id),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('production.list.deleteError', { defaultValue: 'Üretim planı silinemedi.' }));
      }
      toast.success(t('production.list.deleteSuccess', { defaultValue: 'Üretim planı silindi.' }));
      setItemToDelete(null);
      await refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('production.list.deleteError', { defaultValue: 'Üretim planı silinemedi.' }));
    },
  });

  const getCellText = (row: ProductionHeaderListItem, key: AssignedProductionColumnKey): string | undefined => {
    switch (key) {
      case 'documentNo': return row.documentNo || '-';
      case 'documentDate': return formatDate(row.documentDate);
      case 'mainStockCode': return row.mainStockCode || '-';
      case 'mainYapKod': return row.mainYapKod || '-';
      case 'executionMode': return row.executionMode || '-';
      case 'plannedQuantity': return String(row.plannedQuantity ?? 0);
      case 'status': return row.status || 'Draft';
      case 'projectCode': return row.projectCode || '-';
      default: return undefined;
    }
  };

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
    <>
      <OpsListPageShell
        eyebrow={
          <>
            <span>{t('production.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('production.breadcrumb.module')}</span>
          </>
        }
        title={t('production.assigned.title', { defaultValue: 'Missing translation' })}
        description={t('production.assigned.subtitle')}
      >
        {!permission.canMutate ? <PermissionNotice message={t('common.accessDeniedMessage')} /> : null}

        <PagedDataGrid<ProductionHeaderListItem, AssignedProductionColumnKey>
          variant="ops"
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
          columnWidths={columnWidths}
          onResizeColumnPair={resizeColumnPair}
          getCellText={getCellText}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, columnKey) => ({
            documentNo: <span className="font-medium font-mono text-xs">{row.documentNo || '-'}</span>,
            documentDate: <span className="font-mono text-xs">{formatDate(row.documentDate)}</span>,
            mainStockCode: row.mainStockCode || '-',
            mainYapKod: row.mainYapKod || '-',
            executionMode: row.executionMode || '-',
            plannedQuantity: row.plannedQuantity ?? 0,
            status: <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{row.status || 'Draft'}</Badge>,
            projectCode: row.projectCode || '-',
          } as Record<Exclude<AssignedProductionColumnKey, 'actions'>, React.ReactNode>)[columnKey as Exclude<AssignedProductionColumnKey, 'actions'>] ?? null}
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
          showActionsColumn={showActionsColumn}
          actionsHeaderLabel={t('common.actions', { defaultValue: 'Missing translation' })}
          iconOnlyActions={false}
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(row) => (
            <div className="wms-ops-row-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                aria-label={t('production.list.openDetail', { defaultValue: 'Missing translation' })}
                title={t('production.list.openDetail', { defaultValue: 'Missing translation' })}
                onClick={() => navigate(`/production/detail/${row.id}`)}
                disabled={!permission.canView}
              >
                <Eye className="size-3" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--approve"
                aria-label={t('common.start', { defaultValue: 'Missing translation' })}
                title={t('common.start', { defaultValue: 'Missing translation' })}
                onClick={() => navigate(`/production/process/${row.id}`)}
                disabled={!permission.canUpdate}
              >
                <PlayCircle className="size-3" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
                aria-label={t('common.delete')}
                title={t('common.delete')}
                onClick={() => setItemToDelete(row)}
                disabled={!permission.canDelete || deleteMutation.isPending}
              >
                <Trash2 className="size-3" aria-hidden />
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
            exportFileName: pageKey,
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
            translationNamespace: 'common',
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: {
              ...pagedGrid.searchConfig,
              placeholder: t('production.assigned.searchPlaceholder', { defaultValue: 'Missing translation' }),
            },
            leftSlot: (
              <VoiceSearchButton
                onResult={pagedGrid.handleVoiceSearch}
                size="icon"
                variant="ghost"
                className="wms-ops-voice-btn"
              />
            ),
            variant: 'ops',
          }}
        />
      </OpsListPageShell>

      <DeleteConfirmDialog
        open={itemToDelete != null}
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null);
        }}
        itemLabel={itemToDelete?.documentNo || (itemToDelete ? `#${itemToDelete.id}` : undefined)}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
        }}
      />
    </>
  );
}
