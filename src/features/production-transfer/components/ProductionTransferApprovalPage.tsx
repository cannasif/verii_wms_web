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
import type { ProductionTransferListItem } from '../types/production-transfer';
import { useAwaitingApprovalProductionTransferHeaders } from '../hooks/useAwaitingApprovalProductionTransferHeaders';
import { useApproveProductionTransfer } from '../hooks/useApproveProductionTransfer';

type ColumnKey = 'id' | 'documentNo' | 'documentDate' | 'transferPurpose' | 'sourceWarehouse' | 'targetWarehouse' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'productionTransfer.approval.id' },
  { value: 'documentNo', type: 'string', labelKey: 'productionTransfer.approval.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'productionTransfer.approval.documentDate' },
  { value: 'transferPurpose', type: 'string', labelKey: 'productionTransfer.approval.transferPurpose' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'productionTransfer.approval.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'productionTransfer.approval.targetWarehouse' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  id: 8,
  documentNo: 14,
  documentDate: 12,
  transferPurpose: 14,
  sourceWarehouse: 12,
  targetWarehouse: 12,
};

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'id': return 'Id';
    case 'documentNo': return 'DocumentNo';
    case 'documentDate': return 'DocumentDate';
    case 'transferPurpose': return 'TransferPurpose';
    case 'sourceWarehouse': return 'SourceWarehouse';
    case 'targetWarehouse': return 'TargetWarehouse';
    default: return 'Id';
  }
}

function formatDate(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
}

export function ProductionTransferApprovalPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.production-transfer');
  const pageKey = 'production-transfer-approval-list';
  const showActionsColumn = permission.canView || permission.canApprove;
  const approveMutation = useApproveProductionTransfer();

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'id',
    defaultSortDirection: 'desc',
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    {
      key: 'id',
      label: t('productionTransfer.approval.id'),
      headClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
    },
    { key: 'documentNo', label: t('productionTransfer.approval.documentNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentDate', label: t('productionTransfer.approval.documentDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'transferPurpose', label: t('productionTransfer.approval.transferPurpose'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'sourceWarehouse', label: t('productionTransfer.approval.sourceWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'targetWarehouse', label: t('productionTransfer.approval.targetWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('productionTransfer.approval.actions'), sortable: false },
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

  const { data, isLoading, error } = useAwaitingApprovalProductionTransferHeaders(pagedGrid.queryParams);

  useEffect(() => {
    setPageTitle(t('productionTransfer.approval.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const getCellText = (row: ProductionTransferListItem, key: ColumnKey): string | undefined => {
    switch (key) {
      case 'id': return String(row.id);
      case 'documentNo': return row.documentNo || '-';
      case 'documentDate': return formatDate(row.documentDate);
      case 'transferPurpose': return row.transferPurpose || '-';
      case 'sourceWarehouse': return row.sourceWarehouse || '-';
      case 'targetWarehouse': return row.targetWarehouse || '-';
      default: return undefined;
    }
  };

  const exportColumns = useMemo(
    () => orderedVisibleColumns
      .filter((key) => key !== 'actions')
      .map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({
    id: item.id,
    documentNo: item.documentNo || '-',
    documentDate: formatDate(item.documentDate),
    transferPurpose: item.transferPurpose || '-',
    sourceWarehouse: item.sourceWarehouse || '-',
    targetWarehouse: item.targetWarehouse || '-',
  })), [data?.data]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    if (!permission.canApprove) return;

    try {
      await approveMutation.mutateAsync({ id, approved });
      toast.success(approved ? t('productionTransfer.approval.approveSuccess') : t('productionTransfer.approval.rejectSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : approved ? t('productionTransfer.approval.approveError') : t('productionTransfer.approval.rejectError'));
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
          <span>{t('productionTransfer.breadcrumb.parent')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('productionTransfer.breadcrumb.module')}</span>
        </>
      }
      title={t('productionTransfer.approval.title')}
      description={t('productionTransfer.approval.subtitle', { defaultValue: t('productionTransfer.list.subtitle') })}
    >
      <PagedDataGrid<ProductionTransferListItem, ColumnKey>
        variant="ops"
        columns={columns}
        visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
        defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
        columnWidths={columnWidths}
        onResizeColumnPair={resizeColumnPair}
        getCellText={getCellText}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(item, columnKey) => ({
          id: <span className="wms-ops-table-id-value">{item.id}</span>,
          documentNo: <span className="font-medium font-mono text-xs">{item.documentNo || '-'}</span>,
          documentDate: <span className="font-mono text-xs">{formatDate(item.documentDate)}</span>,
          transferPurpose: item.transferPurpose || '-',
          sourceWarehouse: item.sourceWarehouse || '-',
          targetWarehouse: item.targetWarehouse || '-',
        } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[columnKey as Exclude<ColumnKey, 'actions'>] ?? null}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={(columnKey) => {
          if (columnKey !== 'actions') pagedGrid.handleSort(columnKey);
        }}
        renderSortIcon={renderSortIcon}
        isLoading={isLoading}
        isError={Boolean(error)}
        errorText={t('productionTransfer.approval.error')}
        emptyText={t('productionTransfer.approval.noData')}
        showActionsColumn={showActionsColumn}
        actionsHeaderLabel={t('productionTransfer.approval.actions')}
        iconOnlyActions={false}
        actionsCellClassName="wms-ops-table-actions-col"
        renderActionsCell={(row) => (
          <div className="wms-ops-row-actions">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn"
              aria-label={t('productionTransfer.approval.viewDetails')}
              title={t('productionTransfer.approval.viewDetails')}
              disabled={!permission.canView}
              onClick={() => navigate(`/production-transfer/detail/${row.id}`)}
            >
              <Eye className="size-3" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--approve"
              aria-label={t('productionTransfer.approval.approve')}
              title={t('productionTransfer.approval.approve')}
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
              aria-label={t('productionTransfer.approval.reject')}
              title={t('productionTransfer.approval.reject')}
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
          search: {
            ...pagedGrid.searchConfig,
            placeholder: t('productionTransfer.approval.searchPlaceholder'),
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
  );
}
