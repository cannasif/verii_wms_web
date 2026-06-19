import { type ReactElement, type ReactNode, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, PackageCheck, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import type { GrPreReceiptLabelBatch } from '../types/goods-receipt';
import { getPreLabelStatusBadgeClass } from '../utils/pre-label-status-badge';

type ColumnKey = 'batchNo' | 'siparisNo' | 'customer' | 'status' | 'progress' | 'createdDate' | 'actions';

const actionableStatuses = new Set(['Generated', 'Printed', 'PartiallyPrinted', 'PartiallyConsumed']);

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'batchNo', type: 'string', labelKey: 'goodsReceipt.preLabelReceiving.batchNo' },
  { value: 'siparisNo', type: 'string', labelKey: 'goodsReceipt.preLabelReceiving.orderNo' },
  { value: 'customer', type: 'string', labelKey: 'goodsReceipt.preLabelReceiving.customer' },
  { value: 'status', type: 'string', labelKey: 'goodsReceipt.preLabelReceiving.status' },
  { value: 'createdDate', type: 'date', labelKey: 'goodsReceipt.preLabelReceiving.createdDate' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  batchNo: 14,
  siparisNo: 14,
  customer: 20,
  status: 12,
  progress: 12,
  createdDate: 16,
};

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'batchNo': return 'batchNo';
    case 'siparisNo': return 'siparisNo';
    case 'customer': return 'customerCodeSnapshot';
    case 'status': return 'status';
    case 'createdDate':
    default: return 'createdDate';
  }
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function GoodsReceiptPreLabelReceivingPage(): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const pageKey = 'goods-receipt-pre-label-receiving';
  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    defaultPageNumber: 1,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('preLabelReceiving.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const batchesQuery = useQuery({
    queryKey: ['goods-receipt-pre-label-receiving', pagedGrid.queryParams],
    queryFn: ({ signal }) => goodsReceiptApi.getPreReceiptLabelBatchesPaged(pagedGrid.queryParams, { signal }),
  });

  const startGoodsReceiptMutation = useMutation({
    mutationFn: (batch: GrPreReceiptLabelBatch) => goodsReceiptApi.startGoodsReceiptFromPreReceiptBatch(batch.id),
    onSuccess: async (headerId) => {
      toast.success(t('preLabelReceiving.started'));
      await queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-label-receiving'] });
      await queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-label-batches'] });
      navigate(`/goods-receipt/collection/${headerId}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const page = batchesQuery.data;
  const actionableBatches = useMemo(
    () => (page?.data ?? []).filter((batch) => actionableStatuses.has(batch.status)),
    [page?.data],
  );

  const summary = useMemo(() => actionableBatches.reduce(
    (acc, batch) => {
      acc.total += 1;
      acc.labels += batch.totalLabelCount;
      acc.remaining += Math.max(0, batch.totalLabelCount - batch.consumedLabelCount - batch.voidLabelCount);
      return acc;
    },
    { total: 0, labels: 0, remaining: 0 },
  ), [actionableBatches]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'batchNo', label: t('preLabelReceiving.batchNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'siparisNo', label: t('preLabelReceiving.orderNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customer', label: t('preLabelReceiving.customer'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'status', label: t('preLabelReceiving.status'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'progress', label: t('preLabelReceiving.progress'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'createdDate', label: t('preLabelReceiving.createdDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('preLabelReceiving.actions'), sortable: false },
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
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    includeActionsColumn: true,
  });

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const range = getPagedRange(page, 1);
  const exportColumns = useMemo(
    () => columns.filter((column) => column.key !== 'actions').map((column) => ({ key: column.key, label: column.label })),
    [columns],
  );
  const exportRows = useMemo<Record<string, unknown>[]>(() => actionableBatches.map((batch) => ({
    batchNo: batch.batchNo,
    siparisNo: batch.siparisNo,
    customer: [batch.customerCodeSnapshot, batch.customerNameSnapshot].filter(Boolean).join(' - ') || '-',
    status: t(`preLabels.statuses.${batch.status}`, batch.status),
    progress: `${batch.consumedLabelCount}/${batch.totalLabelCount}`,
    createdDate: formatDate(batch.createdDate),
  })), [actionableBatches, t]);

  const getCellText = (batch: GrPreReceiptLabelBatch, key: ColumnKey): string | undefined => {
    switch (key) {
      case 'batchNo': return batch.batchNo;
      case 'siparisNo': return batch.siparisNo;
      case 'customer': return [batch.customerCodeSnapshot, batch.customerNameSnapshot].filter(Boolean).join(' - ') || '-';
      case 'status': return t(`preLabels.statuses.${batch.status}`, batch.status);
      case 'progress': return `${batch.consumedLabelCount}/${batch.totalLabelCount}`;
      case 'createdDate': return formatDate(batch.createdDate);
      default: return undefined;
    }
  };

  return (
    <OpsListPageShell
      eyebrow={
        <>
          <span>{t('goodsReceipt.create.breadcrumb.parent')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('goodsReceipt.create.breadcrumb.module')}</span>
        </>
      }
      title={t('preLabelReceiving.title')}
      description={t('preLabelReceiving.subtitle')}
      actions={(
        <div className="wms-ops-stat-grid">
          <div className="wms-ops-stat-card">
            <div className="wms-ops-stat-card__value">{summary.total}</div>
            <div className="wms-ops-stat-card__label">{t('preLabelReceiving.openBatchCount')}</div>
          </div>
          <div className="wms-ops-stat-card">
            <div className="wms-ops-stat-card__value">{summary.labels}</div>
            <div className="wms-ops-stat-card__label">{t('preLabelReceiving.totalLabels')}</div>
          </div>
          <div className="wms-ops-stat-card">
            <div className="wms-ops-stat-card__value">{summary.remaining}</div>
            <div className="wms-ops-stat-card__label">{t('preLabelReceiving.remainingLabels')}</div>
          </div>
        </div>
      )}
    >
      <PagedDataGrid<GrPreReceiptLabelBatch, ColumnKey>
        variant="ops"
        pageKey={pageKey}
        columns={columns}
        visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
        defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
        columnWidths={columnWidths}
        onResizeColumnPair={resizeColumnPair}
        getCellText={getCellText}
        rows={actionableBatches}
        rowKey={(batch) => batch.id}
        renderCell={(batch, key) => ({
          batchNo: <span className="font-semibold font-mono text-xs">{batch.batchNo}</span>,
          siparisNo: <span className="font-mono text-xs">{batch.siparisNo}</span>,
          customer: [batch.customerCodeSnapshot, batch.customerNameSnapshot].filter(Boolean).join(' - ') || '-',
          status: (
            <Badge variant="outline" className={getPreLabelStatusBadgeClass(batch.status)}>
              {t(`preLabels.statuses.${batch.status}`, batch.status)}
            </Badge>
          ),
          progress: <span className="font-mono text-xs">{batch.consumedLabelCount}/{batch.totalLabelCount} {t('preLabelReceiving.consumedShort')}</span>,
          createdDate: <span className="font-mono text-xs">{formatDate(batch.createdDate)}</span>,
        } as Record<Exclude<ColumnKey, 'actions'>, ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={(key) => {
          if (key !== 'progress' && key !== 'actions') pagedGrid.handleSort(key);
        }}
        renderSortIcon={renderSortIcon}
        isLoading={batchesQuery.isLoading}
        isError={Boolean(batchesQuery.error)}
        errorText={t('preLabelReceiving.loadError')}
        emptyText={t('preLabelReceiving.empty')}
        showActionsColumn
        actionsHeaderLabel={t('preLabelReceiving.actions')}
        iconOnlyActions={false}
        actionsCellClassName="wms-ops-table-actions-col"
        renderActionsCell={(batch) => (
          <div className="wms-ops-row-actions">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--start"
              aria-label={t('preLabelReceiving.startScan')}
              title={t('preLabelReceiving.startScan')}
              onClick={() => startGoodsReceiptMutation.mutate(batch)}
              disabled={startGoodsReceiptMutation.isPending}
            >
              <PackageCheck className="size-3" aria-hidden />
            </Button>
          </div>
        )}
        pageSize={pagedGrid.pageSize}
        pageSizeOptions={pagedGrid.pageSizeOptions}
        onPageSizeChange={pagedGrid.handlePageSizeChange}
        pageNumber={pagedGrid.getDisplayPageNumber(page)}
        totalPages={page?.totalPages ?? 1}
        hasPreviousPage={page?.hasPreviousPage ?? false}
        hasNextPage={page?.hasNextPage ?? false}
        onPreviousPage={pagedGrid.goToPreviousPage}
        onNextPage={pagedGrid.goToNextPage}
        previousLabel={t('common.previous')}
        nextLabel={t('common.next')}
        paginationInfoText={t('preLabelReceiving.paginationInfo', {
          current: range.from,
          total: range.to,
          totalCount: range.total,
        })}
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
          defaultFilterColumn: 'batchNo',
          draftFilterRows: pagedGrid.draftFilterRows,
          onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
          filterLogic: pagedGrid.filterLogic,
          onFilterLogicChange: pagedGrid.setFilterLogic,
          onApplyFilters: pagedGrid.applyAdvancedFilters,
          onClearFilters: pagedGrid.clearAdvancedFilters,
          translationNamespace: 'common',
          appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
          search: { ...pagedGrid.searchConfig, placeholder: t('preLabelReceiving.searchPlaceholder') },
          leftSlot: (
            <VoiceSearchButton
              onResult={pagedGrid.handleVoiceSearch}
              size="icon"
              variant="ghost"
              className="wms-ops-voice-btn"
            />
          ),
          refresh: {
            onRefresh: () => void batchesQuery.refetch(),
            isLoading: batchesQuery.isFetching,
            label: t('common.refresh'),
            disabled: batchesQuery.isFetching,
          },
          variant: 'ops',
        }}
      />

      <div className="wms-ops-hint-banner">
        <RefreshCw className="size-3.5 shrink-0" aria-hidden />
        <span>{t('preLabelReceiving.helpText')}</span>
      </div>
    </OpsListPageShell>
  );
}
