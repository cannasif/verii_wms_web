import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Barcode, Eye, PackageCheck, Plus, Printer, RefreshCcw, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OpsActionButton, OpsFieldShell, OpsListPageShell, PagedDataGrid, PagedLookupDialog, type PagedDataGridColumn } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import type { Customer, GrPreReceiptLabel, GrPreReceiptLabelBatch, Order, OrderItem } from '../types/goods-receipt';
import { getPreLabelStatusBadgeClass } from '../utils/pre-label-status-badge';

type BatchColumnKey = 'batchNo' | 'siparisNo' | 'customer' | 'status' | 'progress' | 'createdDate' | 'actions';

const pageKey = 'goods-receipt-pre-label-batches';

const batchFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'batchNo', type: 'string', labelKey: 'goodsReceipt.preLabels.batchNo' },
  { value: 'siparisNo', type: 'string', labelKey: 'goodsReceipt.preLabels.orderNo' },
  { value: 'customer', type: 'string', labelKey: 'goodsReceipt.preLabels.customer' },
  { value: 'status', type: 'string', labelKey: 'goodsReceipt.preLabels.status' },
  { value: 'createdDate', type: 'date', labelKey: 'goodsReceipt.preLabels.createdDate' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  batchNo: 14,
  siparisNo: 14,
  customer: 20,
  status: 12,
  progress: 12,
  createdDate: 16,
};

