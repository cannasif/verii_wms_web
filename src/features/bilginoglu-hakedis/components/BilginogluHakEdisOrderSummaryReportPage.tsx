import { type ReactElement, useEffect, useMemo } from 'react';
import { BarChart3, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { useBilginogluHakEdisOrderSummaryReportQuery } from '../hooks/useBilginogluHakEdisQueries';
import type { BilginogluHakEdisOrderSummaryReport } from '../types/bilginoglu-hakedis.types';

type ReportColumnKey =
  | 'siparisNo'
  | 'orderDate'
  | 'customer'
  | 'flags'
  | 'expectedTotalQty'
  | 'unplannedNeedQty'
  | 'hakEdisFlow'
  | 'returnFlow'
  | 'shipmentFlow'
  | 'warehouse'
  | 'status'
  | 'lastEvaluationDate';

function mapSortBy(value: ReportColumnKey): string {
  switch (value) {
    case 'siparisNo':
      return 'SiparisNo';
    case 'orderDate':
      return 'OrderDate';
    case 'customer':
      return 'CustomerCodeSnapshot';
    case 'flags':
      return 'HakEdisFlag';
    case 'status':
      return 'Status';
    case 'lastEvaluationDate':
      return 'LastEvaluationDate';
    default:
      return 'OrderDate';
  }
}

function formatQty(value?: number | null): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(value ?? 0);
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}

function FlowPair({ label, value, tone = 'slate' }: { label: string; value: number; tone?: 'slate' | 'emerald' | 'blue' | 'amber' | 'rose' }) {
  const toneClass = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
    blue: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
  }[tone];

  return (
    <div className={`rounded-xl px-3 py-2 ${toneClass}`}>
      <div className="text-[11px] font-bold uppercase tracking-wide opacity-75">{label}</div>
      <div className="mt-0.5 text-sm font-black">{formatQty(value)}</div>
    </div>
  );
}

