import { Fragment, type ReactElement, useEffect, useMemo, useState } from 'react';
import { Boxes, ChevronDown, ChevronRight, Eye, FileClock, GitBranch, Loader2, PackageCheck, Play, RefreshCw, Truck, Wand2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsListPageShell, OpsServiceEyebrow, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  HAK_EDIS_ORDER_COLUMN_WIDTHS,
  HakEdisDetailPanel,
  HakEdisDetailRow,
  HakEdisFlagChip,
  HakEdisHintBanner,
  HakEdisMetricGrid,
  HakEdisNeedCard,
  HakEdisOpsDialogContent,
  HakEdisOpsEmptyState,
  HakEdisOpsSyncButton,
  HakEdisOpsTableShell,
  HakEdisPageSection,
  HakEdisPlanChip,
  HakEdisStepCard,
  HakEdisSummaryMetric,
  HakEdisViewNav,
  HakEdisWarehouseFlow,
  hakEdisOpsStatusBadge,
} from './bilginoglu-hakedis-ops-ui';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { cn } from '@/lib/utils';
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

function statusBadge(status: string, label: string, inline = false): ReactElement {
  return hakEdisOpsStatusBadge(status, label, { inline });
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
    { key: 'siparisNo', label: t('table.order'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'orderDate', label: t('table.orderDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customer', label: t('table.customer') },
    { key: 'hakEdisRequired', label: t('table.hakEdisRequired'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'transferAll', label: t('table.transferAll'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'orderDetail', label: t('table.orderDetail') },
    { key: 'remaining', label: t('table.remaining'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'available', label: t('table.stock'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'allocated', label: t('table.allocated'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'ready', label: t('table.ready'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'status', label: t('table.status'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'evaluatedAt', label: t('table.evaluatedAt'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
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
  const selectedOrderIsCompleted = selectedOrder?.isCompleted ?? isCompletedView;

  return (
    <>
    <OpsListPageShell
      className="wms-ops-bilginoglu-list"
      eyebrow={<OpsServiceEyebrow module={t('breadcrumb.module')} />}
      title={pageTitle}
      description={pageDescription}
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          {!isCompletedView ? (
            <>
              <OpsActionButton
                type="button"
                variant="primary"
                onClick={() => setBulkTransferPreviewOpen(true)}
                disabled={!permission.canUpdate || bulkTransferOrdersMutation.isPending}
              >
                {bulkTransferOrdersMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                {t('actions.createHakEdisTransferOrders')}
              </OpsActionButton>
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => setBulkShipmentPreviewOpen(true)}
                disabled={!permission.canUpdate || bulkShipmentOrdersMutation.isPending}
              >
                {bulkShipmentOrdersMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />}
                {t('actions.createShipmentOrders')}
              </OpsActionButton>
              <HakEdisOpsSyncButton
                loading={evaluateMutation.isPending}
                disabled={!permission.canUpdate}
                onClick={() => evaluateMutation.mutate(undefined)}
              >
                <Play className="size-4" />
                {t('actions.evaluate')}
              </HakEdisOpsSyncButton>
            </>
          ) : null}
          <OpsActionButton type="button" variant="secondary" onClick={() => void ordersQuery.refetch()}>
            <RefreshCw className="size-4" />
            {t('actions.refresh')}
          </OpsActionButton>
        </div>
      )}
    >
      <div className="wms-ops-bilginoglu-page">
      <HakEdisViewNav
        active={view}
        openLabel={t('views.open.nav')}
        completedLabel={t('views.completed.nav')}
        openHref="/service-allocation/bilginoglu-hakedis/open"
        completedHref="/service-allocation/bilginoglu-hakedis/completed"
      />

      <HakEdisMetricGrid>
        <HakEdisSummaryMetric icon={<Boxes className="size-4" />} label={t('metrics.remaining')} value={formatQty(totals.remaining)} />
        <HakEdisSummaryMetric icon={<GitBranch className="size-4" />} label={t('metrics.available')} value={formatQty(totals.available)} />
        <HakEdisSummaryMetric icon={<PackageCheck className="size-4" />} label={t('metrics.ready')} value={formatQty(totals.ready)} />
        <HakEdisSummaryMetric icon={<Truck className="size-4" />} label={t('metrics.missing')} value={formatQty(totals.missing)} />
      </HakEdisMetricGrid>

      <HakEdisPageSection className="wms-ops-bilginoglu-page-section--grid">
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
                      <span className="wms-ops-prelabel-panel__hint">{order.customerName ?? '-'}</span>
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
                      {!isCompletedView ? (
                        <span className="wms-ops-prelabel-panel__hint">{t('table.canCreate')}: {formatQty(order.canCreateNewBatchQty)}</span>
                      ) : null}
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
            iconOnlyActions
            actionsCellClassName="wms-ops-table-actions-col"
            defaultColumnWidths={HAK_EDIS_ORDER_COLUMN_WIDTHS}
            renderActionsCell={(order) => (
              <div className="wms-ops-row-actions">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="wms-ops-grid-icon-btn"
                  aria-label={t('common.view')}
                  title={t('common.view')}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedOrder(order);
                    setSelectedPlan(null);
                    setSelectedBatch(null);
                  }}
                >
                  <Eye className="size-3" />
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
      </HakEdisPageSection>
      </div>
    </OpsListPageShell>

      <Dialog open={bulkTransferPreviewOpen} onOpenChange={setBulkTransferPreviewOpen}>
        <HakEdisOpsDialogContent size="bulk">
          <div className="wms-ops-detail-dialog__header shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="wms-ops-detail-dialog__title">{t('bulkTransferPreview.title')}</DialogTitle>
              <DialogDescription className="wms-ops-detail-dialog__description">{t('bulkTransferPreview.description')}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="wms-ops-bilginoglu-detail__body">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <NeedCard label={t('bulkTransferPreview.metrics.orders')} value={formatQty(bulkTransferPreviewTotals.orderCount)} tone="slate" />
            <NeedCard label={t('bulkTransferPreview.metrics.eligible')} value={formatQty(bulkTransferPreviewTotals.eligibleCount)} tone="emerald" />
            <NeedCard label={t('bulkTransferPreview.metrics.remaining')} value={formatQty(bulkTransferPreviewTotals.remaining)} tone="blue" />
            <NeedCard label={t('bulkTransferPreview.metrics.available')} value={formatQty(bulkTransferPreviewTotals.available)} tone="cyan" />
            <NeedCard label={t('bulkTransferPreview.metrics.transferable')} value={formatQty(bulkTransferPreviewTotals.transferable)} tone="emerald" />
          </div>

          <HakEdisHintBanner>{t('bulkTransferPreview.warning')}</HakEdisHintBanner>

          <HakEdisOpsTableShell tall>
            <Table className="min-w-[1120px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead className="min-w-48">{t('table.order')}</TableHead>
                  <TableHead className="min-w-72">{t('table.customer')}</TableHead>
                  <TableHead className="text-right">{t('table.remaining')}</TableHead>
                  <TableHead className="text-right">{t('table.stock')}</TableHead>
                  <TableHead className="text-right">{t('table.canCreate')}</TableHead>
                  <TableHead className="text-right">{t('metrics.missing')}</TableHead>
                  <TableHead className="min-w-52">{t('bulkTransferPreview.table.decision')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkTransferPreviewOrders.map(({ order, availableQty, remainingQty, transferableQty, missingQty, decision }) => {
                  const orderHeaderId = order.orderHeaderId;
                  const expanded = expandedBulkTransferOrderIds.includes(orderHeaderId);

                  return (
                    <Fragment key={orderHeaderId}>
                      <TableRow>
                        <TableCell className="align-top">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="wms-ops-grid-icon-btn"
                            onClick={() => toggleBulkTransferOrder(orderHeaderId)}
                            aria-label={t('bulkTransferPreview.table.details')}
                          >
                            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                          </Button>
                        </TableCell>
                        <TableCell className="align-top font-semibold">{order.siparisNo}</TableCell>
                        <TableCell className="align-top">
                          <div className="font-semibold">{order.customerCode ?? '-'}</div>
                          <div className="mt-1 wms-ops-prelabel-panel__hint">{order.customerName ?? '-'}</div>
                        </TableCell>
                        <TableCell className="text-right align-top font-semibold">{formatQty(remainingQty)}</TableCell>
                        <TableCell className="text-right align-top font-semibold">{formatQty(availableQty)}</TableCell>
                        <TableCell className="text-right align-top font-semibold">{formatQty(transferableQty)}</TableCell>
                        <TableCell className="text-right align-top font-semibold">{formatQty(missingQty)}</TableCell>
                        <TableCell className="align-top">
                          <HakEdisFlagChip tone={decision === 'eligible' ? 'success' : decision === 'noBalance' ? 'warn' : 'default'}>
                            {t(`bulkTransferPreview.decisions.${decision}`)}
                          </HakEdisFlagChip>
                          <div className="mt-2 wms-ops-prelabel-panel__hint">
                            {decision === 'eligible'
                              ? t('bulkTransferPreview.table.willCreate', { qty: formatQty(transferableQty) })
                              : t('bulkTransferPreview.table.willSkip')}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded ? (
                        <TableRow>
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
          </HakEdisOpsTableShell>
          </div>
          <DialogFooter className="wms-ops-bilginoglu-detail__footer shrink-0">
            <OpsActionButton type="button" variant="secondary" onClick={() => setBulkTransferPreviewOpen(false)}>
              {t('common.cancel')}
            </OpsActionButton>
            <OpsActionButton
              type="button"
              variant="primary"
              disabled={!permission.canUpdate || bulkTransferPreviewTotals.eligibleCount === 0 || bulkTransferOrdersMutation.isPending}
              onClick={() => bulkTransferOrdersMutation.mutate(undefined, { onSuccess: () => setBulkTransferPreviewOpen(false) })}
            >
              {bulkTransferOrdersMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              {t('bulkTransferPreview.run', { count: bulkTransferPreviewTotals.eligibleCount })}
            </OpsActionButton>
          </DialogFooter>
        </HakEdisOpsDialogContent>
      </Dialog>

      <Dialog open={bulkShipmentPreviewOpen} onOpenChange={setBulkShipmentPreviewOpen}>
        <HakEdisOpsDialogContent size="bulk">
          <div className="wms-ops-detail-dialog__header shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="wms-ops-detail-dialog__title">{t('bulkShipmentPreview.title')}</DialogTitle>
              <DialogDescription className="wms-ops-detail-dialog__description">{t('bulkShipmentPreview.description')}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="wms-ops-bilginoglu-detail__body">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <NeedCard label={t('bulkShipmentPreview.metrics.orders')} value={formatQty(bulkShipmentPreviewTotals.orderCount)} tone="slate" />
            <NeedCard label={t('bulkShipmentPreview.metrics.eligible')} value={formatQty(bulkShipmentPreviewTotals.eligibleCount)} tone="emerald" />
            <NeedCard label={t('bulkShipmentPreview.metrics.remaining')} value={formatQty(bulkShipmentPreviewTotals.remaining)} tone="blue" />
            <NeedCard label={t('bulkShipmentPreview.metrics.ready')} value={formatQty(bulkShipmentPreviewTotals.ready)} tone="cyan" />
            <NeedCard label={t('bulkShipmentPreview.metrics.shippable')} value={formatQty(bulkShipmentPreviewTotals.shippable)} tone="emerald" />
          </div>

          <HakEdisHintBanner>{t('bulkShipmentPreview.warning')}</HakEdisHintBanner>

          <HakEdisOpsTableShell tall>
            <Table className="min-w-[1120px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead className="min-w-48">{t('table.order')}</TableHead>
                  <TableHead className="min-w-72">{t('table.customer')}</TableHead>
                  <TableHead className="text-right">{t('bulkShipmentPreview.table.remaining')}</TableHead>
                  <TableHead className="text-right">{t('bulkShipmentPreview.table.ready')}</TableHead>
                  <TableHead className="text-right">{t('bulkShipmentPreview.table.shippable')}</TableHead>
                  <TableHead className="text-right">{t('metrics.missing')}</TableHead>
                  <TableHead className="min-w-52">{t('bulkShipmentPreview.table.decision')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkShipmentPreviewOrders.map(({ order, readyQty, remainingToShipQty, shippableQty, missingQty, decision }) => {
                  const expanded = expandedBulkShipmentOrderIds.includes(order.id);

                  return (
                    <Fragment key={order.id}>
                      <TableRow>
                        <TableCell className="align-top">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="wms-ops-grid-icon-btn"
                            onClick={() => toggleBulkShipmentOrder(order.id)}
                            aria-label={t('bulkShipmentPreview.table.details')}
                          >
                            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                          </Button>
                        </TableCell>
                        <TableCell className="align-top font-semibold">{order.siparisNo}</TableCell>
                        <TableCell className="align-top">
                          <div className="font-semibold">{order.customerCode ?? '-'}</div>
                          <div className="mt-1 wms-ops-prelabel-panel__hint">{order.customerName ?? '-'}</div>
                        </TableCell>
                        <TableCell className="text-right align-top font-semibold">{formatQty(remainingToShipQty)}</TableCell>
                        <TableCell className="text-right align-top font-semibold">{formatQty(readyQty)}</TableCell>
                        <TableCell className="text-right align-top font-semibold">{formatQty(shippableQty)}</TableCell>
                        <TableCell className="text-right align-top font-semibold">{formatQty(missingQty)}</TableCell>
                        <TableCell className="align-top">
                          <HakEdisFlagChip tone={decision === 'eligible' ? 'success' : decision === 'fullShipmentWaiting' ? 'warn' : 'default'}>
                            {t(`bulkShipmentPreview.decisions.${decision}`)}
                          </HakEdisFlagChip>
                          <div className="mt-2 wms-ops-prelabel-panel__hint">
                            {decision === 'eligible'
                              ? t('bulkShipmentPreview.table.willCreate', { qty: formatQty(shippableQty) })
                              : decision === 'fullShipmentWaiting'
                                ? t('bulkShipmentPreview.table.fullShipmentWaiting')
                                : t('bulkShipmentPreview.table.willSkip')}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded ? (
                        <TableRow>
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
          </HakEdisOpsTableShell>
          </div>
          <DialogFooter className="wms-ops-bilginoglu-detail__footer shrink-0">
            <OpsActionButton type="button" variant="secondary" onClick={() => setBulkShipmentPreviewOpen(false)}>
              {t('common.cancel')}
            </OpsActionButton>
            <OpsActionButton
              type="button"
              variant="primary"
              disabled={!permission.canUpdate || bulkShipmentPreviewTotals.eligibleCount === 0 || bulkShipmentOrdersMutation.isPending}
              onClick={() => bulkShipmentOrdersMutation.mutate(undefined, { onSuccess: () => setBulkShipmentPreviewOpen(false) })}
            >
              {bulkShipmentOrdersMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />}
              {t('bulkShipmentPreview.run', { count: bulkShipmentPreviewTotals.eligibleCount })}
            </OpsActionButton>
          </DialogFooter>
        </HakEdisOpsDialogContent>
      </Dialog>

      <Dialog open={selectedOrder != null} onOpenChange={(open) => { if (!open) { setSelectedOrder(null); setSelectedPlan(null); setSelectedBatch(null); setSelectedActivity(null); } }}>
        <HakEdisOpsDialogContent>
          <div className="wms-ops-detail-dialog__header shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="wms-ops-detail-dialog__title">{t('detail.title', { order: selectedOrder?.siparisNo })}</DialogTitle>
              <DialogDescription className="wms-ops-detail-dialog__description">
                {selectedOrderIsCompleted ? t('detail.completedDescription') : t('detail.description')}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="wms-ops-bilginoglu-detail__body">
          {selectedOrder ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <HakEdisNeedCard label={t('need.required')} value={formatQty(selectedOrderNeed.required || selectedOrder.totalRequiredQty)} />
                {selectedOrderIsCompleted ? (
                  <HakEdisNeedCard label={t('metrics.ready')} value={formatQty(selectedOrder.totalReadyForShipmentQty)} tone="success" />
                ) : (
                  <HakEdisNeedCard label={t('need.canCreate')} value={formatQty(selectedOrderNeed.canCreate || selectedOrder.canCreateNewBatchQty)} tone="success" />
                )}
                <HakEdisNeedCard label={t('need.allocated')} value={formatQty(selectedOrder.totalAllocatedQty)} tone="info" />
                <HakEdisNeedCard label={t('need.missing')} value={formatQty(selectedOrderNeed.missing || selectedOrder.totalMissingQty)} tone="warn" />
              </div>
              <div className="wms-ops-detail-panel">
                <div className="wms-ops-detail-panel--rows p-4">
                  <HakEdisDetailRow label={t('table.hakEdisRequired')}>
                    {selectedOrder.hakEdisFlag === 'E' ? t('common.yes') : t('common.no')}
                  </HakEdisDetailRow>
                  <HakEdisDetailRow label={t('table.transferAll')}>
                    {selectedOrder.transferAllFlag === 'E' ? t('common.yes') : t('common.no')}
                  </HakEdisDetailRow>
                  <HakEdisDetailRow label={t('table.orderDetail')}>
                    {selectedOrder.orderDetail ?? '-'}
                  </HakEdisDetailRow>
                </div>
              </div>
            </>
          ) : null}
          <HakEdisDetailPanel title={t('detail.lines')}>
            <div className="grid gap-2">
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
              {!plansQuery.isLoading && plans.length === 0 ? <span className="wms-ops-prelabel-panel__hint">{t('detail.noLines')}</span> : null}
            </div>
          </HakEdisDetailPanel>
          <Accordion type="multiple" defaultValue={['hakEdis']} className="wms-ops-detail-accordion w-full">
            <AccordionItem value="hakEdis">
              <AccordionTrigger className="hover:no-underline">
                <div className="wms-ops-detail-accordion__head">
                  <span className="wms-ops-detail-accordion__title">{t('activity.hakEdisSection')}</span>
                  <span className="wms-ops-detail-accordion__meta">
                    {t('activity.datCount', { count: activitySummary.datCount })} / {t('activity.completedCount', { count: hakEdisActivities.filter((activity) => activity.status === 'Completed' || activity.isCompleted).length })}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {transferPreviewQuery.isLoading ? (
                  <HakEdisOpsEmptyState icon={<Loader2 className="size-4 animate-spin" />}>{t('loading')}</HakEdisOpsEmptyState>
                ) : transferPreview ? (
                  <HakEdisDetailPanel
                    title={t('transferPreview.title')}
                    actions={
                      selectedOrderIsCompleted ? (
                        <HakEdisFlagChip tone="info">{t('activity.readOnlyDetail')}</HakEdisFlagChip>
                      ) : (
                        <>
                          <OpsActionButton asChild type="button" variant="secondary">
                            <Link to="/service-allocation/bilginoglu-hakedis/pending-transfers">{t('activity.pendingTransfers')}</Link>
                          </OpsActionButton>
                          <OpsActionButton asChild type="button" variant="secondary">
                            <Link to="/service-allocation/bilginoglu-hakedis/pending-shipments">{t('activity.pendingShipments')}</Link>
                          </OpsActionButton>
                        </>
                      )
                    }
                  >
                    <p className="mb-3 wms-ops-prelabel-panel__hint">{t('transferPreview.description')}</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <HakEdisNeedCard label={t('transferPreview.orderQty')} value={formatQty(transferPreview.totalOrderQty)} />
                      <HakEdisNeedCard label={t('transferPreview.processedQty')} value={formatQty(transferPreview.totalProcessedQty)} tone="info" />
                      <HakEdisNeedCard label={t('transferPreview.transferableQty')} value={formatQty(transferPreview.totalTransferableQty)} tone="success" />
                      <HakEdisNeedCard label={t('transferPreview.shippableQty')} value={formatQty(transferPreview.totalShippableQty)} tone="info" />
                      <HakEdisNeedCard label={t('transferPreview.missingQty')} value={formatQty(transferPreview.totalMissingQty)} tone="warn" />
                    </div>
                  </HakEdisDetailPanel>
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

            <AccordionItem value="shipment">
              <AccordionTrigger className="hover:no-underline">
                <div className="wms-ops-detail-accordion__head">
                  <span className="wms-ops-detail-accordion__title">{t('activity.shipmentSection')}</span>
                  <span className="wms-ops-detail-accordion__meta">{t('activity.shipmentCount', { count: activitySummary.shipmentCount })}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
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
          <Accordion type="single" collapsible className="wms-ops-detail-accordion w-full">
            <AccordionItem value="batches">
              <AccordionTrigger className="hover:no-underline">
                <div className="wms-ops-detail-accordion__head">
                  <span className="wms-ops-detail-accordion__title">{t('detail.batch')}</span>
                  <span className="wms-ops-detail-accordion__meta">{t('detail.steps')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <HakEdisOpsTableShell>
              <Table className="min-w-[680px]">
                <TableHeader>
          <TableRow>
            <TableHead>{t('detail.batch')}</TableHead>
            <TableHead className="text-right">{t('detail.quantity')}</TableHead>
            <TableHead>{t('detail.stage')}</TableHead>
            <TableHead>{t('detail.warehouseSourceTypes')}</TableHead>
            <TableHead className="wms-ops-table-actions-col text-center">{t('common.actions')}</TableHead>
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
                          className="wms-ops-grid-icon-btn"
                          aria-label={t('common.view')}
                          title={t('common.view')}
                          onClick={() => setSelectedBatch(batch)}
                        >
                          <Eye className="size-3" />
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
            </HakEdisOpsTableShell>
            <HakEdisDetailPanel
              title={t('detail.steps')}
              actions={selectedBatch ? <HakEdisFlagChip tone="info">{t('activity.readOnlyDetail')}</HakEdisFlagChip> : null}
            >
              {selectedBatch == null ? (
                <p className="wms-ops-prelabel-panel__hint">{t('detail.chooseBatch')}</p>
              ) : stepsQuery.isLoading ? (
                <HakEdisOpsEmptyState icon={<Loader2 className="size-4 animate-spin" />}>{t('loading')}</HakEdisOpsEmptyState>
              ) : (
                <div className="space-y-2">
                  {(stepsQuery.data ?? []).map((step) => (
                    <HakEdisStepCard
                      key={step.id}
                      title={`${step.sequenceNo}. ${step.stepType}`}
                      meta={`${formatQty(step.quantity)} ${t('common.unit')} / ${step.sourceType ?? '-'} #${step.sourceHeaderId ?? '-'}`}
                      badge={statusBadge(step.status, statusLabel(step.status), true)}
                      note={step.note}
                    />
                  ))}
                </div>
              )}
            </HakEdisDetailPanel>
          </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          </div>
        </HakEdisOpsDialogContent>
      </Dialog>

      <Dialog open={selectedActivity != null} onOpenChange={(open) => { if (!open) setSelectedActivity(null); }}>
        <HakEdisOpsDialogContent>
          <div className="wms-ops-detail-dialog__header shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="wms-ops-detail-dialog__title">
                {t('activity.detailTitle', {
                  step: selectedActivity ? statusLabel(selectedActivity.stepType) : '-',
                })}
              </DialogTitle>
              <DialogDescription className="wms-ops-detail-dialog__description">{t('activity.detailDescription')}</DialogDescription>
            </DialogHeader>
          </div>

          {selectedActivity ? (
            <div className="wms-ops-bilginoglu-detail__body space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
                <HakEdisNeedCard label={t('activity.batch')} value={selectedActivity.batchNo ?? '-'} />
                <HakEdisNeedCard label={t('activity.quantity')} value={formatQty(selectedActivity.quantity)} tone="info" />
                <HakEdisNeedCard
                  label={t('activity.status')}
                  value={statusLabel(selectedActivity.status)}
                  tone={selectedActivity.isCompleted ? 'success' : 'warn'}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <HakEdisDetailPanel title={t('activity.whoCompleted')}>
                  <div className="wms-ops-detail-panel--rows">
                    <HakEdisDetailRow label={t('activity.actor')}>{selectedActivity.actionByUserName ?? '-'}</HakEdisDetailRow>
                    <HakEdisDetailRow label={t('activity.actionDate')}>{formatDate(selectedActivity.actionDate)}</HakEdisDetailRow>
                    <HakEdisDetailRow label={t('activity.completionDate')}>{formatDate(selectedActivity.completionDate)}</HakEdisDetailRow>
                    <HakEdisDetailRow label={t('activity.collectors')}>{selectedActivity.collectedByUsers ?? '-'}</HakEdisDetailRow>
                    <HakEdisDetailRow label={t('activity.collectorCountLabel')}>
                      {t('activity.collectorCount', { count: selectedActivity.collectedUserCount })}
                    </HakEdisDetailRow>
                  </div>
                </HakEdisDetailPanel>

                <HakEdisDetailPanel title={t('activity.documentTrace')}>
                  <div className="wms-ops-detail-panel--rows">
                    <HakEdisDetailRow label={t('activity.document')}>{selectedActivity.documentNo ?? '-'}</HakEdisDetailRow>
                    <HakEdisDetailRow label={t('activity.series')}>{selectedActivity.documentSeries ?? '-'}</HakEdisDetailRow>
                    <HakEdisDetailRow label={t('activity.type')}>{selectedActivity.documentType ?? '-'}</HakEdisDetailRow>
                    <HakEdisDetailRow label={t('activity.source')}>
                      {`${selectedActivity.sourceType ?? '-'} #${selectedActivity.sourceHeaderId ?? '-'}`}
                    </HakEdisDetailRow>
                    <HakEdisDetailRow label={t('activity.erp')}>
                      {selectedActivity.erpReferenceNumber ?? selectedActivity.erpIntegrationStatus ?? '-'}
                    </HakEdisDetailRow>
                    <HakEdisDetailRow label={t('activity.erpDate')}>{formatDate(selectedActivity.erpIntegrationDate)}</HakEdisDetailRow>
                  </div>
                </HakEdisDetailPanel>
              </div>

              <HakEdisDetailPanel title={t('activity.stockTrace')}>
                <div className="wms-ops-detail-panel--rows">
                  <HakEdisDetailRow label={t('detail.stock')}>{selectedActivity.stockCode ?? '-'}</HakEdisDetailRow>
                  <HakEdisDetailRow label={t('activity.stockName')}>{selectedActivity.stockName ?? '-'}</HakEdisDetailRow>
                  <HakEdisDetailRow label={t('table.order')}>{selectedActivity.siparisNo ?? '-'}</HakEdisDetailRow>
                  <HakEdisDetailRow label={t('activity.orderLineId')}>{String(selectedActivity.orderId ?? '-')}</HakEdisDetailRow>
                </div>
                {selectedActivity.note ? (
                  <div className="mt-3 wms-ops-hint-banner">{selectedActivity.note}</div>
                ) : null}
              </HakEdisDetailPanel>
            </div>
          ) : null}
        </HakEdisOpsDialogContent>
      </Dialog>
    </>
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
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="wms-ops-prelabel-panel__hint">{activity.batchNo}</span>
          {statusBadge(activity.status, statusLabel(activity.status), true)}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{documentText}</div>
        <div className="wms-ops-prelabel-panel__hint">
          {t('activity.series')}: {activity.documentSeries ?? '-'} / {t('activity.type')}: {activity.documentType ?? '-'}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{erpText}</div>
        <div className="wms-ops-prelabel-panel__hint">{formatDate(activity.erpIntegrationDate)}</div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{activity.actionByUserName ?? '-'}</div>
        <div className="wms-ops-prelabel-panel__hint">{formatDate(activity.actionDate ?? activity.completionDate)}</div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{activity.collectedByUsers ?? '-'}</div>
        <div className="wms-ops-prelabel-panel__hint">{t('activity.collectorCount', { count: activity.collectedUserCount })}</div>
      </TableCell>
      <TableCell className="text-right">
        <div className="font-semibold">{formatQty(activity.quantity)}</div>
        <div className="wms-ops-prelabel-panel__hint">{activity.stockCode ?? '-'}</div>
      </TableCell>
      <TableCell className="text-center">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="wms-ops-grid-icon-btn"
          aria-label={t('activity.openDetail')}
          title={t('activity.openDetail')}
          onClick={() => onSelect(activity)}
        >
          <Eye className="size-3" />
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
      <HakEdisOpsEmptyState icon={<Loader2 className="size-4 animate-spin" />}>{t('loading')}</HakEdisOpsEmptyState>
    );
  }

  if (activities.length === 0) {
    return (
      <HakEdisOpsEmptyState icon={<FileClock className="size-4" />}>{emptyText}</HakEdisOpsEmptyState>
    );
  }

  return (
    <HakEdisOpsTableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('activity.step')}</TableHead>
            <TableHead>{t('activity.document')}</TableHead>
            <TableHead>{t('activity.erp')}</TableHead>
            <TableHead>{t('activity.actor')}</TableHead>
            <TableHead>{t('activity.collectors')}</TableHead>
            <TableHead className="text-right">{t('detail.quantity')}</TableHead>
            <TableHead className="wms-ops-table-actions-col text-center">{t('common.actions')}</TableHead>
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
    </HakEdisOpsTableShell>
  );
}

function PlanLineChip({ plan, selected, onSelect }: { plan: BilginogluHakEdisPlan; selected: boolean; onSelect: () => void }): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const requiredQty = Math.max(0, plan.remainingOrderQty - plan.allocatedToHakEdisQty - plan.shippedQty);
  const usableQty = Math.min(requiredQty, Math.max(0, plan.warehouseAvailableQty));
  const hasUsableQty = usableQty > 0.0001;

  return (
    <HakEdisPlanChip selected={selected} onSelect={onSelect}>
      <span className="wms-ops-bilginoglu-plan-chip__title">{plan.stockCode ?? t('detail.stock')}</span>
      <span className="wms-ops-bilginoglu-plan-chip__subtitle">{plan.stockName ?? '-'}</span>
      <div className="wms-ops-bilginoglu-plan-chip__facts">
        <div className="wms-ops-bilginoglu-plan-fact">
          <span className="wms-ops-bilginoglu-plan-fact__label">{t('need.required')}</span>
          <span className="wms-ops-bilginoglu-plan-fact__value">{formatQty(requiredQty)}</span>
        </div>
        <div className="wms-ops-bilginoglu-plan-fact">
          <span className="wms-ops-bilginoglu-plan-fact__label">{t('detail.sourceWarehouse')}</span>
          <span className="wms-ops-bilginoglu-plan-fact__value">{plan.sourceWarehouseCode ?? '-'}</span>
        </div>
        <div className="wms-ops-bilginoglu-plan-fact">
          <span className="wms-ops-bilginoglu-plan-fact__label">{t('detail.hakEdisWarehouse')}</span>
          <span className="wms-ops-bilginoglu-plan-fact__value">{plan.hakEdisWarehouseCode ?? '-'}</span>
        </div>
        <div className={cn('wms-ops-bilginoglu-plan-fact', hasUsableQty ? 'wms-ops-bilginoglu-plan-fact--success' : 'wms-ops-bilginoglu-plan-fact--warn')}>
          <span className="wms-ops-bilginoglu-plan-fact__label">{t('detail.usableBalance')}</span>
          <span className="wms-ops-bilginoglu-plan-fact__value">
            {hasUsableQty
              ? t('detail.willUseQty', { qty: formatQty(usableQty), warehouse: plan.sourceWarehouseCode ?? '-' })
              : t('detail.noUsableBalance', { warehouse: plan.sourceWarehouseCode ?? '-' })}
          </span>
        </div>
      </div>
    </HakEdisPlanChip>
  );
}

function BulkTransferOrderLines({ orderHeaderId }: { orderHeaderId: number }): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const previewQuery = useBilginogluHakEdisTransferPreviewQuery(orderHeaderId);
  const lines = previewQuery.data?.lines ?? [];

  if (previewQuery.isLoading) {
    return <HakEdisOpsEmptyState icon={<Loader2 className="size-4 animate-spin" />}>{t('loading')}</HakEdisOpsEmptyState>;
  }

  if (previewQuery.isError) {
    return <HakEdisHintBanner>{previewQuery.error instanceof Error ? previewQuery.error.message : t('bulkTransferPreview.error')}</HakEdisHintBanner>;
  }

  if (lines.length === 0) {
    return <HakEdisOpsEmptyState>{t('bulkTransferPreview.empty')}</HakEdisOpsEmptyState>;
  }

  return (
    <HakEdisOpsTableShell>
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow>
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
              <TableRow key={line.planId}>
                <TableCell className="align-top">
                  <div className="font-semibold">{line.stockCode ?? '-'}</div>
                  <div className="mt-1 wms-ops-prelabel-panel__hint">{line.stockName ?? '-'}</div>
                  {line.yapKod ? <div className="mt-1 wms-ops-prelabel-panel__hint">{t('bulkTransferPreview.table.yapCode')} {line.yapKod}</div> : null}
                </TableCell>
                <TableCell className="align-top">
                  <HakEdisWarehouseFlow
                    from={String(line.sourceWarehouseCode ?? '-')}
                    to={String(line.hakEdisWarehouseCode ?? '-')}
                  />
                  {line.sameWarehouse ? <div className="mt-1 wms-ops-prelabel-panel__hint">{t('transferPreview.sameWarehouse')}</div> : null}
                </TableCell>
                <TableCell className="text-right align-top font-semibold">{formatQty(line.orderQty)}</TableCell>
                <TableCell className="text-right align-top font-semibold">{formatQty(line.processedQty)}</TableCell>
                <TableCell className="text-right align-top font-semibold">{formatQty(line.remainingOrderQty)}</TableCell>
                <TableCell className="text-right align-top font-semibold">{formatQty(line.warehouseAvailableQty)}</TableCell>
                <TableCell className="text-right align-top font-semibold">{formatQty(line.transferableQty)}</TableCell>
                <TableCell className="text-right align-top font-semibold">{formatQty(line.missingQty)}</TableCell>
                <TableCell className="align-top">
                  <HakEdisFlagChip tone={line.willCreateTransfer ? 'success' : decision === 'noBalance' ? 'warn' : 'default'}>
                    {t(`bulkTransferPreview.decisions.${decision}`)}
                  </HakEdisFlagChip>
                  <div className="mt-2 wms-ops-prelabel-panel__hint">
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
    </HakEdisOpsTableShell>
  );
}

function BulkShipmentOrderLines({ orderHeaderId }: { orderHeaderId: number }): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const previewQuery = useBilginogluHakEdisTransferPreviewQuery(orderHeaderId);
  const lines = previewQuery.data?.lines ?? [];

  if (previewQuery.isLoading) {
    return <HakEdisOpsEmptyState icon={<Loader2 className="size-4 animate-spin" />}>{t('loading')}</HakEdisOpsEmptyState>;
  }

  if (previewQuery.isError) {
    return <HakEdisHintBanner>{previewQuery.error instanceof Error ? previewQuery.error.message : t('bulkShipmentPreview.error')}</HakEdisHintBanner>;
  }

  if (lines.length === 0) {
    return <HakEdisOpsEmptyState>{t('bulkShipmentPreview.empty')}</HakEdisOpsEmptyState>;
  }

  return (
    <HakEdisOpsTableShell>
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow>
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
              <TableRow key={line.planId}>
                <TableCell className="align-top">
                  <div className="font-semibold">{line.stockCode ?? '-'}</div>
                  <div className="mt-1 wms-ops-prelabel-panel__hint">{line.stockName ?? '-'}</div>
                  {line.yapKod ? <div className="mt-1 wms-ops-prelabel-panel__hint">{t('bulkTransferPreview.table.yapCode')} {line.yapKod}</div> : null}
                </TableCell>
                <TableCell className="text-right align-top font-semibold">{formatQty(line.orderQty)}</TableCell>
                <TableCell className="text-right align-top font-semibold">{formatQty(line.processedQty)}</TableCell>
                <TableCell className="text-right align-top font-semibold">{formatQty(line.remainingOrderQty)}</TableCell>
                <TableCell className="text-right align-top font-semibold">{formatQty(line.shippableQty)}</TableCell>
                <TableCell className="text-right align-top font-semibold">{formatQty(line.shippableQty)}</TableCell>
                <TableCell className="text-right align-top font-semibold">{formatQty(Math.max(0, line.remainingOrderQty - line.shippableQty))}</TableCell>
                <TableCell className="align-top">
                  <HakEdisFlagChip tone={decision === 'eligible' ? 'success' : 'default'}>
                    {t(`bulkShipmentPreview.decisions.${decision}`)}
                  </HakEdisFlagChip>
                  <div className="mt-2 wms-ops-prelabel-panel__hint">
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
    </HakEdisOpsTableShell>
  );
}

function NeedCard({ label, value, tone }: { label: string; value: string; tone: 'slate' | 'cyan' | 'emerald' | 'blue' | 'amber' }): ReactElement {
  const mappedTone =
    tone === 'emerald'
      ? 'success'
      : tone === 'blue' || tone === 'cyan'
        ? 'info'
        : tone === 'amber'
          ? 'warn'
          : 'default';

  return <HakEdisNeedCard label={label} value={value} tone={mappedTone} />;
}
