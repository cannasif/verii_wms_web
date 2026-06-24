import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { MoveRight, RefreshCcw } from 'lucide-react';
import type { TFunction } from 'i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { OpsActionButton, OpsInput, OpsListPageShell, OpsServiceEyebrow, OpsTextarea, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  HAK_EDIS_PENDING_COLUMN_WIDTHS,
  HakEdisFlagChip,
  HakEdisNeedCard,
  HakEdisOpsDialogContent,
  HakEdisPageSection,
  HakEdisViewNav,
  HakEdisWarehouseFlow,
  hakEdisPendingActionBadge,
  hakEdisPendingStageBadge,
} from './bilginoglu-hakedis-ops-ui';
import { getPagedRange } from '@/lib/paged';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { useUIStore } from '@/stores/ui-store';
import { bilginogluHakEdisApi } from '../api/bilginogluHakEdisApi';
import { bilginogluHakEdisQueryKeys } from '../hooks/useBilginogluHakEdisQueries';
import type { BilginogluHakEdisMoveTarget, BilginogluHakEdisPendingOperation } from '../types/bilginoglu-hakedis.types';

type QueueType = 'transfer' | 'shipment';
type PendingColumnKey =
  | 'siparisNo'
  | 'customer'
  | 'stock'
  | 'warehouseFlow'
  | 'quantity'
  | 'currentStage'
  | 'pendingAction'
  | 'documents'
  | 'updatedAt';

function mapSortBy(value: PendingColumnKey): string {
  switch (value) {
    case 'siparisNo':
      return 'SiparisNo';
    case 'customer':
      return 'CustomerCode';
    case 'stock':
      return 'StockCode';
    case 'quantity':
      return 'Quantity';
    case 'currentStage':
      return 'CurrentStage';
    case 'updatedAt':
      return 'UpdatedDate';
    default:
      return 'UpdatedDate';
  }
}

function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(value ?? 0);
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}