function mapBatchSortBy(value: BatchColumnKey): string {
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

function lineQuantity(line: OrderItem): number {
  return line.remainingForImport ?? line.remainingHamax ?? line.orderedQty ?? 0;
}

function lineKey(line: OrderItem): string {
  return [
    line.orderID ?? '',
    line.stockCode?.trim().toUpperCase() ?? '',
    line.yapKod?.trim().toUpperCase() ?? '',
  ].join('|');
}

function labelKey(label: GrPreReceiptLabel): string {
  return [
    label.erpOrderId ?? '',
    label.stockCodeSnapshot?.trim().toUpperCase() ?? '',
    label.yapKodSnapshot?.trim().toUpperCase() ?? '',
  ].join('|');
}

export function GoodsReceiptPreReceiptLabelsPage(): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const pagedGrid = usePagedDataGrid<BatchColumnKey>({
    pageKey,
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    defaultPageNumber: 1,
    pageNumberBase: 1,
    mapSortBy: mapBatchSortBy,
  });
  const [selectedBatch, setSelectedBatch] = useState<GrPreReceiptLabelBatch | null>(null);
  const [customerCode, setCustomerCode] = useState('');
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
  const [selectedOrderNo, setSelectedOrderNo] = useState('');
  const [selectedLineKeys, setSelectedLineKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPageTitle(t('preLabels.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const batchesQuery = useQuery({
    queryKey: ['goods-receipt-pre-label-batches', pagedGrid.queryParams],
    queryFn: ({ signal }) => goodsReceiptApi.getPreReceiptLabelBatchesPaged(pagedGrid.queryParams, { signal }),
  });

  const ordersQuery = useQuery({
    queryKey: ['goods-receipt-pre-label-orders', customerCode],
    queryFn: () => goodsReceiptApi.getOrdersByCustomer(customerCode.trim()),
    enabled: customerCode.trim().length > 1,
  });

  const orderLinesQuery = useQuery({
    queryKey: ['goods-receipt-pre-label-order-lines', customerCode, selectedOrderNo],
    queryFn: () => goodsReceiptApi.getOrderItems(customerCode.trim(), selectedOrderNo),
    enabled: customerCode.trim().length > 1 && selectedOrderNo.trim().length > 0,
  });

  const orderLabelsQuery = useQuery({
    queryKey: ['goods-receipt-pre-label-order-existing-labels', selectedOrderNo],
    queryFn: () => goodsReceiptApi.getPreReceiptLabelsByOrder(selectedOrderNo),
    enabled: selectedOrderNo.trim().length > 0,
  });

  const labelsQuery = useQuery({
    queryKey: ['goods-receipt-pre-labels', selectedBatch?.id],
    queryFn: () => goodsReceiptApi.getPreReceiptLabelsByBatchId(selectedBatch!.id),
    enabled: Boolean(selectedBatch?.id),
  });

  const markPrintedMutation = useMutation({
    mutationFn: (labelIds: number[]) => goodsReceiptApi.markPreReceiptLabelsPrinted(labelIds),
    onSuccess: async () => {
      toast.success(t('preLabels.printMarked'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-label-batches'] }),
        queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-labels', selectedBatch?.id] }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const voidLabelMutation = useMutation({
    mutationFn: (label: GrPreReceiptLabel) => goodsReceiptApi.voidPreReceiptLabel(label.id, t('preLabels.voidReason')),
    onSuccess: async () => {
      toast.success(t('preLabels.voided'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-label-batches'] }),
        queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-labels', selectedBatch?.id] }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const startGoodsReceiptMutation = useMutation({
    mutationFn: (batch: GrPreReceiptLabelBatch) => goodsReceiptApi.startGoodsReceiptFromPreReceiptBatch(batch.id),
    onSuccess: async (headerId) => {
      toast.success(t('preLabels.goodsReceiptStarted'));
      await queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-label-batches'] });
      navigate(`/goods-receipt/collection/${headerId}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const createBatchMutation = useMutation({
    mutationFn: async () => {
      const selectedOrder = (ordersQuery.data ?? []).find((order) => order.siparisNo === selectedOrderNo);
      const existingKeys = new Set((orderLabelsQuery.data ?? []).map(labelKey));
      const lines = (orderLinesQuery.data ?? []).filter((line) =>
        selectedLineKeys.has(lineKey(line))
        && !existingKeys.has(lineKey(line))
        && lineQuantity(line) > 0);

      if (!selectedOrder || lines.length === 0) {
        throw new Error(t('preLabels.createSelectOrder'));
      }

      return goodsReceiptApi.createPreReceiptLabelBatch({
        siparisNo: selectedOrder.siparisNo,
        customerCodeSnapshot: selectedOrder.customerCode || customerCode.trim(),
        customerNameSnapshot: selectedOrder.customerName,
        description: t('preLabels.createDescription'),
        lines: lines.map((line) => {
          const remainingQuantity = line.remainingForImport ?? line.remainingHamax ?? line.orderedQty ?? 1;
          return {
            erpOrderNo: line.siparisNo,
            erpOrderId: line.orderID,
            stockCode: line.stockCode,
            stockName: line.stockName,
            yapKod: line.yapKod,
            yapAcik: line.yapAcik,
            expectedQuantity: remainingQuantity,
            labelQuantity: remainingQuantity,
            labelCount: 1,
            description: t('preLabels.createLineDescription'),
          };
        }),
      });
    },
    onSuccess: async (batch) => {
      toast.success(t('preLabels.created', { batchNo: batch.batchNo }));
      setSelectedOrderNo('');
      setSelectedLineKeys(new Set());
      await queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-label-batches'] });
      await queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-label-order-existing-labels'] });
      setSelectedBatch(batch);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const batchPage = batchesQuery.data;
  const batches = batchPage?.data ?? [];
  const labels = labelsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const orderLines = orderLinesQuery.data ?? [];
  const existingOrderLabels = orderLabelsQuery.data ?? [];

  useEffect(() => {
    setSelectedLineKeys(new Set());
  }, [selectedOrderNo]);

  const summary = useMemo(() => batches.reduce(
    (acc, batch) => {
      acc.total += batch.totalLabelCount;
      acc.printed += batch.printedLabelCount;
      acc.consumed += batch.consumedLabelCount;
      return acc;
    },
    { total: 0, printed: 0, consumed: 0 },
  ), [batches]);

  const openPrintPage = (batch: GrPreReceiptLabelBatch): void => {
    const params = new URLSearchParams({
      sourceModule: 'goods-receipt-pre-label',
      sourceHeaderId: String(batch.id),
      printMode: 'document-all',
    });
    navigate(`/erp/barcode-designer/0/print?${params.toString()}`);
  };

  const markBatchPrinted = (batch: GrPreReceiptLabelBatch): void => {
    void goodsReceiptApi.getPreReceiptLabelsByBatchId(batch.id).then((items) => {
      const printableIds = items
        .filter((item) => item.status !== 'Consumed' && item.status !== 'Void')
        .map((item) => item.id);
      markPrintedMutation.mutate(printableIds);
    });
  };

  const selectOrder = (order: Order): void => {
    setSelectedOrderNo(order.siparisNo);
  };

  const existingLabelKeys = useMemo(
    () => new Set(existingOrderLabels.map(labelKey)),
    [existingOrderLabels],
  );
  const eligibleOrderLines = useMemo(
    () => orderLines.filter((line) => !existingLabelKeys.has(lineKey(line)) && lineQuantity(line) > 0),
    [existingLabelKeys, orderLines],
  );
  const selectedOrderLines = useMemo(
    () => eligibleOrderLines.filter((line) => selectedLineKeys.has(lineKey(line))),
    [eligibleOrderLines, selectedLineKeys],
  );
  const allEligibleSelected = eligibleOrderLines.length > 0 && selectedOrderLines.length === eligibleOrderLines.length;

  const batchColumns = useMemo<PagedDataGridColumn<BatchColumnKey>[]>(() => [
    { key: 'batchNo', label: t('preLabels.batchNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'siparisNo', label: t('preLabels.orderNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customer', label: t('preLabels.customer'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'status', label: t('preLabels.status'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'progress', label: t('preLabels.progress'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'createdDate', label: t('preLabels.createdDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('preLabels.actions'), sortable: false },
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
    columns: batchColumns.map(({ key, label }) => ({ key, label })),
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    includeActionsColumn: true,
  });

  const renderSortIcon = (columnKey: BatchColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const batchRange = getPagedRange(batchPage, 1);
  const batchPaginationInfoText = t('preLabels.paginationInfo', {
    current: batchRange.from,
    total: batchRange.to,
    totalCount: batchRange.total,
  });
  const batchExportColumns = useMemo(
    () => batchColumns.filter((column) => column.key !== 'actions').map((column) => ({ key: column.key, label: column.label })),
    [batchColumns],
  );
  const batchExportRows = useMemo<Record<string, unknown>[]>(() => batches.map((batch) => ({
    batchNo: batch.batchNo,
    siparisNo: batch.siparisNo,
    customer: [batch.customerCodeSnapshot, batch.customerNameSnapshot].filter(Boolean).join(' - ') || '-',
    status: t(`preLabels.statuses.${batch.status}`, batch.status),
    progress: `${batch.consumedLabelCount}/${batch.totalLabelCount}`,
    createdDate: formatDate(batch.createdDate),
  })), [batches, t]);

  const getCellText = (batch: GrPreReceiptLabelBatch, key: BatchColumnKey): string | undefined => {
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

  const toggleLine = (line: OrderItem): void => {
    const key = lineKey(line);
    if (existingLabelKeys.has(key)) return;

    setSelectedLineKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllEligible = (): void => {
    setSelectedLineKeys(() => (allEligibleSelected ? new Set() : new Set(eligibleOrderLines.map(lineKey))));
  };

  return (
    <>
      <OpsListPageShell
        eyebrow={
          <>
            <span>{t('goodsReceipt.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('goodsReceipt.create.breadcrumb.module')}</span>
          </>
        }
        title={t('preLabels.title')}
        description={t('preLabels.subtitle')}
        actions={(
          <div className="wms-ops-stat-grid">
            <div className="wms-ops-stat-card">
              <div className="wms-ops-stat-card__value">{summary.total}</div>
              <div className="wms-ops-stat-card__label">{t('preLabels.total')}</div>
            </div>
            <div className="wms-ops-stat-card">
              <div className="wms-ops-stat-card__value">{summary.printed}</div>
              <div className="wms-ops-stat-card__label">{t('preLabels.printed')}</div>
            </div>
            <div className="wms-ops-stat-card">
              <div className="wms-ops-stat-card__value">{summary.consumed}</div>
              <div className="wms-ops-stat-card__label">{t('preLabels.consumed')}</div>
            </div>
          </div>
        )}
      >
        <div className="wms-ops-form wms-ops-prelabel-panel">
          <div className="wms-ops-prelabel-panel__header">
            <div className="wms-ops-prelabel-panel__title">
              <Plus className="size-3.5" aria-hidden />
              {t('preLabels.createTitle')}
            </div>
            <p className="wms-ops-prelabel-panel__hint mt-1">{t('preLabels.createSubtitle')}</p>
          </div>
          <div className="wms-ops-prelabel-panel__body space-y-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,20rem)_1fr_auto] lg:items-end">
              <div>
                <label className="wms-ops-prelabel-form-label">{t('preLabels.customer')}</label>
                <OpsFieldShell className={customerLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                  <PagedLookupDialog<Customer>
                    open={customerLookupOpen}
                    onOpenChange={setCustomerLookupOpen}
                    title={t('preLabels.selectCustomer')}
                    description={t('preLabels.selectCustomerDescription')}
                    value={selectedCustomerLabel}
                    placeholder={t('preLabels.selectCustomer')}
                    searchPlaceholder={t('preLabels.customerSearchPlaceholder')}
                    emptyText={t('common.notFound')}
                    variant="ops"
                    triggerClassName={OPS_FIELD_CLASS}
                    queryKey={['goods-receipt-pre-labels', 'customers']}
                    fetchPage={({ pageNumber, pageSize, search, signal }) =>
                      lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })
                    }
                    getKey={(customer) => customer.id.toString()}
                    getLabel={(customer) => `${customer.cariKod} - ${customer.cariIsim}`}
                    onSelect={(customer) => {
                      setCustomerCode(customer.cariKod);
                      setSelectedCustomerLabel(`${customer.cariKod} - ${customer.cariIsim}`);
                      setSelectedOrderNo('');
                      setSelectedLineKeys(new Set());
                    }}
                  />
                </OpsFieldShell>
              </div>
              <div>
                <label className="wms-ops-prelabel-form-label">{t('preLabels.orderSelect')}</label>
                <div className="wms-ops-prelabel-order-pills">
                  {ordersQuery.isFetching ? (
                    <span className="wms-ops-prelabel-panel__hint px-1 py-2">{t('common.loading')}</span>
                  ) : orders.length === 0 ? (
                    <span className="wms-ops-prelabel-panel__hint px-1 py-2">
                      {customerCode.trim().length > 1 ? t('preLabels.noOrders') : t('preLabels.selectCustomerForOrders')}
                    </span>
                  ) : orders.map((order) => (
                    <button
                      key={order.siparisNo}
                      type="button"
                      className={cn(
                        'wms-ops-prelabel-order-pill',
                        selectedOrderNo === order.siparisNo && 'wms-ops-prelabel-order-pill--active',
                      )}
                      onClick={() => selectOrder(order)}
                    >
                      {order.siparisNo}
                    </button>
                  ))}
                </div>
              </div>
              <OpsActionButton
                type="button"
                variant="primary"
                className="w-full lg:w-auto"
                disabled={createBatchMutation.isPending || selectedOrderLines.length === 0}
                onClick={() => createBatchMutation.mutate()}
              >
                <Barcode className="size-3.5" aria-hidden />
                {createBatchMutation.isPending
                  ? t('common.loading')
                  : t('preLabels.createSelectedButton', { count: selectedOrderLines.length })}
              </OpsActionButton>
            </div>

            {selectedOrderNo ? (
              <div className="wms-ops-prelabel-lines">
                <div className="wms-ops-prelabel-lines__head">
                  <div>
                    <div className="wms-ops-prelabel-panel__title text-[0.68rem]">
                      {t('preLabels.orderLinesTitle', { orderNo: selectedOrderNo })}
                    </div>
                    <div className="wms-ops-prelabel-panel__hint mt-1">{t('preLabels.orderLinesHint')}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="wms-ops-code-badge">{eligibleOrderLines.length}/{orderLines.length} {t('preLabels.availableLineCount')}</span>
                    <span className="wms-ops-code-badge">{selectedOrderLines.length} {t('preLabels.selectedLineCount')}</span>
                    <OpsActionButton
                      type="button"
                      variant="secondary"
                      disabled={eligibleOrderLines.length === 0}
                      onClick={toggleAllEligible}
                    >
                      {allEligibleSelected ? t('preLabels.clearSelection') : t('preLabels.selectAll')}
                    </OpsActionButton>
                  </div>
                </div>
                <div className="wms-ops-prelabel-lines__table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('preLabels.select')}</th>
                        <th>{t('preLabels.stock')}</th>
                        <th>{t('preLabels.quantity')}</th>
                        <th>{t('preLabels.printPlan')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderLinesQuery.isLoading ? (
                        <tr><td colSpan={4}>{t('common.loading')}</td></tr>
                      ) : orderLines.length === 0 ? (
                        <tr><td colSpan={4}>{t('preLabels.noOrderLines')}</td></tr>
                      ) : orderLines.map((line) => {
                        const key = lineKey(line);
                        const hasExistingLabel = existingLabelKeys.has(key);
                        const disabled = hasExistingLabel || lineQuantity(line) <= 0;
                        return (
                          <tr key={`${line.siparisNo}-${line.orderID}-${line.stockCode}-${line.yapKod ?? ''}`} className={disabled ? 'opacity-60' : undefined}>
                            <td>
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded-none border-slate-300 accent-cyan-600"
                                checked={selectedLineKeys.has(key)}
                                disabled={disabled}
                                onChange={() => toggleLine(line)}
                                aria-label={t('preLabels.selectLine')}
                              />
                            </td>
                            <td>
                              <div className="font-semibold">{line.stockCode}</div>
                              <div className="wms-ops-prelabel-panel__hint normal-case">{line.stockName}</div>
                              {hasExistingLabel ? (
                                <Badge variant="outline" className="mt-1 wms-ops-status-badge wms-ops-status-badge--pending">
                                  {t('preLabels.alreadyLabeled')}
                                </Badge>
                              ) : null}
                            </td>
                            <td>{lineQuantity(line)}</td>
                            <td>{t('preLabels.oneLabelPerLine')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {orderLabelsQuery.isFetching ? (
                  <div className="wms-ops-prelabel-lines__footer">{t('preLabels.checkingExistingLabels')}</div>
                ) : existingOrderLabels.length > 0 ? (
                  <div className="wms-ops-prelabel-lines__footer wms-ops-prelabel-lines__footer--warn">
                    {t('preLabels.existingLabelsInfo', { count: existingOrderLabels.length })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mb-4 mt-6">
          <div className="wms-ops-prelabel-panel__title mb-1">{t('preLabels.batchList')}</div>
          <p className="wms-ops-prelabel-panel__hint">{t('preLabels.batchListDescription')}</p>
        </div>

        <PagedDataGrid<GrPreReceiptLabelBatch, BatchColumnKey>
          variant="ops"
          pageKey={pageKey}
          columns={batchColumns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as BatchColumnKey[]}
          defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
          columnWidths={columnWidths}
          onResizeColumnPair={resizeColumnPair}
          getCellText={getCellText}
          rows={batches}
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
            progress: <span className="font-mono text-xs">{batch.consumedLabelCount}/{batch.totalLabelCount} {t('preLabels.consumedShort')}</span>,
            createdDate: <span className="font-mono text-xs">{formatDate(batch.createdDate)}</span>,
          } as Record<Exclude<BatchColumnKey, 'actions'>, ReactNode>)[key as Exclude<BatchColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(key) => {
            if (key !== 'progress' && key !== 'actions') pagedGrid.handleSort(key);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={batchesQuery.isLoading}
          isError={Boolean(batchesQuery.error)}
          errorText={t('preLabels.loadError')}
          emptyText={t('preLabels.empty')}
          showActionsColumn
          actionsHeaderLabel={t('preLabels.actions')}
          iconOnlyActions={false}
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(batch) => (
            <div className="wms-ops-row-actions flex-wrap">
              <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn" title={t('preLabels.details')} aria-label={t('preLabels.details')} onClick={() => setSelectedBatch(batch)}>
                <Eye className="size-3" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--start"
                title={t('preLabels.startGoodsReceipt')}
                aria-label={t('preLabels.startGoodsReceipt')}
                onClick={() => startGoodsReceiptMutation.mutate(batch)}
                disabled={startGoodsReceiptMutation.isPending || batch.status === 'Consumed' || batch.status === 'Cancelled' || batch.status === 'Void'}
              >
                <PackageCheck className="size-3" aria-hidden />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn" title={t('preLabels.print')} aria-label={t('preLabels.print')} onClick={() => openPrintPage(batch)}>
                <Printer className="size-3" aria-hidden />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn" title={t('preLabels.markPrinted')} aria-label={t('preLabels.markPrinted')} onClick={() => markBatchPrinted(batch)}>
                <RefreshCcw className="size-3" aria-hidden />
              </Button>
            </div>
          )}
          pageSize={pagedGrid.pageSize}
          pageSizeOptions={pagedGrid.pageSizeOptions}
          onPageSizeChange={pagedGrid.handlePageSizeChange}
          pageNumber={pagedGrid.getDisplayPageNumber(batchPage)}
          totalPages={batchPage?.totalPages ?? 1}
          hasPreviousPage={batchPage?.hasPreviousPage ?? false}
          hasNextPage={batchPage?.hasNextPage ?? false}
          onPreviousPage={pagedGrid.goToPreviousPage}
          onNextPage={pagedGrid.goToNextPage}
          previousLabel={t('common.previous')}
          nextLabel={t('common.next')}
          paginationInfoText={batchPaginationInfoText}
          actionBar={{
            pageKey,
            userId,
            columns: batchColumns.map(({ key, label }) => ({ key, label })),
            visibleColumns,
            columnOrder,
            onVisibleColumnsChange: setVisibleColumns,
            onColumnOrderChange: setColumnOrder,
            exportFileName: pageKey,
            exportColumns: batchExportColumns,
            exportRows: batchExportRows,
            filterColumns: batchFilterColumns,
            defaultFilterColumn: 'batchNo',
            draftFilterRows: pagedGrid.draftFilterRows,
            onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
            filterLogic: pagedGrid.filterLogic,
            onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters,
            onClearFilters: pagedGrid.clearAdvancedFilters,
            translationNamespace: 'common',
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: { ...pagedGrid.searchConfig, placeholder: t('preLabels.searchPlaceholder') },
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
            },
            variant: 'ops',
          }}
        />
      </OpsListPageShell>

      <Dialog open={Boolean(selectedBatch)} onOpenChange={(open) => !open && setSelectedBatch(null)}>
        <DialogContent className="wms-ops-form wms-ops-detail-dialog max-w-5xl overflow-hidden border-0 p-0 shadow-none">
          <DialogHeader className="wms-ops-detail-dialog__header px-6 pt-5 pb-4">
            <DialogTitle className="wms-ops-detail-dialog__title">{selectedBatch?.batchNo}</DialogTitle>
            <DialogDescription className="wms-ops-detail-dialog__description">
              {t('preLabels.detailDescription', { orderNo: selectedBatch?.siparisNo ?? '-' })}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto px-6 pb-6 custom-scrollbar">
            <div className="wms-ops-prelabel-lines">
              <div className="wms-ops-prelabel-lines__table-wrap max-h-none">
                <table>
                  <thead>
                    <tr>
                      <th>{t('preLabels.barcode')}</th>
                      <th>{t('preLabels.stock')}</th>
                      <th>{t('preLabels.serial')}</th>
                      <th>{t('preLabels.quantity')}</th>
                      <th>{t('preLabels.status')}</th>
                      <th>{t('preLabels.printCount')}</th>
                      <th className="text-right">{t('preLabels.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labelsQuery.isLoading ? (
                      <tr><td colSpan={7}>{t('common.loading')}</td></tr>
                    ) : labels.length === 0 ? (
                      <tr><td colSpan={7}>{t('preLabels.noLabels')}</td></tr>
                    ) : labels.map((label) => (
                      <tr key={label.id}>
                        <td className="font-mono text-xs">{label.barcodeValue}</td>
                        <td>{[label.stockCodeSnapshot, label.stockNameSnapshot].filter(Boolean).join(' - ')}</td>
                        <td>{label.serialNo || '-'}</td>
                        <td>{label.labelQuantity}</td>
                        <td>
                          <Badge variant="outline" className={getPreLabelStatusBadgeClass(label.status)}>
                            {t(`preLabels.statuses.${label.status}`, label.status)}
                          </Badge>
                        </td>
                        <td>{label.printCount}</td>
                        <td>
                          <div className="flex justify-end gap-1">
                            <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn" onClick={() => markPrintedMutation.mutate([label.id])} disabled={label.status === 'Consumed' || label.status === 'Void'}>
                              <Printer className="size-3" aria-hidden />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger" onClick={() => voidLabelMutation.mutate(label)} disabled={label.status === 'Consumed' || label.status === 'Void'}>
                              <XCircle className="size-3" aria-hidden />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
