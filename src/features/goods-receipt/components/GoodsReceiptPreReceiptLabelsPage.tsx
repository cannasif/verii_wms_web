import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Barcode, Eye, Plus, Printer, RefreshCcw, Search, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUIStore } from '@/stores/ui-store';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import type { GrPreReceiptLabel, GrPreReceiptLabelBatch, Order, OrderItem } from '../types/goods-receipt';

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

export function GoodsReceiptPreReceiptLabelsPage(): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<GrPreReceiptLabelBatch | null>(null);
  const [customerCode, setCustomerCode] = useState('');
  const [selectedOrderNo, setSelectedOrderNo] = useState('');

  useEffect(() => {
    setPageTitle(t('preLabels.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const batchesQuery = useQuery({
    queryKey: ['goods-receipt-pre-label-batches', search],
    queryFn: () => goodsReceiptApi.getPreReceiptLabelBatchesPaged({ pageNumber: 1, pageSize: 50, search }),
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

  const createBatchMutation = useMutation({
    mutationFn: async () => {
      const selectedOrder = (ordersQuery.data ?? []).find((order) => order.siparisNo === selectedOrderNo);
      const lines = orderLinesQuery.data ?? [];
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
      await queryClient.invalidateQueries({ queryKey: ['goods-receipt-pre-label-batches'] });
      setSelectedBatch(batch);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const batches = batchesQuery.data?.data ?? [];
  const labels = labelsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const orderLines = orderLinesQuery.data ?? [];

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

  const lineQuantity = (line: OrderItem): number => line.remainingForImport ?? line.remainingHamax ?? line.orderedQty ?? 0;

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
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('preLabels.customerCode')}</label>
              <Input
                value={customerCode}
                onChange={(event) => {
                  setCustomerCode(event.target.value);
                  setSelectedOrderNo('');
                }}
                placeholder={t('preLabels.customerCodePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('preLabels.orderSelect')}</label>
              <div className="flex min-h-10 flex-wrap gap-2 rounded-md border border-slate-200 p-2 dark:border-white/10">
                {ordersQuery.isFetching ? (
                  <span className="text-sm text-slate-500">{t('common.loading')}</span>
                ) : orders.length === 0 ? (
                  <span className="text-sm text-slate-500">{customerCode.trim().length > 1 ? t('preLabels.noOrders') : t('preLabels.enterCustomerCode')}</span>
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
              disabled={createBatchMutation.isPending || orderLines.length === 0}
              onClick={() => createBatchMutation.mutate()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Barcode className="h-4 w-4" />
              {createBatchMutation.isPending ? t('common.loading') : t('preLabels.createButton')}
            </Button>
          </div>

          {selectedOrderNo ? (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-white/10">
                <div>
                  <div className="text-sm font-bold">{t('preLabels.orderLinesTitle', { orderNo: selectedOrderNo })}</div>
                  <div className="text-xs text-slate-500">{t('preLabels.orderLinesHint')}</div>
                </div>
                <Badge variant="secondary">{orderLines.length} {t('preLabels.lineCount')}</Badge>
              </div>
              <div className="max-h-72 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('preLabels.stock')}</TableHead>
                      <TableHead>{t('preLabels.quantity')}</TableHead>
                      <TableHead>{t('preLabels.printPlan')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderLinesQuery.isLoading ? (
                      <TableRow><TableCell colSpan={3}>{t('common.loading')}</TableCell></TableRow>
                    ) : orderLines.length === 0 ? (
                      <TableRow><TableCell colSpan={3}>{t('preLabels.noOrderLines')}</TableCell></TableRow>
                    ) : orderLines.map((line) => (
                      <TableRow key={`${line.siparisNo}-${line.orderID}-${line.stockCode}-${line.yapKod ?? ''}`}>
                        <TableCell>
                          <div className="font-semibold">{line.stockCode}</div>
                          <div className="text-xs text-slate-500">{line.stockName}</div>
                        </TableCell>
                        <TableCell>{lineQuantity(line)}</TableCell>
                        <TableCell>{t('preLabels.oneLabelPerLine')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4 md:flex md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{t('preLabels.batchList')}</CardTitle>
            <CardDescription>{t('preLabels.batchListDescription')}</CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('preLabels.searchPlaceholder')}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('preLabels.batchNo')}</TableHead>
                  <TableHead>{t('preLabels.orderNo')}</TableHead>
                  <TableHead>{t('preLabels.customer')}</TableHead>
                  <TableHead>{t('preLabels.status')}</TableHead>
                  <TableHead>{t('preLabels.progress')}</TableHead>
                  <TableHead>{t('preLabels.createdDate')}</TableHead>
                  <TableHead className="text-right">{t('preLabels.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchesQuery.isLoading ? (
                  <TableRow><TableCell colSpan={7}>{t('common.loading')}</TableCell></TableRow>
                ) : batches.length === 0 ? (
                  <TableRow><TableCell colSpan={7}>{t('preLabels.empty')}</TableCell></TableRow>
                ) : batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-semibold">{batch.batchNo}</TableCell>
                    <TableCell>{batch.siparisNo}</TableCell>
                    <TableCell>{[batch.customerCodeSnapshot, batch.customerNameSnapshot].filter(Boolean).join(' - ') || '-'}</TableCell>
                    <TableCell><Badge className={statusClassName(batch.status)}>{t(`preLabels.statuses.${batch.status}`, batch.status)}</Badge></TableCell>
                    <TableCell>{batch.consumedLabelCount}/{batch.totalLabelCount} {t('preLabels.consumedShort')}</TableCell>
                    <TableCell>{formatDate(batch.createdDate)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedBatch(batch)}>
                          <Eye className="h-4 w-4" /> {t('preLabels.details')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openPrintPage(batch)}>
                          <Printer className="h-4 w-4" /> {t('preLabels.print')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => markBatchPrinted(batch)}>
                          <RefreshCcw className="h-4 w-4" /> {t('preLabels.markPrinted')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
