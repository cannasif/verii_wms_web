import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Pencil, PlayCircle, Send, Trash2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { FieldHelpTooltip } from '@/features/access-control/components/FieldHelpTooltip';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { productionApi } from '../api/production-api';
import type { ProductionHeaderListItem } from '../types/production';

type ProductionColumnKey =
  | 'documentNo'
  | 'documentDate'
  | 'mainStockCode'
  | 'mainYapKod'
  | 'executionMode'
  | 'plannedQuantity'
  | 'completedQuantity'
  | 'status'
  | 'projectCode'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'common.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'common.documentDate' },
  { value: 'mainStockCode', type: 'string', labelKey: 'production.create.mainStockCode' },
  { value: 'mainYapKod', type: 'string', labelKey: 'production.create.mainYapKod' },
  { value: 'executionMode', type: 'string', labelKey: 'production.create.executionMode' },
  { value: 'plannedQuantity', type: 'number', labelKey: 'production.create.plannedQuantity' },
  { value: 'completedQuantity', type: 'number', labelKey: 'production.list.completedQuantity' },
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
  completedQuantity: 10,
  status: 10,
  projectCode: 10,
};

function mapSortBy(value: ProductionColumnKey): string {
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
    case 'completedQuantity':
      return 'CompletedQuantity';
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

function getProcessLabel(status?: string | null): string {
  switch (status) {
    case 'Completed':
      return 'Detayi Gor';
    case 'Paused':
      return 'Devam Ettir';
    case 'InProgress':
      return 'Surece Don';
    default:
      return 'Sureci Baslat';
  }
}

export function ProductionListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const productionPermission = useCrudPermission('wms.production');
  const productionTransferPermission = useCrudPermission('wms.production-transfer');
  const canUpdateProduction = productionPermission.canUpdate;
  const canDeleteProduction = productionPermission.canDelete;
  const canCreateTransfer = productionTransferPermission.canCreate;
  const pageKey = 'production-list';
  const showActionsColumn = productionPermission.canView || canUpdateProduction || canDeleteProduction || canCreateTransfer;
  const [itemToDelete, setItemToDelete] = useState<ProductionHeaderListItem | null>(null);

  const pagedGrid = usePagedDataGrid<ProductionColumnKey>({
    pageKey,
    defaultSortBy: 'documentDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('production.list.title', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ProductionColumnKey>[]>(() => [
    { key: 'documentNo', label: t('common.documentNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentDate', label: t('common.documentDate', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'mainStockCode', label: t('production.create.mainStockCode', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'mainYapKod', label: t('production.create.mainYapKod', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'executionMode', label: t('production.create.executionMode', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'plannedQuantity', label: t('production.create.plannedQuantity', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'completedQuantity', label: t('production.list.completedQuantity', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
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
    actionsColumnWeight: 16,
    includeActionsColumn: showActionsColumn,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['production-headers-paged', pagedGrid.queryParams],
    queryFn: () => productionApi.getHeadersPaged(pagedGrid.queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productionApi.softDeleteProductionPlan(id),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('production.list.deleteError'));
      }
      toast.success(t('production.list.deleteSuccess'));
      setItemToDelete(null);
      await refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('production.list.deleteError'));
    },
  });

  const getCellText = (row: ProductionHeaderListItem, key: ProductionColumnKey): string | undefined => {
    switch (key) {
      case 'documentNo': return row.documentNo || '-';
      case 'documentDate': return formatDate(row.documentDate);
      case 'mainStockCode': return row.mainStockCode || '-';
      case 'mainYapKod': return row.mainYapKod || '-';
      case 'executionMode': return row.executionMode || '-';
      case 'plannedQuantity': return String(row.plannedQuantity ?? 0);
      case 'completedQuantity': return String(row.completedQuantity ?? 0);
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
      completedQuantity: item.completedQuantity ?? 0,
      status: item.status || '-',
      projectCode: item.projectCode || '-',
    }));
  }, [data?.data]);

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as ProductionColumnKey[],
    [orderedVisibleColumns],
  );

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const renderSortIcon = (columnKey: ProductionColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <>
      <OpsListPageShell
        className="wms-ops-production-list"
        eyebrow={
          <>
            <span>{t('production.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('production.breadcrumb.module')}</span>
          </>
        }
        title={t('production.list.title', { defaultValue: 'Missing translation' })}
        description={t('production.list.subtitle')}
      >
        {!productionPermission.canMutate ? <PermissionNotice message={t('common.accessDeniedMessage')} /> : null}

        <PagedDataGrid<ProductionHeaderListItem, ProductionColumnKey>
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
            completedQuantity: row.completedQuantity ?? 0,
            status: <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{row.status || 'Draft'}</Badge>,
            projectCode: row.projectCode || '-',
          } as Record<Exclude<ProductionColumnKey, 'actions'>, React.ReactNode>)[columnKey as Exclude<ProductionColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'actions') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={error instanceof Error ? error.message : t('production.list.error', { defaultValue: 'Missing translation' })}
          emptyText={t('production.list.noData', { defaultValue: 'Missing translation' })}
          showActionsColumn={showActionsColumn}
          actionsHeaderLabel={t('common.actions', { defaultValue: 'Missing translation' })}
          iconOnlyActions={false}
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(row) => (
            <div className="wms-ops-row-actions">
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn"
                  aria-label={t('production.list.editPlan', { defaultValue: 'Missing translation' })}
                  title={t('production.list.editPlan', { defaultValue: 'Missing translation' })}
                  onClick={() => navigate(`/production/create?editId=${row.id}`)}
                  disabled={!canUpdateProduction || row.status !== 'Draft'}
                >
                  <Pencil className="size-3" aria-hidden />
                </Button>
                {!canUpdateProduction || row.status !== 'Draft' ? (
                  <FieldHelpTooltip
                    text={!canUpdateProduction
                      ? t('production.list.editDisabledPermission')
                      : t('production.list.editDisabledHelp', {
                        defaultValue: 'Missing translation',
                      })}
                  />
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                aria-label={t('production.list.openDetail', { defaultValue: 'Missing translation' })}
                title={t('production.list.openDetail', { defaultValue: 'Missing translation' })}
                onClick={() => navigate(`/production/detail/${row.id}`)}
              >
                <Eye className="size-3" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                aria-label={t('production.list.openProcess', { defaultValue: getProcessLabel(row.status) })}
                title={t('production.list.openProcess', { defaultValue: getProcessLabel(row.status) })}
                onClick={() => navigate(`/production/process/${row.id}`)}
                disabled={!canUpdateProduction}
              >
                <PlayCircle className="size-3" aria-hidden />
              </Button>
              {row.documentNo && canCreateTransfer ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn"
                  aria-label={t('production.list.openTransfer', { defaultValue: 'Missing translation' })}
                  title={t('production.list.openTransfer', { defaultValue: 'Missing translation' })}
                  onClick={() => navigate(`/production-transfer/create?productionDocumentNo=${encodeURIComponent(row.documentNo)}`)}
                >
                  <Send className="size-3" aria-hidden />
                </Button>
              ) : null}
              {canDeleteProduction && row.canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
                  aria-label={t('common.delete')}
                  title={t('common.delete')}
                  onClick={() => setItemToDelete(row)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="size-3" aria-hidden />
                </Button>
              ) : null}
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
              placeholder: t('production.list.searchPlaceholder', { defaultValue: 'Missing translation' }),
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
        open={Boolean(itemToDelete)}
        itemLabel={itemToDelete?.documentNo || `#${itemToDelete?.id ?? ''}`}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null);
        }}
        onConfirm={() => {
          if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
        }}
      />
    </>
  );
}
