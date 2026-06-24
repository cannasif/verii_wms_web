import { Fragment, type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Boxes, ChevronDown, ChevronRight, Eye, FileClock, GitBranch, Loader2, PackageCheck, Play, RefreshCw, Truck, Wand2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OpsListPageShell, OpsServiceEyebrow } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { BilginogluHakEdisBatch, BilginogluHakEdisOrderActivity, BilginogluHakEdisOrderHeader, BilginogluHakEdisPlan } from '../types/bilginoglu-hakedis.types';
import {
  useBilginogluHakEdisBatchesQuery,
  useBilginogluHakEdisOrderActivitiesQuery,
  useBilginogluHakEdisOrderPlansQuery,
  useBilginogluHakEdisOrdersQuery,
  useBilginogluHakEdisTransferPreviewQuery,
  useBilginogluHakEdisStepsQuery,
  useBilginogluHakEdisBulkTransferPreviewQuery,
  useBilginogluHakEdisBulkShipmentOrdersMutation,
  useBilginogluHakEdisBulkTransferOrdersMutation,
  useEvaluateBilginogluHakEdisMutation,
} from '../hooks/useBilginogluHakEdisQueries';

function formatQty(value: number | null | undefined): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value ?? 0);
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function statusBadge(status: string, label: string): ReactElement {
  const tone = status === 'Completed'
    ? 'bg-emerald-100 text-emerald-700'
    : status === 'ReadyForShipment'
    ? 'bg-emerald-100 text-emerald-700'
    : status === 'InHakEdisFlow'
      ? 'bg-blue-100 text-blue-700'
      : status === 'AwaitingIntermediateApproval'
        ? 'bg-amber-100 text-amber-800'
      : status === 'Blocked'
        ? 'bg-rose-100 text-rose-700'
        : status === 'WaitingStock'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-slate-100 text-slate-700';

  return <Badge className={`rounded-xl border-0 ${tone}`}>{label}</Badge>;
}

type OrderColumnKey =
  | 'siparisNo'
  | 'orderDate'
  | 'customer'
  | 'hakEdisRequired'
  | 'transferAll'
  | 'orderDetail'
  | 'remaining'
  | 'available'
  | 'allocated'
  | 'ready'
  | 'status'
  | 'evaluatedAt';

function mapOrderSortBy(value: OrderColumnKey): string {
  switch (value) {
    case 'siparisNo':
      return 'SiparisNo';
    case 'orderDate':
      return 'OrderDate';
    case 'customer':
      return 'CustomerCode';
    case 'hakEdisRequired':
      return 'HakEdisFlag';
    case 'transferAll':
      return 'TransferAllFlag';
    case 'orderDetail':
      return 'OrderDetail';
    case 'remaining':
      return 'TotalRemainingQty';
    case 'available':
      return 'TotalWarehouseAvailableQty';
    case 'allocated':
      return 'TotalAllocatedQty';
    case 'ready':
      return 'TotalReadyForShipmentQty';
    case 'status':
      return 'Status';
    case 'evaluatedAt':
      return 'LastEvaluationDate';
    default:
      return 'OrderDate';
  }
}

