import { type ReactElement, type ReactNode, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Barcode, PackageCheck, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import type { GrPreReceiptLabelBatch } from '../types/goods-receipt';

type ColumnKey = 'batchNo' | 'siparisNo' | 'customer' | 'status' | 'progress' | 'createdDate' | 'actions';

const actionableStatuses = new Set(['Generated', 'Printed', 'PartiallyPrinted', 'PartiallyConsumed']);

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'batchNo', type: 'string', labelKey: 'goodsReceipt.preLabelReceiving.batchNo' },
  { value: 'siparisNo', type: 'string', labelKey: 'goodsReceipt.preLabelReceiving.orderNo' },
  { value: 'customer', type: 'string', labelKey: 'goodsReceipt.preLabelReceiving.customer' },
  { value: 'status', type: 'string', labelKey: 'goodsReceipt.preLabelReceiving.status' },
  { value: 'createdDate', type: 'date', labelKey: 'goodsReceipt.preLabelReceiving.createdDate' },
];

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

function statusClassName(status: string): string {
  switch (status) {
    case 'Generated':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200';
    case 'Printed':
    case 'PartiallyPrinted':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200';
    case 'PartiallyConsumed':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200';
  }
}

export function GoodsReceiptPreLabelReceivingPage(): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey: 'goods-receipt-pre-label-receiving',
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
  const summary = useMemo(() => {
    return actionableBatches.reduce(
      (acc, batch) => {
        acc.total += 1;
        acc.labels += batch.totalLabelCount;
        acc.remaining += Math.max(0, batch.totalLabelCount - batch.consumedLabelCount - batch.voidLabelCount);
        return acc;
      },
      { total: 0, labels: 0, remaining: 0 },
    );
  }, [actionableBatches]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'batchNo', label: t('preLabelReceiving.batchNo') },
    { key: 'siparisNo', label: t('preLabelReceiving.orderNo') },
    { key: 'customer', label: t('preLabelReceiving.customer') },
    { key: 'status', label: t('preLabelReceiving.status') },
    { key: 'progress', label: t('preLabelReceiving.progress'), sortable: false },
    { key: 'createdDate', label: t('preLabelReceiving.createdDate') },
    { key: 'actions', label: t('preLabelReceiving.actions'), sortable: false },
  ], [t]);

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const range = getPagedRange(page, 1);
  const exportColumns = useMemo(
    () => columns
      .filter((column) => column.key !== 'actions')
      .map((column) => ({ key: column.key, label: column.label })),
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

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6 shadow-sm dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200">
              <Barcode className="h-4 w-4" />
              {t('preLabelReceiving.eyebrow')}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">{t('preLabelReceiving.title')}</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{t('preLabelReceiving.subtitle')}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm dark:bg-white/5">
              <div className="text-2xl font-black">{summary.total}</div>
              <div className="text-xs text-slate-500">{t('preLabelReceiving.openBatchCount')}</div>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm dark:bg-white/5">
              <div className="text-2xl font-black">{summary.labels}</div>
              <div className="text-xs text-slate-500">{t('preLabelReceiving.totalLabels')}</div>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm dark:bg-white/5">
              <div className="text-2xl font-black">{summary.remaining}</div>
              <div className="text-xs text-slate-500">{t('preLabelReceiving.remainingLabels')}</div>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('preLabelReceiving.batchList')}</CardTitle>
          <CardDescription>{t('preLabelReceiving.batchListDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<GrPreReceiptLabelBatch, ColumnKey>
            pageKey="goods-receipt-pre-label-receiving"
            columns={columns}
            rows={actionableBatches}
            rowKey={(batch) => batch.id}
            renderCell={(batch, key) => ({
              batchNo: <span className="font-semibold">{batch.batchNo}</span>,
              siparisNo: batch.siparisNo,
              customer: [batch.customerCodeSnapshot, batch.customerNameSnapshot].filter(Boolean).join(' - ') || '-',
              status: <Badge className={statusClassName(batch.status)}>{t(`preLabels.statuses.${batch.status}`, batch.status)}</Badge>,
              progress: `${batch.consumedLabelCount}/${batch.totalLabelCount} ${t('preLabelReceiving.consumedShort')}`,
              createdDate: formatDate(batch.createdDate),
            } as Record<Exclude<ColumnKey, 'actions'>, ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={(key) => {
              if (key !== 'progress' && key !== 'actions') {
                pagedGrid.handleSort(key);
              }
            }}
            renderSortIcon={renderSortIcon}
            isLoading={batchesQuery.isLoading}
            isError={Boolean(batchesQuery.error)}
            errorText={t('preLabelReceiving.loadError')}
            emptyText={t('preLabelReceiving.empty')}
            showActionsColumn
            actionsHeaderLabel={t('preLabelReceiving.actions')}
            renderActionsCell={(batch) => (
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => startGoodsReceiptMutation.mutate(batch)}
                  disabled={startGoodsReceiptMutation.isPending}
                >
                  <PackageCheck className="h-4 w-4" />
                  {t('preLabelReceiving.startScan')}
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
            userId={0}
            exportFileName="goods-receipt-pre-label-receiving"
            exportColumns={exportColumns}
            exportRows={exportRows}
            filterColumns={filterColumns}
            defaultFilterColumn="batchNo"
            draftFilterRows={pagedGrid.draftFilterRows}
            onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
            filterLogic={pagedGrid.filterLogic}
            onFilterLogicChange={pagedGrid.setFilterLogic}
            onApplyFilters={pagedGrid.applyAdvancedFilters}
            onClearFilters={pagedGrid.clearAdvancedFilters}
            translationNamespace="common"
            appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
            search={{ ...pagedGrid.searchConfig, placeholder: t('preLabelReceiving.searchPlaceholder'), className: 'h-9 w-full md:w-80' }}
            leftSlot={<VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />}
            refresh={{
              onRefresh: () => void batchesQuery.refetch(),
              isLoading: batchesQuery.isFetching,
              label: t('common.refresh'),
              disabled: batchesQuery.isFetching,
            }}
          />
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-cyan-200/70 bg-cyan-50/70 px-4 py-3 text-sm text-cyan-900 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-100">
            <RefreshCw className="h-4 w-4 shrink-0" />
            <span>{t('preLabelReceiving.helpText')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
