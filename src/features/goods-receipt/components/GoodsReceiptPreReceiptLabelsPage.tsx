import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Barcode, Eye, PackageCheck, Plus, Printer, RefreshCcw, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PagedDataGrid, PagedLookupDialog, type PagedDataGridColumn } from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import type { Customer, GrPreReceiptLabel, GrPreReceiptLabelBatch, Order, OrderItem } from '../types/goods-receipt';

type BatchColumnKey = 'batchNo' | 'siparisNo' | 'customer' | 'status' | 'progress' | 'createdDate' | 'actions';

const batchFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'batchNo', type: 'string', labelKey: 'goodsReceipt.preLabels.batchNo' },
  { value: 'siparisNo', type: 'string', labelKey: 'goodsReceipt.preLabels.orderNo' },
  { value: 'customer', type: 'string', labelKey: 'goodsReceipt.preLabels.customer' },
  { value: 'status', type: 'string', labelKey: 'goodsReceipt.preLabels.status' },
  { value: 'createdDate', type: 'date', labelKey: 'goodsReceipt.preLabels.createdDate' },
];

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

function statusClassName(status: string): string {
  switch (status) {
    case 'Consumed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200';
    case 'Printed':
    case 'PartiallyPrinted':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200';
    case 'PartiallyConsumed':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200';
    case 'Cancelled':
    case 'Void':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200';
  }
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
    pageKey: 'goods-receipt-pre-label-batches',
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

  const summary = useMemo(() => {
    return batches.reduce(
      (acc, batch) => {
        acc.total += batch.totalLabelCount;
        acc.printed += batch.printedLabelCount;
        acc.consumed += batch.consumedLabelCount;
        return acc;
      },
      { total: 0, printed: 0, consumed: 0 },
    );
  }, [batches]);

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
    { key: 'batchNo', label: t('preLabels.batchNo') },
    { key: 'siparisNo', label: t('preLabels.orderNo') },
    { key: 'customer', label: t('preLabels.customer') },
    { key: 'status', label: t('preLabels.status') },
    { key: 'progress', label: t('preLabels.progress'), sortable: false },
    { key: 'createdDate', label: t('preLabels.createdDate') },
    { key: 'actions', label: t('preLabels.actions'), sortable: false },
  ], [t]);
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
    () => batchColumns
      .filter((column) => column.key !== 'actions')
      .map((column) => ({ key: column.key, label: column.label })),
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
  const toggleLine = (line: OrderItem): void => {
    const key = lineKey(line);
    if (existingLabelKeys.has(key)) {
      return;
    }

    setSelectedLineKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };
  const toggleAllEligible = (): void => {
    setSelectedLineKeys(() => {
      if (allEligibleSelected) {
        return new Set();
      }

      return new Set(eligibleOrderLines.map(lineKey));
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 shadow-sm dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-800 dark:bg-sky-500/20 dark:text-sky-200">
              <Barcode className="h-4 w-4" />
              {t('preLabels.eyebrow')}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">{t('preLabels.title')}</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{t('preLabels.subtitle')}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm dark:bg-white/5">
              <div className="text-2xl font-black">{summary.total}</div>
              <div className="text-xs text-slate-500">{t('preLabels.total')}</div>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm dark:bg-white/5">
              <div className="text-2xl font-black">{summary.printed}</div>
              <div className="text-xs text-slate-500">{t('preLabels.printed')}</div>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm dark:bg-white/5">
              <div className="text-2xl font-black">{summary.consumed}</div>
              <div className="text-xs text-slate-500">{t('preLabels.consumed')}</div>
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-emerald-200/70 dark:border-emerald-500/20">
        <CardHeader className="bg-emerald-50/70 dark:bg-emerald-950/20">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" />
            {t('preLabels.createTitle')}
          </CardTitle>
          <CardDescription>{t('preLabels.createSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 lg:grid-cols-[320px_1fr_auto] lg:items-end">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('preLabels.customer')}</label>
              <PagedLookupDialog<Customer>
                open={customerLookupOpen}
                onOpenChange={setCustomerLookupOpen}
                title={t('preLabels.selectCustomer')}
                description={t('preLabels.selectCustomerDescription')}
                value={selectedCustomerLabel}
                placeholder={t('preLabels.selectCustomer')}
                searchPlaceholder={t('preLabels.customerSearchPlaceholder')}
                emptyText={t('common.notFound')}
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('preLabels.orderSelect')}</label>
              <div className="flex min-h-10 flex-wrap gap-2 rounded-md border border-slate-200 p-2 dark:border-white/10">
                {ordersQuery.isFetching ? (
                  <span className="text-sm text-slate-500">{t('common.loading')}</span>
                ) : orders.length === 0 ? (
                  <span className="text-sm text-slate-500">{customerCode.trim().length > 1 ? t('preLabels.noOrders') : t('preLabels.selectCustomerForOrders')}</span>
                ) : orders.map((order) => (
                  <Button
                    key={order.siparisNo}
                    size="sm"
                    type="button"
                    variant={selectedOrderNo === order.siparisNo ? 'default' : 'outline'}
                    onClick={() => selectOrder(order)}
                  >
                    {order.siparisNo}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              type="button"
              disabled={createBatchMutation.isPending || selectedOrderLines.length === 0}
              onClick={() => createBatchMutation.mutate()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Barcode className="h-4 w-4" />
              {createBatchMutation.isPending
                ? t('common.loading')
                : t('preLabels.createSelectedButton', { count: selectedOrderLines.length })}
            </Button>
          </div>

          {selectedOrderNo ? (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-3 dark:border-white/10 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-bold">{t('preLabels.orderLinesTitle', { orderNo: selectedOrderNo })}</div>
                  <div className="text-xs text-slate-500">{t('preLabels.orderLinesHint')}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{eligibleOrderLines.length}/{orderLines.length} {t('preLabels.availableLineCount')}</Badge>
                  <Badge variant="outline">{selectedOrderLines.length} {t('preLabels.selectedLineCount')}</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={eligibleOrderLines.length === 0}
                    onClick={toggleAllEligible}
                  >
                    {allEligibleSelected ? t('preLabels.clearSelection') : t('preLabels.selectAll')}
                  </Button>
                </div>
              </div>
              <div className="max-h-72 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">{t('preLabels.select')}</TableHead>
                      <TableHead>{t('preLabels.stock')}</TableHead>
                      <TableHead>{t('preLabels.quantity')}</TableHead>
                      <TableHead>{t('preLabels.printPlan')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderLinesQuery.isLoading ? (
                      <TableRow><TableCell colSpan={4}>{t('common.loading')}</TableCell></TableRow>
                    ) : orderLines.length === 0 ? (
                      <TableRow><TableCell colSpan={4}>{t('preLabels.noOrderLines')}</TableCell></TableRow>
                    ) : orderLines.map((line) => {
                      const key = lineKey(line);
                      const hasExistingLabel = existingLabelKeys.has(key);
                      const disabled = hasExistingLabel || lineQuantity(line) <= 0;
                      return (
                      <TableRow key={`${line.siparisNo}-${line.orderID}-${line.stockCode}-${line.yapKod ?? ''}`} className={disabled ? 'opacity-60' : undefined}>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                            checked={selectedLineKeys.has(key)}
                            disabled={disabled}
                            onChange={() => toggleLine(line)}
                            aria-label={t('preLabels.selectLine')}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{line.stockCode}</div>
                          <div className="text-xs text-slate-500">{line.stockName}</div>
                          {hasExistingLabel ? (
                            <Badge className="mt-1 bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                              {t('preLabels.alreadyLabeled')}
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell>{lineQuantity(line)}</TableCell>
                        <TableCell>{t('preLabels.oneLabelPerLine')}</TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {orderLabelsQuery.isFetching ? (
                <div className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-white/10">
                  {t('preLabels.checkingExistingLabels')}
                </div>
              ) : existingOrderLabels.length > 0 ? (
                <div className="border-t border-slate-200 px-3 py-2 text-xs text-amber-700 dark:border-white/10 dark:text-amber-200">
                  {t('preLabels.existingLabelsInfo', { count: existingOrderLabels.length })}
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('preLabels.batchList')}</CardTitle>
            <CardDescription>{t('preLabels.batchListDescription')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<GrPreReceiptLabelBatch, BatchColumnKey>
            pageKey="goods-receipt-pre-label-batches"
            columns={batchColumns}
            rows={batches}
            rowKey={(batch) => batch.id}
            renderCell={(batch, key) => ({
              batchNo: <span className="font-semibold">{batch.batchNo}</span>,
              siparisNo: batch.siparisNo,
              customer: [batch.customerCodeSnapshot, batch.customerNameSnapshot].filter(Boolean).join(' - ') || '-',
              status: <Badge className={statusClassName(batch.status)}>{t(`preLabels.statuses.${batch.status}`, batch.status)}</Badge>,
              progress: `${batch.consumedLabelCount}/${batch.totalLabelCount} ${t('preLabels.consumedShort')}`,
              createdDate: formatDate(batch.createdDate),
            } as Record<Exclude<BatchColumnKey, 'actions'>, ReactNode>)[key as Exclude<BatchColumnKey, 'actions'>] ?? null}
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
            errorText={t('preLabels.loadError')}
            emptyText={t('preLabels.empty')}
            showActionsColumn
            actionsHeaderLabel={t('preLabels.actions')}
            renderActionsCell={(batch) => (
              <div className="flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedBatch(batch)}>
                  <Eye className="h-4 w-4" /> {t('preLabels.details')}
                </Button>
                <Button
                  size="sm"
                  className="bg-sky-600 hover:bg-sky-700"
                  onClick={() => startGoodsReceiptMutation.mutate(batch)}
                  disabled={startGoodsReceiptMutation.isPending || batch.status === 'Consumed' || batch.status === 'Cancelled' || batch.status === 'Void'}
                >
                  <PackageCheck className="h-4 w-4" /> {t('preLabels.startGoodsReceipt')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => openPrintPage(batch)}>
                  <Printer className="h-4 w-4" /> {t('preLabels.print')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => markBatchPrinted(batch)}>
                  <RefreshCcw className="h-4 w-4" /> {t('preLabels.markPrinted')}
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
            userId={0}
            exportFileName="goods-receipt-pre-label-batches"
            exportColumns={batchExportColumns}
            exportRows={batchExportRows}
            filterColumns={batchFilterColumns}
            defaultFilterColumn="batchNo"
            draftFilterRows={pagedGrid.draftFilterRows}
            onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
            filterLogic={pagedGrid.filterLogic}
            onFilterLogicChange={pagedGrid.setFilterLogic}
            onApplyFilters={pagedGrid.applyAdvancedFilters}
            onClearFilters={pagedGrid.clearAdvancedFilters}
            translationNamespace="common"
            appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
            search={{ ...pagedGrid.searchConfig, placeholder: t('preLabels.searchPlaceholder'), className: 'h-9 w-full md:w-80' }}
            leftSlot={<VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />}
            refresh={{ onRefresh: () => void batchesQuery.refetch(), isLoading: batchesQuery.isFetching, label: t('common.refresh') }}
          />
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedBatch)} onOpenChange={(open) => !open && setSelectedBatch(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{selectedBatch?.batchNo}</DialogTitle>
            <DialogDescription>{t('preLabels.detailDescription', { orderNo: selectedBatch?.siparisNo ?? '-' })}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-2xl border border-slate-200 dark:border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('preLabels.barcode')}</TableHead>
                  <TableHead>{t('preLabels.stock')}</TableHead>
                  <TableHead>{t('preLabels.serial')}</TableHead>
                  <TableHead>{t('preLabels.quantity')}</TableHead>
                  <TableHead>{t('preLabels.status')}</TableHead>
                  <TableHead>{t('preLabels.printCount')}</TableHead>
                  <TableHead className="text-right">{t('preLabels.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labelsQuery.isLoading ? (
                  <TableRow><TableCell colSpan={7}>{t('common.loading')}</TableCell></TableRow>
                ) : labels.length === 0 ? (
                  <TableRow><TableCell colSpan={7}>{t('preLabels.noLabels')}</TableCell></TableRow>
                ) : labels.map((label) => (
                  <TableRow key={label.id}>
                    <TableCell className="font-mono text-xs">{label.barcodeValue}</TableCell>
                    <TableCell>{[label.stockCodeSnapshot, label.stockNameSnapshot].filter(Boolean).join(' - ')}</TableCell>
                    <TableCell>{label.serialNo || '-'}</TableCell>
                    <TableCell>{label.labelQuantity}</TableCell>
                    <TableCell><Badge className={statusClassName(label.status)}>{t(`preLabels.statuses.${label.status}`, label.status)}</Badge></TableCell>
                    <TableCell>{label.printCount}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => markPrintedMutation.mutate([label.id])} disabled={label.status === 'Consumed' || label.status === 'Void'}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => voidLabelMutation.mutate(label)} disabled={label.status === 'Consumed' || label.status === 'Void'}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