export function BilginogluHakEdisPage(): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const { setPageTitle } = useUIStore();
  const location = useLocation();
  const view = location.pathname.includes('/completed') ? 'completed' : 'open';
  const isCompletedView = view === 'completed';
  const pageTitle = view === 'completed' ? t('views.completed.title') : t('views.open.title');
  const pageDescription = view === 'completed' ? t('views.completed.description') : t('views.open.description');
  const permission = useCrudPermission('wms.service-allocation');
  const [selectedOrder, setSelectedOrder] = useState<BilginogluHakEdisOrderHeader | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<BilginogluHakEdisPlan | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BilginogluHakEdisBatch | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<BilginogluHakEdisOrderActivity | null>(null);
  const [bulkTransferPreviewOpen, setBulkTransferPreviewOpen] = useState(false);
  const [expandedBulkTransferOrderIds, setExpandedBulkTransferOrderIds] = useState<number[]>([]);
  const [bulkShipmentPreviewOpen, setBulkShipmentPreviewOpen] = useState(false);
  const [expandedBulkShipmentOrderIds, setExpandedBulkShipmentOrderIds] = useState<number[]>([]);
  const pageKey = view === 'completed'
    ? 'bilginoglu-hakedis-completed-orders'
    : 'bilginoglu-hakedis-open-orders';
  const pagedGrid = usePagedDataGrid<OrderColumnKey>({
    pageKey,
    defaultSortBy: 'orderDate',
    defaultSortDirection: 'asc',
    defaultPageSize: 20,
    mapSortBy: mapOrderSortBy,
  });

  useEffect(() => {
    setPageTitle(pageTitle);
  }, [pageTitle, setPageTitle]);

  const params = useMemo(() => ({
    ...pagedGrid.queryParams,
    filters: [
      ...(pagedGrid.queryParams.filters ?? []),
      { column: 'IsCompleted', operator: 'eq', value: view === 'completed' ? 'true' : 'false' },
    ],
  }), [pagedGrid.queryParams, view]);
  const ordersQuery = useBilginogluHakEdisOrdersQuery(params);
  const plansQuery = useBilginogluHakEdisOrderPlansQuery(selectedOrder?.id ?? null);
  const activitiesQuery = useBilginogluHakEdisOrderActivitiesQuery(selectedOrder?.id ?? null);
  const transferPreviewQuery = useBilginogluHakEdisTransferPreviewQuery(selectedOrder?.id ?? null);
  const bulkTransferPreviewQuery = useBilginogluHakEdisBulkTransferPreviewQuery(bulkTransferPreviewOpen);
  const batchesQuery = useBilginogluHakEdisBatchesQuery(selectedPlan?.id ?? null);
  const stepsQuery = useBilginogluHakEdisStepsQuery(selectedBatch?.id ?? null);
  const evaluateMutation = useEvaluateBilginogluHakEdisMutation();
  const bulkTransferOrdersMutation = useBilginogluHakEdisBulkTransferOrdersMutation();
  const bulkShipmentOrdersMutation = useBilginogluHakEdisBulkShipmentOrdersMutation();
  const statusLabel = (status: string): string => {
    const translated = t(`status.${status}`);
    return translated === `status.${status}` ? status : translated;
  };

  const orders = ordersQuery.data?.data ?? [];
  const openOrders = orders;
  const visibleOrders = orders;
  const range = getPagedRange(ordersQuery.data, 1);
  const orderColumns = useMemo<PagedDataGridColumn<OrderColumnKey>[]>(() => [
    { key: 'siparisNo', label: t('table.order') },
    { key: 'orderDate', label: t('table.orderDate') },
    { key: 'customer', label: t('table.customer') },
    { key: 'hakEdisRequired', label: t('table.hakEdisRequired') },
    { key: 'transferAll', label: t('table.transferAll') },
    { key: 'orderDetail', label: t('table.orderDetail') },
    { key: 'remaining', label: t('table.remaining') },
    { key: 'available', label: t('table.stock') },
    { key: 'allocated', label: t('table.allocated') },
    { key: 'ready', label: t('table.ready') },
    { key: 'status', label: t('table.status') },
    { key: 'evaluatedAt', label: t('table.evaluatedAt') },
  ], [t]);
  const plans = plansQuery.data ?? [];
  const totals = useMemo(() => {
    return visibleOrders.reduce(
      (acc, order) => {
        acc.remaining += order.totalRemainingQty;
        acc.available += order.totalWarehouseAvailableQty;
        acc.allocated += order.totalAllocatedQty;
        acc.ready += order.totalReadyForShipmentQty;
        acc.missing += order.totalMissingQty;
        acc.waiting += order.totalWaitingQty;
        return acc;
      },
      { remaining: 0, available: 0, allocated: 0, ready: 0, missing: 0, waiting: 0 },
    );
  }, [visibleOrders]);
  const bulkTransferPreviewOrders = useMemo(() => {
    return (bulkTransferPreviewQuery.data ?? []).map((order) => {
      const transferableQty = Math.max(0, order.totalTransferableQty ?? 0);
      const availableQty = Math.max(0, order.totalWarehouseAvailableQty ?? 0);
      const remainingQty = Math.max(0, order.totalRemainingOrderQty ?? 0);
      const decision = transferableQty > 0.0001
        ? 'eligible'
        : availableQty <= 0.0001
          ? 'noBalance'
          : 'notEligible';

      return {
        order,
        availableQty,
        remainingQty,
        transferableQty,
        missingQty: Math.max(0, remainingQty - transferableQty),
        decision,
      };
    });
  }, [bulkTransferPreviewQuery.data]);
  const bulkTransferPreviewTotals = useMemo(() => {
    return bulkTransferPreviewOrders.reduce(
      (acc, preview) => {
        acc.orderCount += 1;
        if (preview.transferableQty > 0.0001) acc.eligibleCount += 1;
        acc.remaining += preview.remainingQty;
        acc.available += preview.availableQty;
        acc.transferable += preview.transferableQty;
        acc.missing += preview.missingQty;
        return acc;
      },
      { orderCount: 0, eligibleCount: 0, remaining: 0, available: 0, transferable: 0, missing: 0 },
    );
  }, [bulkTransferPreviewOrders]);
  const toggleBulkTransferOrder = (orderHeaderId: number): void => {
    setExpandedBulkTransferOrderIds((current) =>
      current.includes(orderHeaderId)
        ? current.filter((id) => id !== orderHeaderId)
        : [...current, orderHeaderId],
    );
  };
  const bulkShipmentPreviewOrders = useMemo(() => {
    return openOrders.map((order) => {
      const readyQty = Math.max(0, order.totalReadyForShipmentQty ?? 0);
      const remainingToShipQty = Math.max(0, (order.totalRemainingQty ?? 0) - (order.totalShipmentCreatedQty ?? 0));
      const requiresFullShipment = order.transferAllFlag === 'E' || order.shipmentPolicy === 'AutoFullShipment';
      const shippableQty = requiresFullShipment && readyQty + 0.0001 < remainingToShipQty ? 0 : readyQty;
      const decision = shippableQty > 0.0001
        ? 'eligible'
        : readyQty > 0.0001 && requiresFullShipment
          ? 'fullShipmentWaiting'
          : 'notReady';

      return {
        order,
        readyQty,
        remainingToShipQty,
        shippableQty,
        missingQty: Math.max(0, remainingToShipQty - readyQty),
        decision,
      };
    });
  }, [openOrders]);
  const bulkShipmentPreviewTotals = useMemo(() => {
    return bulkShipmentPreviewOrders.reduce(
      (acc, preview) => {
        acc.orderCount += 1;
        if (preview.shippableQty > 0.0001) acc.eligibleCount += 1;
        acc.remaining += preview.remainingToShipQty;
        acc.ready += preview.readyQty;
        acc.shippable += preview.shippableQty;
        acc.missing += preview.missingQty;
        return acc;
      },
      { orderCount: 0, eligibleCount: 0, remaining: 0, ready: 0, shippable: 0, missing: 0 },
    );
  }, [bulkShipmentPreviewOrders]);
  const toggleBulkShipmentOrder = (orderHeaderId: number): void => {
    setExpandedBulkShipmentOrderIds((current) =>
      current.includes(orderHeaderId)
        ? current.filter((id) => id !== orderHeaderId)
        : [...current, orderHeaderId],
    );
  };
  const selectedOrderNeed = useMemo(() => {
    const required = plans.reduce((sum, plan) => sum + Math.max(0, plan.remainingOrderQty - plan.allocatedToHakEdisQty - plan.shippedQty), 0);
    const available = plans.reduce((sum, plan) => sum + Math.max(0, plan.warehouseAvailableQty), 0);
    const canCreate = plans.reduce((sum, plan) => {
      const lineNeed = Math.max(0, plan.remainingOrderQty - plan.allocatedToHakEdisQty - plan.shippedQty);
      return sum + Math.min(lineNeed, Math.max(0, plan.warehouseAvailableQty));
    }, 0);

    return {
      required,
      available,
      canCreate,
      missing: Math.max(0, required - canCreate),
    };
  }, [plans]);
  const activities = activitiesQuery.data ?? [];
  const transferPreview = transferPreviewQuery.data;
  const activitySummary = useMemo(() => {
    const datHeaders = new Set<number>();
    const shipmentHeaders = new Set<number>();
    let completed = 0;

    activities.forEach((activity) => {
      if (activity.sourceType === 'WT' && activity.sourceHeaderId) datHeaders.add(activity.sourceHeaderId);
      if (activity.sourceType === 'SH' && activity.sourceHeaderId) shipmentHeaders.add(activity.sourceHeaderId);
      if (activity.status === 'Completed' || activity.isCompleted) completed += 1;
    });

    return {
      datCount: datHeaders.size,
      shipmentCount: shipmentHeaders.size,
      completedCount: completed,
    };
  }, [activities]);
  const hakEdisActivities = useMemo(
    () => activities.filter((activity) => activity.sourceType !== 'SH' && !activity.stepType.toLowerCase().includes('shipment')),
    [activities],
  );
  const shipmentActivities = useMemo(
    () => activities.filter((activity) => activity.sourceType === 'SH' || activity.stepType.toLowerCase().includes('shipment')),
    [activities],
  );

  return (
    <OpsListPageShell
      eyebrow={<OpsServiceEyebrow module={t('breadcrumb.module')} />}
      title={pageTitle}
      description={pageDescription}
    >
      {isCompletedView ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
                <PackageCheck className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white md:text-2xl">{pageTitle}</h1>
                <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{t('views.completed.description')}</p>
              </div>
            </div>
            <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => void ordersQuery.refetch()}>
              <RefreshCw className="mr-2 size-4" />
              {t('actions.refresh')}
            </Button>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
                <GitBranch className="size-4" />
                {t('hero.eyebrow')}
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">{pageTitle}</h1>
              <p className="text-sm leading-6 text-slate-200 md:text-base">
                {t('views.open.description')}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                type="button"
                className="w-full rounded-2xl bg-emerald-300 text-slate-950 hover:bg-emerald-200 sm:w-auto"
                onClick={() => setBulkTransferPreviewOpen(true)}
                disabled={!permission.canUpdate || bulkTransferOrdersMutation.isPending}
              >
                {bulkTransferOrdersMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Wand2 className="mr-2 size-4" />}
                {t('actions.createHakEdisTransferOrders')}
              </Button>
              <Button
                type="button"
                className="w-full rounded-2xl bg-amber-300 text-slate-950 hover:bg-amber-200 sm:w-auto"
                onClick={() => setBulkShipmentPreviewOpen(true)}
                disabled={!permission.canUpdate || bulkShipmentOrdersMutation.isPending}
              >
                {bulkShipmentOrdersMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Truck className="mr-2 size-4" />}
                {t('actions.createShipmentOrders')}
              </Button>
              <Button
                type="button"
                className="w-full rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200 sm:w-auto"
                onClick={() => evaluateMutation.mutate(undefined)}
                disabled={!permission.canUpdate || evaluateMutation.isPending}
              >
                {evaluateMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />}
                {t('actions.evaluate')}
              </Button>
              <Button type="button" variant="secondary" className="w-full rounded-2xl sm:w-auto" onClick={() => void ordersQuery.refetch()}>
                <RefreshCw className="mr-2 size-4" />
                {t('actions.refresh')}
              </Button>
            </div>
          </div>
        </section>
      )}

      <Dialog open={bulkTransferPreviewOpen} onOpenChange={setBulkTransferPreviewOpen}>
        <DialogContent className="max-h-[92dvh] w-[96vw] max-w-[96vw] overflow-y-auto rounded-3xl border-slate-200 bg-slate-50 p-4 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-[#10071d] dark:text-white sm:max-w-[96vw] sm:p-6 lg:max-w-[92vw] xl:max-w-7xl">
          <DialogHeader className="space-y-2">
            <DialogTitle>{t('bulkTransferPreview.title')}</DialogTitle>
            <DialogDescription>{t('bulkTransferPreview.description')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <NeedCard label={t('bulkTransferPreview.metrics.orders')} value={formatQty(bulkTransferPreviewTotals.orderCount)} tone="slate" />
            <NeedCard label={t('bulkTransferPreview.metrics.eligible')} value={formatQty(bulkTransferPreviewTotals.eligibleCount)} tone="emerald" />
            <NeedCard label={t('bulkTransferPreview.metrics.remaining')} value={formatQty(bulkTransferPreviewTotals.remaining)} tone="blue" />
            <NeedCard label={t('bulkTransferPreview.metrics.available')} value={formatQty(bulkTransferPreviewTotals.available)} tone="cyan" />
            <NeedCard label={t('bulkTransferPreview.metrics.transferable')} value={formatQty(bulkTransferPreviewTotals.transferable)} tone="emerald" />
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
            {t('bulkTransferPreview.warning')}
          </div>

          <div className="max-h-[52dvh] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#170b29] dark:shadow-black/30">
            <Table className="min-w-[1120px]">
              <TableHeader className="sticky top-0 z-10 bg-slate-950 dark:bg-[#210f36]">
                <TableRow className="border-slate-800 hover:bg-slate-950 dark:border-white/10 dark:hover:bg-[#210f36]">
                  <TableHead className="w-12 text-white" />
                  <TableHead className="min-w-48 text-white">{t('table.order')}</TableHead>
                  <TableHead className="min-w-72 text-white">{t('table.customer')}</TableHead>
                  <TableHead className="text-right text-white">{t('table.remaining')}</TableHead>
                  <TableHead className="text-right text-white">{t('table.stock')}</TableHead>
                  <TableHead className="text-right text-white">{t('table.canCreate')}</TableHead>
                  <TableHead className="text-right text-white">{t('metrics.missing')}</TableHead>
                  <TableHead className="min-w-52 text-white">{t('bulkTransferPreview.table.decision')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkTransferPreviewOrders.map(({ order, availableQty, remainingQty, transferableQty, missingQty, decision }) => {
                  const orderHeaderId = order.orderHeaderId;
                  const expanded = expandedBulkTransferOrderIds.includes(orderHeaderId);

                  return (
                    <Fragment key={orderHeaderId}>
                      <TableRow key={orderHeaderId} className="border-slate-100 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-[#12081f] dark:hover:bg-[#1b0d2f]">
                        <TableCell className="align-top">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-8 rounded-xl text-slate-700 dark:text-slate-100"
                            onClick={() => toggleBulkTransferOrder(orderHeaderId)}
                            aria-label={t('bulkTransferPreview.table.details')}
                          >
                            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="align-top font-black text-slate-950 dark:text-white">{order.siparisNo}</TableCell>
                        <TableCell className="align-top">
                          <div className="font-bold text-slate-800 dark:text-slate-100">{order.customerCode ?? '-'}</div>
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">{order.customerName ?? '-'}</div>
                        </TableCell>
                        <TableCell className="text-right align-top font-bold text-slate-800 dark:text-slate-100">{formatQty(remainingQty)}</TableCell>
                        <TableCell className="text-right align-top font-bold text-cyan-700 dark:text-cyan-200">{formatQty(availableQty)}</TableCell>
                        <TableCell className="text-right align-top text-lg font-black text-emerald-700 dark:text-emerald-200">{formatQty(transferableQty)}</TableCell>
                        <TableCell className="text-right align-top font-bold text-amber-700 dark:text-amber-200">{formatQty(missingQty)}</TableCell>
                        <TableCell className="align-top">
                          <Badge className={`rounded-xl border-0 ${
                            decision === 'eligible'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-100'
                              : decision === 'noBalance'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-100'
                                : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'
                          }`}>
                            {t(`bulkTransferPreview.decisions.${decision}`)}
                          </Badge>
                          <div className="mt-2 text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">
                            {decision === 'eligible'
                              ? t('bulkTransferPreview.table.willCreate', { qty: formatQty(transferableQty) })
                              : t('bulkTransferPreview.table.willSkip')}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded ? (
                        <TableRow key={`${orderHeaderId}-details`} className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0f071b] dark:hover:bg-[#0f071b]">
                          <TableCell colSpan={8} className="p-3">
                            <BulkTransferOrderLines orderHeaderId={orderHeaderId} />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
                {bulkTransferPreviewOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      {t('bulkTransferPreview.empty')}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setBulkTransferPreviewOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={!permission.canUpdate || bulkTransferPreviewTotals.eligibleCount === 0 || bulkTransferOrdersMutation.isPending}
              onClick={() => bulkTransferOrdersMutation.mutate(undefined, { onSuccess: () => setBulkTransferPreviewOpen(false) })}
            >
              {bulkTransferOrdersMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Wand2 className="mr-2 size-4" />}
              {t('bulkTransferPreview.run', { count: bulkTransferPreviewTotals.eligibleCount })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkShipmentPreviewOpen} onOpenChange={setBulkShipmentPreviewOpen}>
        <DialogContent className="max-h-[92dvh] w-[96vw] max-w-[96vw] overflow-y-auto rounded-3xl border-slate-200 bg-slate-50 p-4 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-[#10071d] dark:text-white sm:max-w-[96vw] sm:p-6 lg:max-w-[92vw] xl:max-w-7xl">
          <DialogHeader className="space-y-2">
            <DialogTitle>{t('bulkShipmentPreview.title')}</DialogTitle>
            <DialogDescription>{t('bulkShipmentPreview.description')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <NeedCard label={t('bulkShipmentPreview.metrics.orders')} value={formatQty(bulkShipmentPreviewTotals.orderCount)} tone="slate" />
            <NeedCard label={t('bulkShipmentPreview.metrics.eligible')} value={formatQty(bulkShipmentPreviewTotals.eligibleCount)} tone="emerald" />
            <NeedCard label={t('bulkShipmentPreview.metrics.remaining')} value={formatQty(bulkShipmentPreviewTotals.remaining)} tone="blue" />
            <NeedCard label={t('bulkShipmentPreview.metrics.ready')} value={formatQty(bulkShipmentPreviewTotals.ready)} tone="cyan" />
            <NeedCard label={t('bulkShipmentPreview.metrics.shippable')} value={formatQty(bulkShipmentPreviewTotals.shippable)} tone="emerald" />
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
            {t('bulkShipmentPreview.warning')}
          </div>

          <div className="max-h-[52dvh] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#170b29] dark:shadow-black/30">
            <Table className="min-w-[1120px]">
              <TableHeader className="sticky top-0 z-10 bg-slate-950 dark:bg-[#210f36]">
                <TableRow className="border-slate-800 hover:bg-slate-950 dark:border-white/10 dark:hover:bg-[#210f36]">
                  <TableHead className="w-12 text-white" />
                  <TableHead className="min-w-48 text-white">{t('table.order')}</TableHead>
                  <TableHead className="min-w-72 text-white">{t('table.customer')}</TableHead>
                  <TableHead className="text-right text-white">{t('bulkShipmentPreview.table.remaining')}</TableHead>
                  <TableHead className="text-right text-white">{t('bulkShipmentPreview.table.ready')}</TableHead>
                  <TableHead className="text-right text-white">{t('bulkShipmentPreview.table.shippable')}</TableHead>
                  <TableHead className="text-right text-white">{t('metrics.missing')}</TableHead>
                  <TableHead className="min-w-52 text-white">{t('bulkShipmentPreview.table.decision')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkShipmentPreviewOrders.map(({ order, readyQty, remainingToShipQty, shippableQty, missingQty, decision }) => {
                  const expanded = expandedBulkShipmentOrderIds.includes(order.id);

                  return (
                    <Fragment key={order.id}>
                      <TableRow className="border-slate-100 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-[#12081f] dark:hover:bg-[#1b0d2f]">
                        <TableCell className="align-top">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-8 rounded-xl text-slate-700 dark:text-slate-100"
                            onClick={() => toggleBulkShipmentOrder(order.id)}
                            aria-label={t('bulkShipmentPreview.table.details')}
                          >
                            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="align-top font-black text-slate-950 dark:text-white">{order.siparisNo}</TableCell>
                        <TableCell className="align-top">
                          <div className="font-bold text-slate-800 dark:text-slate-100">{order.customerCode ?? '-'}</div>
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">{order.customerName ?? '-'}</div>
                        </TableCell>
                        <TableCell className="text-right align-top font-bold text-slate-800 dark:text-slate-100">{formatQty(remainingToShipQty)}</TableCell>
                        <TableCell className="text-right align-top font-bold text-cyan-700 dark:text-cyan-200">{formatQty(readyQty)}</TableCell>
                        <TableCell className="text-right align-top text-lg font-black text-emerald-700 dark:text-emerald-200">{formatQty(shippableQty)}</TableCell>
                        <TableCell className="text-right align-top font-bold text-amber-700 dark:text-amber-200">{formatQty(missingQty)}</TableCell>
                        <TableCell className="align-top">
                          <Badge className={`rounded-xl border-0 ${
                            decision === 'eligible'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-100'
                              : decision === 'fullShipmentWaiting'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-100'
                                : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'
                          }`}>
                            {t(`bulkShipmentPreview.decisions.${decision}`)}
                          </Badge>
                          <div className="mt-2 text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">
                            {decision === 'eligible'
                              ? t('bulkShipmentPreview.table.willCreate', { qty: formatQty(shippableQty) })
                              : decision === 'fullShipmentWaiting'
                                ? t('bulkShipmentPreview.table.fullShipmentWaiting')
                                : t('bulkShipmentPreview.table.willSkip')}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded ? (
                        <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0f071b] dark:hover:bg-[#0f071b]">
                          <TableCell colSpan={8} className="p-3">
                            <BulkShipmentOrderLines orderHeaderId={order.id} />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
                {bulkShipmentPreviewOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      {t('bulkShipmentPreview.empty')}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setBulkShipmentPreviewOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              className="rounded-2xl bg-amber-500 text-slate-950 hover:bg-amber-400"
              disabled={!permission.canUpdate || bulkShipmentPreviewTotals.eligibleCount === 0 || bulkShipmentOrdersMutation.isPending}
              onClick={() => bulkShipmentOrdersMutation.mutate(undefined, { onSuccess: () => setBulkShipmentPreviewOpen(false) })}
            >
              {bulkShipmentOrdersMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Truck className="mr-2 size-4" />}
              {t('bulkShipmentPreview.run', { count: bulkShipmentPreviewTotals.eligibleCount })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isCompletedView ? (
      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <Button
          asChild
          variant={view === 'open' ? 'default' : 'ghost'}
          className="rounded-2xl"
        >
          <Link to="/service-allocation/bilginoglu-hakedis/open">
            {t('views.open.nav')}
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="rounded-2xl"
        >
          <Link to="/service-allocation/bilginoglu-hakedis/completed">
            {t('views.completed.nav')}
          </Link>
        </Button>
      </div>
      ) : null}

      {!isCompletedView ? (
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={<Boxes className="size-5" />} label={t('metrics.remaining')} value={formatQty(totals.remaining)} />
        <MetricCard icon={<GitBranch className="size-5" />} label={t('metrics.available')} value={formatQty(totals.available)} />
        <MetricCard icon={<PackageCheck className="size-5" />} label={t('metrics.ready')} value={formatQty(totals.ready)} />
        <MetricCard icon={<Truck className="size-5" />} label={t('metrics.missing')} value={formatQty(totals.missing)} />
      </div>
      ) : null}

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <PagedDataGrid<BilginogluHakEdisOrderHeader, OrderColumnKey>
            variant="ops"
            pageKey={pageKey}
            columns={orderColumns}
            rows={visibleOrders}
            rowKey={(order) => order.id}
            renderCell={(order, columnKey) => {
              switch (columnKey) {
                case 'siparisNo':
                  return <span className="font-semibold">{order.siparisNo}</span>;
                case 'orderDate':
                  return formatDate(order.orderDate);
                case 'customer':
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{order.customerCode ?? '-'}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{order.customerName ?? '-'}</span>
                    </div>
                  );
                case 'hakEdisRequired':
                  return order.hakEdisFlag === 'E' ? t('common.yes') : t('common.no');
                case 'transferAll':
                  return order.transferAllFlag === 'E' ? t('common.yes') : t('common.no');
                case 'orderDetail':
                  return order.orderDetail ?? '-';
                case 'remaining':
                  return <span className="font-semibold">{formatQty(order.totalRemainingQty)}</span>;
                case 'available':
                  return (
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold">{formatQty(order.totalWarehouseAvailableQty)}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t('table.canCreate')}: {formatQty(order.canCreateNewBatchQty)}</span>
                    </div>
                  );
                case 'allocated':
                  return formatQty(order.totalAllocatedQty);
                case 'ready':
                  return formatQty(order.totalReadyForShipmentQty);
                case 'status':
                  return statusBadge(order.status, statusLabel(order.status));
                case 'evaluatedAt':
                  return formatDate(order.lastEvaluationDate);
                default:
                  return '-';
              }
            }}
            showActionsColumn
            actionsHeaderLabel={t('common.actions')}
            actionsCellClassName="text-center align-middle"
            renderActionsCell={(order) => (
              <div className="flex items-center justify-center">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-500/10"
                  aria-label={t('common.view')}
                  title={t('common.view')}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedOrder(order);
                    setSelectedPlan(null);
                    setSelectedBatch(null);
                  }}
                >
                  <Eye className="size-4" />
                </Button>
              </div>
            )}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            isLoading={ordersQuery.isLoading}
            isError={ordersQuery.isError}
            errorText={ordersQuery.error instanceof Error ? ordersQuery.error.message : t('common.error')}
            emptyText={view === 'completed' ? t('views.completed.empty') : t('views.open.empty')}
            pageSize={ordersQuery.data?.pageSize ?? pagedGrid.pageSize}
            pageSizeOptions={pagedGrid.pageSizeOptions}
            onPageSizeChange={pagedGrid.handlePageSizeChange}
            pageNumber={pagedGrid.getDisplayPageNumber(ordersQuery.data)}
            totalPages={ordersQuery.data?.totalPages ?? 0}
            hasPreviousPage={ordersQuery.data?.hasPreviousPage ?? false}
            hasNextPage={ordersQuery.data?.hasNextPage ?? false}
            onPreviousPage={pagedGrid.goToPreviousPage}
            onNextPage={pagedGrid.goToNextPage}
            previousLabel={t('common.previous')}
            nextLabel={t('common.next')}
            paginationInfoText={t('common.paginationInfo', {
              current: range.from,
              total: range.to,
              totalCount: range.total,
              defaultValue: `${range.from}-${range.to} / ${range.total}`,
            })}
            search={{
              value: pagedGrid.searchConfig.value,
              onValueChange: pagedGrid.searchConfig.onValueChange,
              onSearchChange: pagedGrid.searchConfig.onSearchChange,
              placeholder: t('table.search'),
            }}
            refresh={{ onRefresh: () => void ordersQuery.refetch(), label: t('actions.refresh') }}
            exportFileName={pageKey}
            minTableWidthClassName="min-w-[1080px]"
          />
        </CardContent>
      </Card>

      <Dialog open={selectedOrder != null} onOpenChange={(open) => { if (!open) { setSelectedOrder(null); setSelectedPlan(null); setSelectedBatch(null); setSelectedActivity(null); } }}>
        <DialogContent className="max-h-[92dvh] w-[96vw] max-w-[96vw] overflow-y-auto overflow-x-hidden rounded-3xl border-slate-200 bg-slate-50 p-4 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-[#10071d] dark:text-white sm:max-w-[96vw] sm:p-6 lg:max-w-[92vw] xl:max-w-7xl">
          <DialogHeader className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-white/10 dark:bg-white/5">
            <DialogTitle className="text-xl font-black tracking-tight dark:text-white">{t('detail.title', { order: selectedOrder?.siparisNo })}</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">{t('detail.description')}</DialogDescription>
          </DialogHeader>
          {selectedOrder ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <NeedCard label={t('need.required')} value={formatQty(selectedOrderNeed.required || selectedOrder.totalRequiredQty)} tone="slate" />
                <NeedCard label={t('need.canCreate')} value={formatQty(selectedOrderNeed.canCreate || selectedOrder.canCreateNewBatchQty)} tone="emerald" />
                <NeedCard label={t('need.allocated')} value={formatQty(selectedOrder.totalAllocatedQty)} tone="blue" />
                <NeedCard label={t('need.missing')} value={formatQty(selectedOrderNeed.missing || selectedOrder.totalMissingQty)} tone="amber" />
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#170b29] lg:flex-row lg:flex-wrap lg:items-end">
                <div className="w-full rounded-2xl bg-slate-50 p-3 dark:bg-white/5 sm:w-auto sm:min-w-40">
                  <div className="text-xs font-semibold text-muted-foreground">{t('table.hakEdisRequired')}</div>
                  <div className="text-sm font-bold">{selectedOrder.hakEdisFlag === 'E' ? t('common.yes') : t('common.no')}</div>
                </div>
                <div className="w-full rounded-2xl bg-slate-50 p-3 dark:bg-white/5 sm:w-auto sm:min-w-40">
                  <div className="text-xs font-semibold text-muted-foreground">{t('table.transferAll')}</div>
                  <div className="text-sm font-bold">{selectedOrder.transferAllFlag === 'E' ? t('common.yes') : t('common.no')}</div>
                </div>
                <div className="w-full rounded-2xl bg-slate-50 p-3 dark:bg-white/5 sm:w-auto sm:min-w-48">
                  <div className="text-xs font-semibold text-muted-foreground">{t('table.orderDetail')}</div>
                  <div className="text-sm font-bold">{selectedOrder.orderDetail ?? '-'}</div>
                </div>
              </div>
            </div>
          ) : null}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#170b29]">
            <h3 className="mb-2 text-sm font-semibold">{t('detail.lines')}</h3>
            <div className="flex flex-wrap gap-2">
              {plans.map((plan) => (
                <PlanLineChip
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan?.id === plan.id}
                  onSelect={() => {
                    setSelectedPlan(plan);
                    setSelectedBatch(null);
                  }}
                />
              ))}
              {!plansQuery.isLoading && plans.length === 0 ? <span className="text-sm text-muted-foreground">{t('detail.noLines')}</span> : null}
            </div>
          </div>
          <Accordion type="multiple" defaultValue={['hakEdis']} className="space-y-3">
            <AccordionItem value="hakEdis" className="rounded-2xl border border-slate-200 bg-white px-4 shadow-sm dark:border-white/10 dark:bg-[#170b29]">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex flex-col items-start gap-1 text-left">
                  <span className="font-black">{t('activity.hakEdisSection')}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {t('activity.datCount', { count: activitySummary.datCount })} / {t('activity.completedCount', { count: hakEdisActivities.filter((activity) => activity.status === 'Completed' || activity.isCompleted).length })}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                {transferPreviewQuery.isLoading ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-muted-foreground dark:bg-white/5">
                    <Loader2 className="size-4 animate-spin" />
                    {t('loading')}
                  </div>
                ) : transferPreview ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                      <div>
                        <h3 className="text-sm font-black text-slate-950 dark:text-white">{t('transferPreview.title')}</h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">{t('transferPreview.description')}</p>
                      </div>
                      <div className="flex flex-col gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-semibold leading-5 text-cyan-900 dark:text-cyan-100">
                        <span>{t('activity.createFromQueues')}</span>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild type="button" size="sm" variant="outline" className="h-8 rounded-xl border-cyan-500/30 bg-white/70 text-xs text-cyan-950 hover:bg-white dark:bg-white/10 dark:text-cyan-50 dark:hover:bg-white/15">
                            <Link to="/service-allocation/bilginoglu-hakedis/pending-transfers">{t('activity.pendingTransfers')}</Link>
                          </Button>
                          <Button asChild type="button" size="sm" variant="outline" className="h-8 rounded-xl border-cyan-500/30 bg-white/70 text-xs text-cyan-950 hover:bg-white dark:bg-white/10 dark:text-cyan-50 dark:hover:bg-white/15">
                            <Link to="/service-allocation/bilginoglu-hakedis/pending-shipments">{t('activity.pendingShipments')}</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <NeedCard label={t('transferPreview.orderQty')} value={formatQty(transferPreview.totalOrderQty)} tone="slate" />
                      <NeedCard label={t('transferPreview.processedQty')} value={formatQty(transferPreview.totalProcessedQty)} tone="blue" />
                      <NeedCard label={t('transferPreview.transferableQty')} value={formatQty(transferPreview.totalTransferableQty)} tone="emerald" />
                      <NeedCard label={t('transferPreview.shippableQty')} value={formatQty(transferPreview.totalShippableQty)} tone="cyan" />
                      <NeedCard label={t('transferPreview.missingQty')} value={formatQty(transferPreview.totalMissingQty)} tone="amber" />
                    </div>
                  </div>
                ) : null}
                <ActivityHistoryTable
                  activities={hakEdisActivities}
                  isLoading={activitiesQuery.isLoading}
                  emptyText={t('activity.emptyHakEdis')}
                  statusLabel={statusLabel}
                  onSelect={setSelectedActivity}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shipment" className="rounded-2xl border border-slate-200 bg-white px-4 shadow-sm dark:border-white/10 dark:bg-[#170b29]">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex flex-col items-start gap-1 text-left">
                  <span className="font-black">{t('activity.shipmentSection')}</span>
                  <span className="text-xs font-normal text-muted-foreground">{t('activity.shipmentCount', { count: activitySummary.shipmentCount })}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <ActivityHistoryTable
                  activities={shipmentActivities}
                  isLoading={activitiesQuery.isLoading}
                  emptyText={t('activity.emptyShipment')}
                  statusLabel={statusLabel}
                  onSelect={setSelectedActivity}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="batches" className="rounded-2xl border border-slate-200 bg-white px-4 shadow-sm dark:border-white/10 dark:bg-[#170b29]">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex flex-col items-start gap-1 text-left">
                  <span className="font-black">{t('detail.batch')}</span>
                  <span className="text-xs font-normal text-muted-foreground">{t('detail.steps')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#170b29]">
              <Table className="min-w-[680px]">
                <TableHeader>
          <TableRow>
            <TableHead>{t('detail.batch')}</TableHead>
            <TableHead className="text-right">{t('detail.quantity')}</TableHead>
            <TableHead>{t('detail.stage')}</TableHead>
            <TableHead>{t('detail.warehouseSourceTypes')}</TableHead>
            <TableHead className="text-center">{t('common.actions')}</TableHead>
          </TableRow>
                </TableHeader>
                <TableBody>
                  {(batchesQuery.data ?? []).map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-semibold">{batch.batchNo}</TableCell>
                      <TableCell className="text-right">{formatQty(batch.quantity)}</TableCell>
                      <TableCell>{statusBadge(batch.currentStage, statusLabel(batch.currentStage))}</TableCell>
                      <TableCell className="text-xs">
                        {t('detail.batchLinkSummary', {
                          replenishmentToIntermediateHeaderId: batch.replenishmentToIntermediateHeaderId ?? '-',
                          replenishmentToOrderWarehouseHeaderId: batch.replenishmentToOrderWarehouseHeaderId ?? '-',
                          datToHakEdisHeaderId: batch.transferToHakEdisHeaderId ?? '-',
                          returnFromHakEdisHeaderId: batch.returnFromHakEdisHeaderId ?? '-',
                          shipmentHeaderId: batch.shipmentHeaderId ?? '-',
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-500/10"
                          aria-label={t('common.view')}
                          title={t('common.view')}
                          onClick={() => setSelectedBatch(batch)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(batchesQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">{t('detail.noBatches')}</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#170b29]">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h3 className="font-semibold">{t('detail.steps')}</h3>
                {selectedBatch ? (
                  <Badge className="w-fit rounded-xl border-0 bg-white/10 text-slate-700 dark:text-slate-200">
                    {t('activity.readOnlyDetail')}
                  </Badge>
                ) : null}
              </div>
              {selectedBatch == null ? (
                <p className="text-sm text-muted-foreground">{t('detail.chooseBatch')}</p>
              ) : stepsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {t('loading')}</div>
              ) : (
                <div className="space-y-3">
                  {(stepsQuery.data ?? []).map((step) => (
                    <div key={step.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{step.sequenceNo}. {step.stepType}</span>
                        {statusBadge(step.status, statusLabel(step.status))}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatQty(step.quantity)} {t('common.unit')} / {step.sourceType ?? '-'} #{step.sourceHeaderId ?? '-'}
                      </div>
                      {step.note ? <div className="mt-2 text-xs">{step.note}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedActivity != null} onOpenChange={(open) => { if (!open) setSelectedActivity(null); }}>
        <DialogContent className="max-h-[88dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-3xl border-slate-200 bg-slate-50 p-4 pr-5 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-[#10071d] dark:text-white sm:max-w-[92vw] sm:p-6 sm:pr-7 lg:max-w-5xl">
          <DialogHeader className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-white/10 dark:bg-white/5">
            <DialogTitle className="text-xl font-black tracking-tight dark:text-white">
              {t('activity.detailTitle', {
                step: selectedActivity ? statusLabel(selectedActivity.stepType) : '-',
              })}
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
              {t('activity.detailDescription')}
            </DialogDescription>
          </DialogHeader>

          {selectedActivity ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
                <ActivitySummaryCard label={t('activity.batch')} value={selectedActivity.batchNo ?? '-'} tone="slate" />
                <ActivitySummaryCard label={t('activity.quantity')} value={formatQty(selectedActivity.quantity)} tone="blue" />
                <ActivitySummaryCard label={t('activity.status')} value={statusLabel(selectedActivity.status)} tone={selectedActivity.isCompleted ? 'emerald' : 'amber'} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ActivityDetailCard title={t('activity.whoCompleted')}>
                  <DetailLine label={t('activity.actor')} value={selectedActivity.actionByUserName ?? '-'} />
                  <DetailLine label={t('activity.actionDate')} value={formatDate(selectedActivity.actionDate)} />
                  <DetailLine label={t('activity.completionDate')} value={formatDate(selectedActivity.completionDate)} />
                  <DetailLine label={t('activity.collectors')} value={selectedActivity.collectedByUsers ?? '-'} />
                  <DetailLine label={t('activity.collectorCountLabel')} value={t('activity.collectorCount', { count: selectedActivity.collectedUserCount })} />
                </ActivityDetailCard>

                <ActivityDetailCard title={t('activity.documentTrace')}>
                  <DetailLine label={t('activity.document')} value={selectedActivity.documentNo ?? '-'} />
                  <DetailLine label={t('activity.series')} value={selectedActivity.documentSeries ?? '-'} />
                  <DetailLine label={t('activity.type')} value={selectedActivity.documentType ?? '-'} />
                  <DetailLine label={t('activity.source')} value={`${selectedActivity.sourceType ?? '-'} #${selectedActivity.sourceHeaderId ?? '-'}`} />
                  <DetailLine label={t('activity.erp')} value={selectedActivity.erpReferenceNumber ?? selectedActivity.erpIntegrationStatus ?? '-'} />
                  <DetailLine label={t('activity.erpDate')} value={formatDate(selectedActivity.erpIntegrationDate)} />
                </ActivityDetailCard>
              </div>

              <ActivityDetailCard title={t('activity.stockTrace')}>
                <div className="grid gap-3 md:grid-cols-2">
                  <DetailLine label={t('detail.stock')} value={selectedActivity.stockCode ?? '-'} />
                  <DetailLine label={t('activity.stockName')} value={selectedActivity.stockName ?? '-'} />
                  <DetailLine label={t('table.order')} value={selectedActivity.siparisNo ?? '-'} />
                  <DetailLine label={t('activity.orderLineId')} value={String(selectedActivity.orderId ?? '-')} />
                </div>
                {selectedActivity.note ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                    {selectedActivity.note}
                  </div>
                ) : null}
              </ActivityDetailCard>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </OpsListPageShell>
  );
}

function ActivityRow({ activity, statusLabel, onSelect }: { activity: BilginogluHakEdisOrderActivity; statusLabel: (status: string) => string; onSelect: (activity: BilginogluHakEdisOrderActivity) => void }): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const documentText = activity.documentNo
    ? `${activity.sourceType ?? '-'} #${activity.sourceHeaderId ?? '-'} / ${activity.documentNo}`
    : `${activity.sourceType ?? '-'} #${activity.sourceHeaderId ?? '-'}`;
  const erpText = activity.erpReferenceNumber
    ? `${activity.erpIntegrationStatus ?? '-'} / ${activity.erpReferenceNumber}`
    : activity.erpIntegrationStatus ?? (activity.isErpIntegrated ? t('activity.erpIntegrated') : '-');

  return (
    <TableRow>
      <TableCell>
        <div className="font-semibold">{activity.sequenceNo}. {statusLabel(activity.stepType)}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{activity.batchNo}</span>
          {statusBadge(activity.status, statusLabel(activity.status))}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{documentText}</div>
        <div className="text-xs text-muted-foreground">
          {t('activity.series')}: {activity.documentSeries ?? '-'} / {t('activity.type')}: {activity.documentType ?? '-'}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{erpText}</div>
        <div className="text-xs text-muted-foreground">{formatDate(activity.erpIntegrationDate)}</div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{activity.actionByUserName ?? '-'}</div>
        <div className="text-xs text-muted-foreground">{formatDate(activity.actionDate ?? activity.completionDate)}</div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{activity.collectedByUsers ?? '-'}</div>
        <div className="text-xs text-muted-foreground">{t('activity.collectorCount', { count: activity.collectedUserCount })}</div>
      </TableCell>
      <TableCell className="text-right">
        <div className="font-semibold">{formatQty(activity.quantity)}</div>
        <div className="text-xs text-muted-foreground">{activity.stockCode ?? '-'}</div>
      </TableCell>
      <TableCell className="text-center">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-500/10"
          aria-label={t('activity.openDetail')}
          title={t('activity.openDetail')}
          onClick={() => onSelect(activity)}
        >
          <Eye className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ActivityHistoryTable({
  activities,
  isLoading,
  emptyText,
  statusLabel,
  onSelect,
}: {
  activities: BilginogluHakEdisOrderActivity[];
  isLoading: boolean;
  emptyText: string;
  statusLabel: (status: string) => string;
  onSelect: (activity: BilginogluHakEdisOrderActivity) => void;
}): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-muted-foreground dark:bg-white/5">
        <Loader2 className="size-4 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-muted-foreground dark:bg-white/5">
        <FileClock className="size-4" />
        {emptyText}
      </div>
    );
  }

  return (
    <div className="max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#12081f]">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t('activity.step')}</TableHead>
            <TableHead>{t('activity.document')}</TableHead>
            <TableHead>{t('activity.erp')}</TableHead>
            <TableHead>{t('activity.actor')}</TableHead>
            <TableHead>{t('activity.collectors')}</TableHead>
            <TableHead className="text-right">{t('detail.quantity')}</TableHead>
            <TableHead className="text-center">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <ActivityRow
              key={`${activity.batchId}-${activity.sequenceNo}-${activity.sourceHeaderId ?? 0}-${activity.stepType}`}
              activity={activity}
              statusLabel={statusLabel}
              onSelect={onSelect}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ActivityDetailCard({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#170b29]">
      <h3 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 break-words text-sm font-bold text-slate-950 dark:text-white">{value || '-'}</div>
    </div>
  );
}

function ActivitySummaryCard({ label, value, tone }: { label: string; value: string; tone: 'slate' | 'blue' | 'emerald' | 'amber' }): ReactElement {
  const toneClass = {
    slate: 'border-slate-200 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white',
    blue: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-100',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100',
  }[tone];

  return (
    <div className={`min-w-0 rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <div className="text-xs font-black uppercase tracking-[0.14em] opacity-70">{label}</div>
      <div className="mt-2 break-words text-2xl font-black leading-tight sm:text-3xl">{value || '-'}</div>
    </div>
  );
}

function PlanLineChip({ plan, selected, onSelect }: { plan: BilginogluHakEdisPlan; selected: boolean; onSelect: () => void }): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const requiredQty = Math.max(0, plan.remainingOrderQty - plan.allocatedToHakEdisQty - plan.shippedQty);
  const usableQty = Math.min(requiredQty, Math.max(0, plan.warehouseAvailableQty));
  const hasUsableQty = usableQty > 0.0001;

  return (
    <Button
      type="button"
      variant={selected ? 'default' : 'outline'}
      className={`h-auto max-w-full justify-start whitespace-normal rounded-2xl px-3 py-3 text-left leading-5 ${
        selected
          ? 'bg-slate-950 text-white hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100'
          : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'
      }`}
      onClick={onSelect}
    >
      <span className="flex min-w-0 flex-col gap-2">
        <span className="min-w-0">
          <span className="block truncate text-sm font-black">{plan.stockCode ?? t('detail.stock')}</span>
          <span className="block truncate text-xs font-semibold opacity-75">{plan.stockName ?? '-'}</span>
        </span>
        <span className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">
            {t('need.required')}: {formatQty(requiredQty)}
          </span>
          <span className="rounded-full bg-cyan-100 px-2 py-1 font-bold text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-100">
            {t('detail.sourceWarehouse')}: {plan.sourceWarehouseCode ?? '-'}
          </span>
          <span className="rounded-full bg-blue-100 px-2 py-1 font-bold text-blue-800 dark:bg-blue-400/15 dark:text-blue-100">
            {t('detail.hakEdisWarehouse')}: {plan.hakEdisWarehouseCode ?? '-'}
          </span>
          <span className={`rounded-full px-2 py-1 font-black ${
            hasUsableQty
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-100'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-100'
          }`}>
            {hasUsableQty
              ? t('detail.willUseQty', { qty: formatQty(usableQty), warehouse: plan.sourceWarehouseCode ?? '-' })
              : t('detail.noUsableBalance', { warehouse: plan.sourceWarehouseCode ?? '-' })}
          </span>
        </span>
      </span>
    </Button>
  );
}

function BulkTransferOrderLines({ orderHeaderId }: { orderHeaderId: number }): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const previewQuery = useBilginogluHakEdisTransferPreviewQuery(orderHeaderId);
  const lines = previewQuery.data?.lines ?? [];

  if (previewQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground dark:border-white/10 dark:bg-[#140923]">
        <Loader2 className="size-4 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  if (previewQuery.isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
        {previewQuery.error instanceof Error ? previewQuery.error.message : t('bulkTransferPreview.error')}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-muted-foreground dark:border-white/10 dark:bg-[#140923]">
        {t('bulkTransferPreview.empty')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#140923]">
      <Table className="min-w-[980px]">
        <TableHeader className="bg-slate-100 dark:bg-white/5">
          <TableRow className="border-slate-200 dark:border-white/10">
            <TableHead className="min-w-72">{t('bulkTransferPreview.table.stock')}</TableHead>
            <TableHead className="min-w-36">{t('bulkTransferPreview.table.warehouse')}</TableHead>
            <TableHead className="text-right">{t('transferPreview.orderQty')}</TableHead>
            <TableHead className="text-right">{t('transferPreview.processedQty')}</TableHead>
            <TableHead className="text-right">{t('transferPreview.remainingQty')}</TableHead>
            <TableHead className="text-right">{t('table.stock')}</TableHead>
            <TableHead className="text-right">{t('transferPreview.transferableQty')}</TableHead>
            <TableHead className="text-right">{t('metrics.missing')}</TableHead>
            <TableHead className="min-w-56">{t('bulkTransferPreview.table.decision')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => {
            const decision = line.willCreateTransfer
              ? 'eligible'
              : line.warehouseAvailableQty <= 0.0001
                ? 'noBalance'
                : 'notEligible';

            return (
              <TableRow key={line.planId} className="border-slate-100 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
                <TableCell className="align-top">
                  <div className="font-black text-slate-950 dark:text-white">{line.stockCode ?? '-'}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{line.stockName ?? '-'}</div>
                  {line.yapKod ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('bulkTransferPreview.table.yapCode')} {line.yapKod}</div> : null}
                </TableCell>
                <TableCell className="align-top">
                  <Badge variant="secondary" className="rounded-xl">
                    {line.sourceWarehouseCode ?? '-'} → {line.hakEdisWarehouseCode ?? '-'}
                  </Badge>
                  {line.sameWarehouse ? <div className="mt-1 text-xs text-muted-foreground">{t('transferPreview.sameWarehouse')}</div> : null}
                </TableCell>
                <TableCell className="text-right align-top font-bold text-slate-800 dark:text-slate-100">{formatQty(line.orderQty)}</TableCell>
                <TableCell className="text-right align-top font-bold text-blue-700 dark:text-blue-200">{formatQty(line.processedQty)}</TableCell>
                <TableCell className="text-right align-top font-bold text-slate-800 dark:text-slate-100">{formatQty(line.remainingOrderQty)}</TableCell>
                <TableCell className="text-right align-top font-bold text-cyan-700 dark:text-cyan-200">{formatQty(line.warehouseAvailableQty)}</TableCell>
                <TableCell className="text-right align-top text-lg font-black text-emerald-700 dark:text-emerald-200">{formatQty(line.transferableQty)}</TableCell>
                <TableCell className="text-right align-top font-bold text-amber-700 dark:text-amber-200">{formatQty(line.missingQty)}</TableCell>
                <TableCell className="align-top">
                  <Badge className={`rounded-xl border-0 ${
                    line.willCreateTransfer
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-100'
                      : decision === 'noBalance'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-100'
                        : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'
                  }`}>
                    {t(`bulkTransferPreview.decisions.${decision}`)}
                  </Badge>
                  <div className="mt-2 text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">
                    {line.willCreateTransfer
                      ? t('bulkTransferPreview.table.willCreateLine', { qty: formatQty(line.transferableQty), stock: line.stockCode ?? '-' })
                      : line.decisionReason ?? t('bulkTransferPreview.table.willSkipLine')}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function BulkShipmentOrderLines({ orderHeaderId }: { orderHeaderId: number }): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const previewQuery = useBilginogluHakEdisTransferPreviewQuery(orderHeaderId);
  const lines = previewQuery.data?.lines ?? [];

  if (previewQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground dark:border-white/10 dark:bg-[#140923]">
        <Loader2 className="size-4 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  if (previewQuery.isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
        {previewQuery.error instanceof Error ? previewQuery.error.message : t('bulkShipmentPreview.error')}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-muted-foreground dark:border-white/10 dark:bg-[#140923]">
        {t('bulkShipmentPreview.empty')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#140923]">
      <Table className="min-w-[980px]">
        <TableHeader className="bg-slate-100 dark:bg-white/5">
          <TableRow className="border-slate-200 dark:border-white/10">
            <TableHead className="min-w-72">{t('bulkTransferPreview.table.stock')}</TableHead>
            <TableHead className="text-right">{t('transferPreview.orderQty')}</TableHead>
            <TableHead className="text-right">{t('transferPreview.processedQty')}</TableHead>
            <TableHead className="text-right">{t('transferPreview.remainingQty')}</TableHead>
            <TableHead className="text-right">{t('bulkShipmentPreview.table.ready')}</TableHead>
            <TableHead className="text-right">{t('bulkShipmentPreview.table.shippable')}</TableHead>
            <TableHead className="text-right">{t('metrics.missing')}</TableHead>
            <TableHead className="min-w-56">{t('bulkShipmentPreview.table.decision')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => {
            const decision = line.shippableQty > 0.0001 ? 'eligible' : 'notReady';

            return (
              <TableRow key={line.planId} className="border-slate-100 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
                <TableCell className="align-top">
                  <div className="font-black text-slate-950 dark:text-white">{line.stockCode ?? '-'}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{line.stockName ?? '-'}</div>
                  {line.yapKod ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('bulkTransferPreview.table.yapCode')} {line.yapKod}</div> : null}
                </TableCell>
                <TableCell className="text-right align-top font-bold text-slate-800 dark:text-slate-100">{formatQty(line.orderQty)}</TableCell>
                <TableCell className="text-right align-top font-bold text-blue-700 dark:text-blue-200">{formatQty(line.processedQty)}</TableCell>
                <TableCell className="text-right align-top font-bold text-slate-800 dark:text-slate-100">{formatQty(line.remainingOrderQty)}</TableCell>
                <TableCell className="text-right align-top font-bold text-cyan-700 dark:text-cyan-200">{formatQty(line.shippableQty)}</TableCell>
                <TableCell className="text-right align-top text-lg font-black text-emerald-700 dark:text-emerald-200">{formatQty(line.shippableQty)}</TableCell>
                <TableCell className="text-right align-top font-bold text-amber-700 dark:text-amber-200">{formatQty(Math.max(0, line.remainingOrderQty - line.shippableQty))}</TableCell>
                <TableCell className="align-top">
                  <Badge className={`rounded-xl border-0 ${
                    decision === 'eligible'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-100'
                      : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'
                  }`}>
                    {t(`bulkShipmentPreview.decisions.${decision}`)}
                  </Badge>
                  <div className="mt-2 text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">
                    {decision === 'eligible'
                      ? t('bulkShipmentPreview.table.willCreateLine', { qty: formatQty(line.shippableQty), stock: line.stockCode ?? '-' })
                      : t('bulkShipmentPreview.table.willSkipLine')}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function NeedCard({ label, value, tone }: { label: string; value: string; tone: 'slate' | 'cyan' | 'emerald' | 'blue' | 'amber' }): ReactElement {
  const toneClass = {
    slate: 'bg-slate-50 text-slate-800 dark:bg-white/10 dark:text-slate-100',
    cyan: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-400/10 dark:text-cyan-100',
    emerald: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-100',
    blue: 'bg-blue-50 text-blue-800 dark:bg-blue-400/10 dark:text-blue-100',
    amber: 'bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-100',
  }[tone];

  return (
    <div className={`rounded-2xl border border-white/70 p-3 shadow-sm dark:border-white/10 ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactElement; label: string; value: string }): ReactElement {
  return (
    <Card className="rounded-3xl border-slate-200">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">{icon}</div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-black">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