function PendingOperationsPage({ queueType }: { queueType: QueueType }): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const queryClient = useQueryClient();
  const { setPageTitle } = useUIStore();
  const [moveSource, setMoveSource] = useState<BilginogluHakEdisPendingOperation | null>(null);
  const [targetPlanId, setTargetPlanId] = useState('');
  const [moveQty, setMoveQty] = useState('');
  const [moveReason, setMoveReason] = useState('');
  const pageKey = queueType === 'transfer'
    ? 'bilginoglu-hakedis-pending-transfers'
    : 'bilginoglu-hakedis-pending-shipments';
  const pageTitle = queueType === 'transfer'
    ? t('pendingOperations.transfer.title')
    : t('pendingOperations.shipment.title');
  const pageDescription = queueType === 'transfer'
    ? t('pendingOperations.transfer.description')
    : t('pendingOperations.shipment.description');

  const pagedGrid = usePagedDataGrid<PendingColumnKey>({
    pageKey,
    defaultSortBy: 'updatedAt',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(pageTitle);
    return () => setPageTitle(null);
  }, [pageTitle, setPageTitle]);

  const query = useQuery({
    queryKey: queueType === 'transfer'
      ? bilginogluHakEdisQueryKeys.pendingHakEdisTransfers(pagedGrid.queryParams)
      : bilginogluHakEdisQueryKeys.pendingShipmentOrders(pagedGrid.queryParams),
    queryFn: () => queueType === 'transfer'
      ? bilginogluHakEdisApi.getPendingHakEdisTransfers(pagedGrid.queryParams)
      : bilginogluHakEdisApi.getPendingShipmentOrders(pagedGrid.queryParams),
  });

  const rows = query.data?.data ?? [];
  const range = getPagedRange(query.data, 1);

  const moveTargetsQuery = useQuery({
    queryKey: bilginogluHakEdisQueryKeys.moveTargets(moveSource?.batchId ?? null),
    queryFn: () => bilginogluHakEdisApi.getMoveTargets(moveSource?.batchId ?? 0),
    enabled: queueType === 'shipment' && !!moveSource,
  });

  const moveTargets = moveTargetsQuery.data ?? [];
  const selectedTarget = moveTargets.find((target) => String(target.planId) === targetPlanId) ?? null;

  useEffect(() => {
    if (!moveSource || moveTargets.length === 0) {
      return;
    }

    const firstTarget = moveTargets[0];
    setTargetPlanId(String(firstTarget.planId));
    setMoveQty(String(Math.min(moveSource.quantity, firstTarget.availableToMoveQty)));
  }, [moveSource, moveTargets]);

  const moveMutation = useMutation({
    mutationFn: () => {
      if (!moveSource || !selectedTarget) {
        throw new Error(t('pendingOperations.move.validation.targetRequired'));
      }

      const quantity = Number(moveQty);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(t('pendingOperations.move.validation.quantityRequired'));
      }

      return bilginogluHakEdisApi.moveShipmentAllocation(moveSource.batchId, {
        targetPlanId: selectedTarget.planId,
        quantity,
        reason: moveReason.trim() || null,
      });
    },
    onSuccess: async (result) => {
      toast.success(t('pendingOperations.move.success', {
        qty: formatNumber(result.movedQty),
        order: result.targetPlan.siparisNo,
      }));
      setMoveSource(null);
      setTargetPlanId('');
      setMoveQty('');
      setMoveReason('');
      await queryClient.invalidateQueries({ queryKey: bilginogluHakEdisQueryKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('pendingOperations.move.error')),
  });

  const columns = useMemo<PagedDataGridColumn<PendingColumnKey>[]>(() => [
    { key: 'siparisNo', label: t('pendingOperations.table.order') },
    { key: 'customer', label: t('pendingOperations.table.customer') },
    { key: 'stock', label: t('pendingOperations.table.stock') },
    { key: 'warehouseFlow', label: t('pendingOperations.table.warehouseFlow'), sortable: false },
    { key: 'quantity', label: t('pendingOperations.table.quantity'), headClassName: 'wms-ops-bilginoglu-pending-col--qty wms-ops-table-center-col', cellClassName: 'wms-ops-bilginoglu-pending-col--qty wms-ops-table-center-col' },
    {
      key: 'currentStage',
      label: t('pendingOperations.table.stage'),
      headClassName: 'wms-ops-bilginoglu-pending-col--stage wms-ops-table-center-col',
      cellClassName: 'wms-ops-bilginoglu-pending-col--stage wms-ops-table-center-col',
    },
    {
      key: 'pendingAction',
      label: t('pendingOperations.table.pendingAction'),
      sortable: false,
      headClassName: 'wms-ops-bilginoglu-pending-col--action wms-ops-table-center-col',
      cellClassName: 'wms-ops-bilginoglu-pending-col--action wms-ops-table-center-col',
    },
    {
      key: 'documents',
      label: t('pendingOperations.table.documents'),
      sortable: false,
      headClassName: 'wms-ops-bilginoglu-pending-col--documents',
      cellClassName: 'wms-ops-bilginoglu-pending-col--documents',
    },
    { key: 'updatedAt', label: t('pendingOperations.table.updatedAt'), headClassName: 'wms-ops-bilginoglu-pending-col--updated', cellClassName: 'wms-ops-bilginoglu-pending-col--updated' },
  ], [t]);

  const renderStage = (value: string): string => t(`status.${value}`, { defaultValue: value });
  const renderAction = (value: string): string => t(`pendingOperations.actions.${value}`, { defaultValue: value });

  return (
    <>
    <OpsListPageShell
      className="wms-ops-bilginoglu-list wms-ops-bilginoglu-pending-list"
      eyebrow={<OpsServiceEyebrow module={t('breadcrumb.module')} />}
      title={pageTitle}
      description={pageDescription}
      actions={(
        <OpsActionButton type="button" variant="secondary" onClick={() => void query.refetch()}>
          <RefreshCcw className="size-4" />
          {t('actions.refresh')}
        </OpsActionButton>
      )}
    >
      <div className="wms-ops-bilginoglu-page">
        <HakEdisViewNav
          active={queueType === 'transfer' ? 'open' : 'completed'}
          openLabel={t('pendingOperations.transfer.nav')}
          completedLabel={t('pendingOperations.shipment.nav')}
          openHref="/service-allocation/bilginoglu-hakedis/pending-transfers"
          completedHref="/service-allocation/bilginoglu-hakedis/pending-shipments"
        />

        <HakEdisPageSection className="wms-ops-bilginoglu-page-section--grid">
      <PagedDataGrid<BilginogluHakEdisPendingOperation, PendingColumnKey>
            variant="ops"
            pageKey={pageKey}
            columns={columns}
            rows={rows}
            rowKey={(row) => row.batchId}
            defaultColumnWidths={HAK_EDIS_PENDING_COLUMN_WIDTHS}
            iconOnlyActions={queueType === 'shipment'}
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'siparisNo':
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{row.siparisNo}</span>
                      <span className="wms-ops-prelabel-panel__hint">{row.batchNo}</span>
                    </div>
                  );
                case 'customer':
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{row.customerCode ?? '-'}</span>
                      <span className="wms-ops-prelabel-panel__hint">{row.customerName ?? '-'}</span>
                    </div>
                  );
                case 'stock':
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{row.stockCode ?? '-'}</span>
                      <span className="wms-ops-prelabel-panel__hint">{row.stockName ?? '-'}</span>
                      {row.yapKod ? <span className="wms-ops-prelabel-panel__hint">{row.yapKod}</span> : null}
                    </div>
                  );
                case 'warehouseFlow':
                  return (
                    <HakEdisWarehouseFlow
                      from={String(row.sourceWarehouseCode ?? '-')}
                      to={String(row.hakEdisWarehouseCode ?? '-')}
                    />
                  );
                case 'quantity':
                  return <span className="font-semibold">{formatNumber(row.quantity)}</span>;
                case 'currentStage':
                  return (
                    <div className="flex min-w-0 justify-center">
                      {hakEdisPendingStageBadge(renderStage(row.currentStage))}
                    </div>
                  );
                case 'pendingAction':
                  return (
                    <div className="flex min-w-0 justify-center">
                      {hakEdisPendingActionBadge(renderAction(row.pendingAction))}
                    </div>
                  );
                case 'documents':
                  return (
                    <div className="flex flex-col gap-1">
                      {row.replenishmentToIntermediateHeaderId ? (
                        <HakEdisFlagChip tone="info" className="wms-ops-bilginoglu-pending-doc-chip">
                          {t('pendingOperations.documentLinks.replenishmentToIntermediate')} #{row.replenishmentToIntermediateHeaderId}
                        </HakEdisFlagChip>
                      ) : null}
                      {row.replenishmentToOrderWarehouseHeaderId ? (
                        <HakEdisFlagChip tone="info" className="wms-ops-bilginoglu-pending-doc-chip">
                          {t('pendingOperations.documentLinks.replenishmentToOrderWarehouse')} #{row.replenishmentToOrderWarehouseHeaderId}
                        </HakEdisFlagChip>
                      ) : null}
                      {row.transferToHakEdisHeaderId ? (
                        <HakEdisFlagChip tone="info" className="wms-ops-bilginoglu-pending-doc-chip">
                          {t('pendingOperations.documentLinks.transferToHakEdis')} #{row.transferToHakEdisHeaderId}
                        </HakEdisFlagChip>
                      ) : null}
                      {row.returnFromHakEdisHeaderId ? (
                        <HakEdisFlagChip tone="info" className="wms-ops-bilginoglu-pending-doc-chip">
                          {t('pendingOperations.documentLinks.returnFromHakEdis')} #{row.returnFromHakEdisHeaderId}
                        </HakEdisFlagChip>
                      ) : null}
                      {row.shipmentHeaderId ? (
                        <HakEdisFlagChip tone="success" className="wms-ops-bilginoglu-pending-doc-chip">
                          {t('pendingOperations.documentLinks.shipment')} #{row.shipmentHeaderId}
                        </HakEdisFlagChip>
                      ) : null}
                      {!row.replenishmentToIntermediateHeaderId && !row.replenishmentToOrderWarehouseHeaderId && !row.transferToHakEdisHeaderId && !row.returnFromHakEdisHeaderId && !row.shipmentHeaderId ? '-' : null}
                    </div>
                  );
                case 'updatedAt':
                  return formatDate(row.updatedDate ?? row.createdDate);
                default:
                  return '-';
              }
            }}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            isLoading={query.isLoading}
            isError={query.isError}
            errorText={query.error instanceof Error ? query.error.message : t('pendingOperations.error')}
            emptyText={t('pendingOperations.empty')}
            pageSize={query.data?.pageSize ?? pagedGrid.pageSize}
            pageSizeOptions={pagedGrid.pageSizeOptions}
            onPageSizeChange={pagedGrid.handlePageSizeChange}
            pageNumber={pagedGrid.getDisplayPageNumber(query.data)}
            totalPages={query.data?.totalPages ?? 0}
            hasPreviousPage={query.data?.hasPreviousPage ?? false}
            hasNextPage={query.data?.hasNextPage ?? false}
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
              placeholder: t('pendingOperations.searchPlaceholder'),
            }}
            minTableWidthClassName="min-w-[1240px]"
            actionsHeaderLabel={queueType === 'shipment' ? t('common.actions') : undefined}
            actionsCellClassName="wms-ops-table-actions-col"
            renderActionsCell={queueType === 'shipment'
              ? (row) => (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn"
                  aria-label={t('pendingOperations.move.open')}
                  onClick={() => {
                    setMoveSource(row);
                    setTargetPlanId('');
                    setMoveQty('');
                    setMoveReason('');
                  }}
                >
                  <MoveRight className="size-3" />
                </Button>
              )
              : undefined}
          />
        </HakEdisPageSection>
      </div>
    </OpsListPageShell>

      <Dialog open={!!moveSource} onOpenChange={(open) => {
        if (!open) {
          setMoveSource(null);
          setTargetPlanId('');
          setMoveQty('');
          setMoveReason('');
        }
      }}>
        <HakEdisOpsDialogContent size="bulk">
          <div className="wms-ops-detail-dialog__header shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="wms-ops-detail-dialog__title">{t('pendingOperations.move.title')}</DialogTitle>
              <DialogDescription className="wms-ops-detail-dialog__description">{t('pendingOperations.move.description')}</DialogDescription>
            </DialogHeader>
          </div>

          {moveSource ? (
            <div className="wms-ops-bilginoglu-detail__body wms-ops-form space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <HakEdisNeedCard label={t('pendingOperations.move.sourceOrder')} value={moveSource.siparisNo} />
                <HakEdisNeedCard
                  label={t('pendingOperations.move.stock')}
                  value={`${moveSource.stockCode ?? '-'} ${moveSource.yapKod ? `/ ${moveSource.yapKod}` : ''}`}
                  tone="info"
                />
                <HakEdisNeedCard label={t('pendingOperations.move.sourceQty')} value={formatNumber(moveSource.quantity)} tone="success" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="move-target" className="wms-ops-prelabel-form-label">{t('pendingOperations.move.targetOrder')}</Label>
                <Select value={targetPlanId} onValueChange={(value) => {
                  const target = moveTargets.find((item) => String(item.planId) === value);
                  setTargetPlanId(value);
                  if (target) {
                    setMoveQty(String(Math.min(moveSource.quantity, target.availableToMoveQty)));
                  }
                }}>
                  <SelectTrigger id="move-target">
                    <SelectValue placeholder={moveTargetsQuery.isLoading ? t('pendingOperations.move.loadingTargets') : t('pendingOperations.move.targetPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                    {moveTargets.map((target) => (
                      <SelectItem key={target.planId} value={String(target.planId)}>
                        {formatMoveTarget(target, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {moveTargetsQuery.isError ? (
                  <p className="wms-ops-hint-banner">
                    {moveTargetsQuery.error instanceof Error ? moveTargetsQuery.error.message : t('pendingOperations.move.targetError')}
                  </p>
                ) : null}
                {!moveTargetsQuery.isLoading && moveTargets.length === 0 ? (
                  <p className="wms-ops-prelabel-panel__hint">{t('pendingOperations.move.noTargets')}</p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="move-qty" className="wms-ops-prelabel-form-label">{t('pendingOperations.move.quantity')}</Label>
                  <OpsInput
                    id="move-qty"
                    type="number"
                    min="0"
                    step="0.0001"
                    value={moveQty}
                    onChange={(event) => setMoveQty(event.target.value)}
                  />
                  {selectedTarget ? (
                    <p className="wms-ops-prelabel-panel__hint">
                      {t('pendingOperations.move.availableHint', { qty: formatNumber(selectedTarget.availableToMoveQty) })}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="move-reason" className="wms-ops-prelabel-form-label">{t('pendingOperations.move.reason')}</Label>
                  <OpsTextarea
                    id="move-reason"
                    rows={3}
                    value={moveReason}
                    onChange={(event) => setMoveReason(event.target.value)}
                    placeholder={t('pendingOperations.move.reasonPlaceholder')}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="wms-ops-bilginoglu-detail__footer shrink-0">
            <OpsActionButton type="button" variant="secondary" onClick={() => setMoveSource(null)}>
              {t('common.cancel')}
            </OpsActionButton>
            <OpsActionButton
              type="button"
              variant="primary"
              disabled={!moveSource || !selectedTarget || moveMutation.isPending || moveTargetsQuery.isLoading}
              onClick={() => moveMutation.mutate()}
            >
              <MoveRight className="size-4" />
              {moveMutation.isPending ? t('common.processing') : t('pendingOperations.move.submit')}
            </OpsActionButton>
          </DialogFooter>
        </HakEdisOpsDialogContent>
      </Dialog>
    </>
  );
}

function formatMoveTarget(target: BilginogluHakEdisMoveTarget, t: TFunction): string {
  const customer = [target.customerCode, target.customerName].filter(Boolean).join(' - ');
  return `${target.siparisNo} | ${customer || '-'} | ${t('pendingOperations.move.remainingHint', { qty: formatNumber(target.availableToMoveQty) })}`;
}

export function BilginogluHakEdisPendingTransfersPage(): ReactElement {
  return <PendingOperationsPage queueType="transfer" />;
}

export function BilginogluHakEdisPendingShipmentsPage(): ReactElement {
  return <PendingOperationsPage queueType="shipment" />;
}
