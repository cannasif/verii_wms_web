import { type ReactElement, useEffect, useMemo } from 'react';
import { ArrowDown, ArrowUp, Check, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import type { ProductionHeaderListItem } from '../types/production';
import { useAwaitingApprovalProductionHeaders } from '../hooks/useAwaitingApprovalProductionHeaders';
import { useApproveProductionHeader } from '../hooks/useApproveProductionHeader';

type ColumnKey = 'id' | 'documentNo' | 'documentDate' | 'mainStockCode' | 'mainYapKod' | 'plannedQuantity' | 'completedQuantity' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'production.approval.id' },
  { value: 'documentNo', type: 'string', labelKey: 'production.approval.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'production.approval.documentDate' },
  { value: 'mainStockCode', type: 'string', labelKey: 'production.approval.mainStockCode' },
  { value: 'mainYapKod', type: 'string', labelKey: 'production.approval.mainYapKod' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  id: 8,
  documentNo: 14,
  documentDate: 12,
  mainStockCode: 12,
  mainYapKod: 10,
  plannedQuantity: 10,
  completedQuantity: 10,
};

function mapSortBy(): string {
  return 'Id';
}

function formatDate(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
}

export function ProductionApprovalPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.production');
  const approveMutation = useApproveProductionHeader();
  const pageKey = 'production-approval-list';
  const showActionsColumn = permission.canView || permission.canApprove;

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'id',
    defaultSortDirection: 'desc',
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    {
      key: 'id',
      label: t('production.approval.id'),
      sortable: false,
      headClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
    },
    { key: 'documentNo', label: t('production.approval.documentNo'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentDate', label: t('production.approval.documentDate'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'mainStockCode', label: t('production.approval.mainStockCode'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'mainYapKod', label: t('production.approval.mainYapKod'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'plannedQuantity', label: t('production.approval.plannedQuantity'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'completedQuantity', label: t('production.approval.completedQuantity'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('production.approval.actions'), sortable: false },
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
    idColumnKey: 'id',
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    includeActionsColumn: showActionsColumn,
  });

  const { data, isLoading, error } = useAwaitingApprovalProductionHeaders(pagedGrid.queryParams);

  useEffect(() => {
    setPageTitle(t('production.approval.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const getCellText = (row: ProductionHeaderListItem, key: ColumnKey): string | undefined => {
    switch (key) {
      case 'id': return String(row.id);
      case 'documentNo': return row.documentNo || '-';
      case 'documentDate': return formatDate(row.documentDate);
      case 'mainStockCode': return row.mainStockCode || '-';
      case 'mainYapKod': return row.mainYapKod || '-';
      case 'plannedQuantity': return String(row.plannedQuantity ?? 0);
      case 'completedQuantity': return String(row.completedQuantity ?? 0);
      default: return undefined;
    }
  };

  const exportColumns = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({
      key,
      label: columns.find((column) => column.key === key)?.label ?? key,
    })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({
    id: item.id,
    documentNo: item.documentNo || '-',
    documentDate: formatDate(item.documentDate),
    mainStockCode: item.mainStockCode || '-',
    mainYapKod: item.mainYapKod || '-',
    plannedQuantity: item.plannedQuantity ?? 0,
    completedQuantity: item.completedQuantity ?? 0,
  })), [data?.data]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    if (!permission.canApprove) {
      return;
    }

    try {
      await approveMutation.mutateAsync({ id, approved });
      toast.success(approved ? t('production.approval.approveSuccess') : t('production.approval.rejectSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : approved ? t('production.approval.approveError') : t('production.approval.rejectError'));
    }
  };

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <OpsListPageShell
      eyebrow={
        <>
          <span>{t('production.breadcrumb.parent')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('production.breadcrumb.module')}</span>
        </>
      }
      title={t('production.approval.title')}
      description={t('production.approval.subtitle', { defaultValue: t('production.list.subtitle') })}
    >
      <PagedDataGrid<ProductionHeaderListItem, ColumnKey>
        variant="ops"
        columns={columns}
        visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
        defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
        columnWidths={columnWidths}
        onResizeColumnPair={resizeColumnPair}
        getCellText={getCellText}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, key) => ({
          id: <span className="wms-ops-table-id-value">{row.id}</span>,
          documentNo: <span className="font-medium font-mono text-xs">{row.documentNo || '-'}</span>,
          documentDate: <span className="font-mono text-xs">{formatDate(row.documentDate)}</span>,
          mainStockCode: row.mainStockCode || '-',
          mainYapKod: row.mainYapKod || '-',
          plannedQuantity: row.plannedQuantity ?? 0,
          completedQuantity: row.completedQuantity ?? 0,
        } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={(key) => { if (key !== 'actions') pagedGrid.handleSort(key); }}
        renderSortIcon={renderSortIcon}
        isLoading={isLoading}
        isError={Boolean(error)}
        errorText={t('production.approval.error')}
        emptyText={t('production.approval.noData')}
        showActionsColumn={showActionsColumn}
        actionsHeaderLabel={t('production.approval.actions')}
        iconOnlyActions={false}
        actionsCellClassName="wms-ops-table-actions-col"
        renderActionsCell={(row) => (
          <div className="wms-ops-row-actions">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn"
              aria-label={t('production.approval.viewDetails')}
              title={t('production.approval.viewDetails')}
              disabled={!permission.canView}
              onClick={() => navigate(`/production/detail/${row.id}`)}
            >
              <Eye className="size-3" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--approve"
              aria-label={t('production.approval.approve')}
              title={t('production.approval.approve')}
              disabled={!permission.canApprove || approveMutation.isPending}
              onClick={() => handleApproval(row.id, true)}
            >
              <Check className="size-3" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
              aria-label={t('production.approval.reject')}
              title={t('production.approval.reject')}
              disabled={!permission.canApprove || approveMutation.isPending}
              onClick={() => handleApproval(row.id, false)}
            >
              <X className="size-3" aria-hidden />
            </Button>
          </div>
        )}
        pageSize={pagedGrid.pageSize}
        pageSizeOptions={pagedGrid.pageSizeOptions}
        onPageSizeChange={pagedGrid.handlePageSizeChange}
        pageNumber={pagedGrid.getDisplayPageNumber(data)}
        totalPages={data?.totalPages ?? 1}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        hasNextPage={data?.hasNextPage ?? false}
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
          filterColumns,
          defaultFilterColumn: 'documentNo',
          draftFilterRows: pagedGrid.draftFilterRows,
          onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
          filterLogic: pagedGrid.filterLogic,
          onFilterLogicChange: pagedGrid.setFilterLogic,
          onApplyFilters: pagedGrid.applyAdvancedFilters,
          onClearFilters: pagedGrid.clearAdvancedFilters,
          translationNamespace: 'common',
          appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
          search: { ...pagedGrid.searchConfig, placeholder: t('production.approval.searchPlaceholder') },
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
  );
}