export function BilginogluHakEdisOrderSummaryReportPage(): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const { setPageTitle } = useUIStore();

  const pagedGrid = usePagedDataGrid<ReportColumnKey>({
    pageKey: 'bilginoglu-hakedis-order-summary-report',
    defaultSortBy: 'orderDate',
    defaultSortDirection: 'asc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('reports.orderSummary.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useBilginogluHakEdisOrderSummaryReportQuery(pagedGrid.queryParams);
  const rows = query.data?.data ?? [];
  const range = getPagedRange(query.data, 1);

  const columns = useMemo<PagedDataGridColumn<ReportColumnKey>[]>(() => [
    { key: 'siparisNo', label: t('reports.orderSummary.table.order') },
    { key: 'orderDate', label: t('reports.orderSummary.table.orderDate') },
    { key: 'customer', label: t('reports.orderSummary.table.customer') },
    { key: 'flags', label: t('reports.orderSummary.table.flags') },
    { key: 'expectedTotalQty', label: t('reports.orderSummary.table.expected'), sortable: false },
    { key: 'unplannedNeedQty', label: t('reports.orderSummary.table.unplannedNeed'), sortable: false },
    { key: 'hakEdisFlow', label: t('reports.orderSummary.table.hakEdisFlow'), sortable: false },
    { key: 'returnFlow', label: t('reports.orderSummary.table.returnFlow'), sortable: false },
    { key: 'shipmentFlow', label: t('reports.orderSummary.table.shipmentFlow'), sortable: false },
    { key: 'warehouse', label: t('reports.orderSummary.table.warehouse'), sortable: false },
    { key: 'status', label: t('reports.orderSummary.table.status') },
    { key: 'lastEvaluationDate', label: t('reports.orderSummary.table.lastEvaluation') },
  ], [t]);

  const totals = useMemo(() => rows.reduce(
    (acc, row) => {
      acc.expected += row.expectedTotalQty;
      acc.unplanned += row.unplannedNeedQty;
      acc.hakEdisFlow += row.hakEdisToGoQty + row.atHakEdisQty + row.hakEdisReturnPendingQty;
      acc.shipmentWaiting += row.readyForShipmentQty + row.shipmentWaitingQty;
      acc.shipped += row.shippedQty;
      acc.missing += row.missingQty;
      return acc;
    },
    { expected: 0, unplanned: 0, hakEdisFlow: 0, shipmentWaiting: 0, shipped: 0, missing: 0 },
  ), [rows]);

  const exportRows = useMemo(() => rows.map((row) => ({
    siparisNo: row.siparisNo,
    orderDate: formatDate(row.orderDate),
    customer: `${row.customerCode ?? '-'} ${row.customerName ?? ''}`.trim(),
    hakEdisFlag: row.hakEdisFlag === 'E' ? t('common.yes') : t('common.no'),
    transferAllFlag: row.transferAllFlag === 'E' ? t('common.yes') : t('common.no'),
    expectedTotalQty: row.expectedTotalQty,
    remainingOrderQty: row.remainingOrderQty,
    unplannedNeedQty: row.unplannedNeedQty,
    hakEdisToGoQty: row.hakEdisToGoQty,
    atHakEdisQty: row.atHakEdisQty,
    hakEdisReturnPendingQty: row.hakEdisReturnPendingQty,
    readyForShipmentQty: row.readyForShipmentQty,
    shipmentWaitingQty: row.shipmentWaitingQty,
    shippedQty: row.shippedQty,
    missingQty: row.missingQty,
    status: row.status,
    lastEvaluationDate: formatDate(row.lastEvaluationDate),
  })), [rows, t]);

  const renderStatus = (status: string): string => t(`status.${status}`, { defaultValue: status });

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('breadcrumb.operations') },
          { label: t('breadcrumb.serviceOperations') },
          { label: t('reports.orderSummary.title'), isActive: true },
        ]}
      />

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-200">
                  <BarChart3 className="size-3.5" />
                  {t('reports.orderSummary.eyebrow')}
                </div>
                <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white md:text-3xl">
                  {t('reports.orderSummary.title')}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t('reports.orderSummary.description')}
                </p>
              </div>
              <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => void query.refetch()}>
                <RefreshCcw className="mr-2 size-4" />
                {t('actions.refresh')}
              </Button>
            </div>
          </div>
          <div className="border-t border-slate-200/80 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-black/15 lg:border-l lg:border-t-0">
            <div className="grid grid-cols-2 gap-3">
              <FlowPair label={t('reports.orderSummary.cards.expected')} value={totals.expected} tone="slate" />
              <FlowPair label={t('reports.orderSummary.cards.unplanned')} value={totals.unplanned} tone="amber" />
              <FlowPair label={t('reports.orderSummary.cards.hakEdisFlow')} value={totals.hakEdisFlow} tone="blue" />
              <FlowPair label={t('reports.orderSummary.cards.shipmentWaiting')} value={totals.shipmentWaiting} tone="emerald" />
              <FlowPair label={t('reports.orderSummary.cards.shipped')} value={totals.shipped} tone="emerald" />
              <FlowPair label={t('reports.orderSummary.cards.missing')} value={totals.missing} tone="rose" />
            </div>
          </div>
        </div>
      </section>

      <Card className="border-slate-200/80 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardContent className="p-4 md:p-5">
          <PagedDataGrid<BilginogluHakEdisOrderSummaryReport, ReportColumnKey>
            pageKey="bilginoglu-hakedis-order-summary-report"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'siparisNo':
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-slate-950 dark:text-white">{row.siparisNo}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {t('reports.orderSummary.labels.lineCount')}: {row.lineCount}
                      </span>
                    </div>
                  );
                case 'orderDate':
                  return formatDate(row.orderDate);
                case 'customer':
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{row.customerCode ?? '-'}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{row.customerName ?? '-'}</span>
                    </div>
                  );
                case 'flags':
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={row.hakEdisFlag === 'E' ? 'default' : 'secondary'} className="rounded-full">
                        {t('reports.orderSummary.labels.hakEdisRequired')}: {row.hakEdisFlag === 'E' ? t('common.yes') : t('common.no')}
                      </Badge>
                      <Badge variant={row.transferAllFlag === 'E' ? 'default' : 'outline'} className="rounded-full">
                        {t('reports.orderSummary.labels.transferAll')}: {row.transferAllFlag === 'E' ? t('common.yes') : t('common.no')}
                      </Badge>
                    </div>
                  );
                case 'expectedTotalQty':
                  return (
                    <div className="grid min-w-36 grid-cols-2 gap-2">
                      <FlowPair label={t('reports.orderSummary.labels.expected')} value={row.expectedTotalQty} />
                      <FlowPair label={t('reports.orderSummary.labels.remaining')} value={row.remainingOrderQty} />
                    </div>
                  );
                case 'unplannedNeedQty':
                  return <FlowPair label={t('reports.orderSummary.labels.canCreate')} value={row.unplannedNeedQty} tone="amber" />;
                case 'hakEdisFlow':
                  return (
                    <div className="grid min-w-44 grid-cols-2 gap-2">
                      <FlowPair label={t('reports.orderSummary.labels.toGo')} value={row.hakEdisToGoQty} tone="blue" />
                      <FlowPair label={t('reports.orderSummary.labels.atHakEdis')} value={row.atHakEdisQty} tone="blue" />
                    </div>
                  );
                case 'returnFlow':
                  return <FlowPair label={t('reports.orderSummary.labels.returnPending')} value={row.hakEdisReturnPendingQty} tone="blue" />;
                case 'shipmentFlow':
                  return (
                    <div className="grid min-w-48 grid-cols-3 gap-2">
                      <FlowPair label={t('reports.orderSummary.labels.ready')} value={row.readyForShipmentQty} tone="emerald" />
                      <FlowPair label={t('reports.orderSummary.labels.shipmentOrder')} value={row.shipmentWaitingQty} tone="emerald" />
                      <FlowPair label={t('reports.orderSummary.labels.shipped')} value={row.shippedQty} tone="emerald" />
                    </div>
                  );
                case 'warehouse':
                  return (
                    <div className="grid min-w-48 grid-cols-3 gap-2">
                      <FlowPair label={t('reports.orderSummary.labels.available')} value={row.warehouseAvailableQty} tone="slate" />
                      <FlowPair label={t('reports.orderSummary.labels.canCreate')} value={row.canCreateNewBatchQty} tone="emerald" />
                      <FlowPair label={t('reports.orderSummary.labels.missing')} value={row.missingQty} tone="rose" />
                    </div>
                  );
                case 'status':
                  return (
                    <Badge variant={row.isCompleted ? 'default' : 'outline'} className="rounded-full">
                      {renderStatus(row.status)}
                    </Badge>
                  );
                case 'lastEvaluationDate':
                  return formatDate(row.lastEvaluationDate);
                default:
                  return '-';
              }
            }}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            isLoading={query.isLoading}
            isError={query.isError}
            errorText={query.error instanceof Error ? query.error.message : t('reports.orderSummary.error')}
            emptyText={t('reports.orderSummary.empty')}
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
              placeholder: t('reports.orderSummary.searchPlaceholder'),
            }}
            draftFilterRows={pagedGrid.draftFilterRows}
            onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
            filterLogic={pagedGrid.filterLogic}
            onFilterLogicChange={pagedGrid.setFilterLogic}
            onApplyFilters={pagedGrid.applyAdvancedFilters}
            onClearFilters={pagedGrid.clearAdvancedFilters}
            appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
            translationNamespace="bilginoglu-hakedis"
            refresh={{ onRefresh: () => void query.refetch(), isLoading: query.isFetching, label: t('actions.refresh') }}
            exportFileName="bilginoglu-hakedis-order-summary-report"
            exportColumns={columns.map((column) => ({ key: column.key, label: column.label }))}
            exportRows={exportRows}
            minTableWidthClassName="min-w-[1440px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
