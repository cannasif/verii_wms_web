import { type ReactElement, useEffect, useMemo } from 'react';
import { ArrowRightLeft, RefreshCcw, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { getPagedRange } from '@/lib/paged';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { useUIStore } from '@/stores/ui-store';
import { bilginogluHakEdisApi } from '../api/bilginogluHakEdisApi';
import { bilginogluHakEdisQueryKeys } from '../hooks/useBilginogluHakEdisQueries';
import type { BilginogluHakEdisPendingOperation } from '../types/bilginoglu-hakedis.types';

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
  const { setPageTitle } = useUIStore();
  const pageKey = queueType === 'transfer'
    ? 'bilginoglu-hakedis-pending-transfers'
    : 'bilginoglu-hakedis-pending-shipments';
  const pageTitle = queueType === 'transfer'
    ? t('pendingOperations.transfer.title')
    : t('pendingOperations.shipment.title');
  const pageDescription = queueType === 'transfer'
    ? t('pendingOperations.transfer.description')
    : t('pendingOperations.shipment.description');
  const Icon = queueType === 'transfer' ? ArrowRightLeft : Truck;

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

  const columns = useMemo<PagedDataGridColumn<PendingColumnKey>[]>(() => [
    { key: 'siparisNo', label: t('pendingOperations.table.order') },
    { key: 'customer', label: t('pendingOperations.table.customer') },
    { key: 'stock', label: t('pendingOperations.table.stock') },
    { key: 'warehouseFlow', label: t('pendingOperations.table.warehouseFlow'), sortable: false },
    { key: 'quantity', label: t('pendingOperations.table.quantity') },
    { key: 'currentStage', label: t('pendingOperations.table.stage') },
    { key: 'pendingAction', label: t('pendingOperations.table.pendingAction'), sortable: false },
    { key: 'documents', label: t('pendingOperations.table.documents'), sortable: false },
    { key: 'updatedAt', label: t('pendingOperations.table.updatedAt') },
  ], [t]);

  const renderStage = (value: string): string => t(`status.${value}`, { defaultValue: value });
  const renderAction = (value: string): string => t(`pendingOperations.actions.${value}`, { defaultValue: value });

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('breadcrumb.operations') },
          { label: t('breadcrumb.serviceOperations') },
          { label: pageTitle, isActive: true },
        ]}
      />

      <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-200">
              <Icon className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white md:text-2xl">{pageTitle}</h1>
              <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{pageDescription}</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => void query.refetch()}>
            <RefreshCcw className="mr-2 size-4" />
            {t('actions.refresh')}
          </Button>
        </div>
      </section>

      <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/3">
        <CardContent className="p-5">
          <PagedDataGrid<BilginogluHakEdisPendingOperation, PendingColumnKey>
            pageKey={pageKey}
            columns={columns}
            rows={rows}
            rowKey={(row) => row.batchId}
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'siparisNo':
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{row.siparisNo}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{row.batchNo}</span>
                    </div>
                  );
                case 'customer':
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{row.customerCode ?? '-'}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{row.customerName ?? '-'}</span>
                    </div>
                  );
                case 'stock':
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{row.stockCode ?? '-'}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{row.stockName ?? '-'}</span>
                      {row.yapKod ? <span className="text-xs text-slate-500 dark:text-slate-400">{row.yapKod}</span> : null}
                    </div>
                  );
                case 'warehouseFlow':
                  return (
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold dark:border-white/10">
                      <span>{row.sourceWarehouseCode ?? '-'}</span>
                      <span>→</span>
                      <span>{row.hakEdisWarehouseCode ?? '-'}</span>
                    </div>
                  );
                case 'quantity':
                  return <span className="font-semibold">{formatNumber(row.quantity)}</span>;
                case 'currentStage':
                  return <Badge variant="secondary">{renderStage(row.currentStage)}</Badge>;
                case 'pendingAction':
                  return <Badge variant="outline">{renderAction(row.pendingAction)}</Badge>;
                case 'documents':
                  return (
                    <div className="flex flex-wrap gap-1 text-xs">
                      {row.replenishmentToIntermediateHeaderId ? <Badge variant="outline">IKM1 #{row.replenishmentToIntermediateHeaderId}</Badge> : null}
                      {row.replenishmentToOrderWarehouseHeaderId ? <Badge variant="outline">IKM2 #{row.replenishmentToOrderWarehouseHeaderId}</Badge> : null}
                      {row.transferToHakEdisHeaderId ? <Badge variant="outline">DAT1 #{row.transferToHakEdisHeaderId}</Badge> : null}
                      {row.returnFromHakEdisHeaderId ? <Badge variant="outline">DAT2 #{row.returnFromHakEdisHeaderId}</Badge> : null}
                      {row.shipmentHeaderId ? <Badge variant="outline">SH #{row.shipmentHeaderId}</Badge> : null}
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
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function BilginogluHakEdisPendingTransfersPage(): ReactElement {
  return <PendingOperationsPage queueType="transfer" />;
}

export function BilginogluHakEdisPendingShipmentsPage(): ReactElement {
  return <PendingOperationsPage queueType="shipment" />;
}
