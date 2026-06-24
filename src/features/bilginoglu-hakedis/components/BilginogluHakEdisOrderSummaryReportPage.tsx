import { type ReactElement, useEffect, useMemo } from 'react';
import { AlertTriangle, Boxes, GitBranch, PackageCheck, RefreshCcw, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsListPageShell, OpsServiceEyebrow, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { useBilginogluHakEdisOrderSummaryReportQuery } from '../hooks/useBilginogluHakEdisQueries';
import type { BilginogluHakEdisOrderSummaryReport } from '../types/bilginoglu-hakedis.types';
import {
  HAK_EDIS_ORDER_SUMMARY_COLUMN_WIDTHS,
  HakEdisMetricGrid,
  HakEdisPageSection,
  HakEdisReportCellFacts,
  HakEdisSummaryMetric,
  hakEdisOpsStatusBadge,
} from './bilginoglu-hakedis-ops-ui';

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
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function yesNoLabel(flag: string, t: (key: string) => string): string {
  return flag === 'E' ? t('common.yes') : t('common.no');
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
    {
      key: 'siparisNo',
      label: t('reports.orderSummary.table.order'),
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'orderDate',
      label: t('reports.orderSummary.table.orderDate'),
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    { key: 'customer', label: t('reports.orderSummary.table.customer') },
    {
      key: 'flags',
      label: t('reports.orderSummary.table.flags'),
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'expectedTotalQty',
      label: t('reports.orderSummary.table.expected'),
      sortable: false,
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'unplannedNeedQty',
      label: t('reports.orderSummary.table.unplannedNeed'),
      sortable: false,
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'hakEdisFlow',
      label: t('reports.orderSummary.table.hakEdisFlow'),
      sortable: false,
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'returnFlow',
      label: t('reports.orderSummary.table.returnFlow'),
      sortable: false,
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'shipmentFlow',
      label: t('reports.orderSummary.table.shipmentFlow'),
      sortable: false,
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'warehouse',
      label: t('reports.orderSummary.table.warehouse'),
      sortable: false,
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'status',
      label: t('reports.orderSummary.table.status'),
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'lastEvaluationDate',
      label: t('reports.orderSummary.table.lastEvaluation'),
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
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
    <OpsListPageShell
      className="wms-ops-bilginoglu-report-page"
      eyebrow={<OpsServiceEyebrow module={t('breadcrumb.module')} />}
      title={t('reports.orderSummary.title')}
      description={t('reports.orderSummary.description')}
      actions={(
        <OpsActionButton type="button" variant="secondary" onClick={() => void query.refetch()}>
          <RefreshCcw className="size-4" />
          {t('actions.refresh')}
        </OpsActionButton>
      )}
    >
      <div className="wms-ops-bilginoglu-page">
        <HakEdisMetricGrid>
          <HakEdisSummaryMetric icon={<Boxes className="size-4" />} label={t('reports.orderSummary.cards.expected')} value={formatQty(totals.expected)} />
          <HakEdisSummaryMetric icon={<AlertTriangle className="size-4" />} label={t('reports.orderSummary.cards.unplanned')} value={formatQty(totals.unplanned)} />
          <HakEdisSummaryMetric icon={<GitBranch className="size-4" />} label={t('reports.orderSummary.cards.hakEdisFlow')} value={formatQty(totals.hakEdisFlow)} />
          <HakEdisSummaryMetric icon={<PackageCheck className="size-4" />} label={t('reports.orderSummary.cards.shipmentWaiting')} value={formatQty(totals.shipmentWaiting)} />
          <HakEdisSummaryMetric icon={<Truck className="size-4" />} label={t('reports.orderSummary.cards.shipped')} value={formatQty(totals.shipped)} />
          <HakEdisSummaryMetric icon={<AlertTriangle className="size-4" />} label={t('reports.orderSummary.cards.missing')} value={formatQty(totals.missing)} />
        </HakEdisMetricGrid>

        <HakEdisPageSection className="wms-ops-bilginoglu-page-section--grid">
          <PagedDataGrid<BilginogluHakEdisOrderSummaryReport, ReportColumnKey>
            variant="ops"
            pageKey="bilginoglu-hakedis-order-summary-report"
            idColumnKey="siparisNo"
            lockedColumnKeys={['siparisNo']}
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            defaultColumnWidths={HAK_EDIS_ORDER_SUMMARY_COLUMN_WIDTHS}
            enableColumnResize
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'siparisNo':
                  return (
                    <div className="wms-ops-bilginoglu-report-order">
                      <span className="wms-ops-bilginoglu-report-order__no" title={row.siparisNo}>
                        {row.siparisNo}
                      </span>
                      <span className="wms-ops-prelabel-panel__hint">
                        {t('reports.orderSummary.labels.lineCount')}: {row.lineCount}
                      </span>
                    </div>
                  );
                case 'orderDate':
                  return <span className="tabular-nums" title={formatDate(row.orderDate)}>{formatDate(row.orderDate)}</span>;
                case 'customer':
                  return (
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-semibold" title={String(row.customerCode ?? '-')}>
                        {row.customerCode ?? '-'}
                      </span>
                      <span className="wms-ops-prelabel-panel__hint truncate" title={row.customerName ?? '-'}>
                        {row.customerName ?? '-'}
                      </span>
                    </div>
                  );
                case 'flags':
                  return (
                    <div className="wms-ops-bilginoglu-report-flags">
                      <span className="wms-ops-code-badge" title={`${t('reports.orderSummary.labels.hakEdisRequired')}: ${yesNoLabel(row.hakEdisFlag, t)}`}>
                        {t('reports.orderSummary.labels.hakEdisRequired')}: {yesNoLabel(row.hakEdisFlag, t)}
                      </span>
                      <span className="wms-ops-code-badge" title={`${t('reports.orderSummary.labels.transferAll')}: ${yesNoLabel(row.transferAllFlag, t)}`}>
                        {t('reports.orderSummary.labels.transferAll')}: {yesNoLabel(row.transferAllFlag, t)}
                      </span>
                    </div>
                  );
                case 'expectedTotalQty':
                  return (
                    <HakEdisReportCellFacts
                      items={[
                        { label: t('reports.orderSummary.labels.expected'), value: formatQty(row.expectedTotalQty) },
                        { label: t('reports.orderSummary.labels.remaining'), value: formatQty(row.remainingOrderQty) },
                      ]}
                    />
                  );
                case 'unplannedNeedQty':
                  return (
                    <span
                      className="wms-ops-bilginoglu-report-fact__value wms-ops-bilginoglu-report-fact__value--warn tabular-nums"
                      title={formatQty(row.unplannedNeedQty)}
                    >
                      {formatQty(row.unplannedNeedQty)}
                    </span>
                  );
                case 'hakEdisFlow':
                  return (
                    <HakEdisReportCellFacts
                      items={[
                        { label: t('reports.orderSummary.labels.toGo'), value: formatQty(row.hakEdisToGoQty), tone: 'info' },
                        { label: t('reports.orderSummary.labels.atHakEdis'), value: formatQty(row.atHakEdisQty), tone: 'info' },
                      ]}
                    />
                  );
                case 'returnFlow':
                  return (
                    <span
                      className="wms-ops-bilginoglu-report-fact__value wms-ops-bilginoglu-report-fact__value--info tabular-nums"
                      title={formatQty(row.hakEdisReturnPendingQty)}
                    >
                      {formatQty(row.hakEdisReturnPendingQty)}
                    </span>
                  );
                case 'shipmentFlow':
                  return (
                    <HakEdisReportCellFacts
                      items={[
                        { label: t('reports.orderSummary.labels.ready'), value: formatQty(row.readyForShipmentQty), tone: 'success' },
                        { label: t('reports.orderSummary.labels.shipmentOrder'), value: formatQty(row.shipmentWaitingQty), tone: 'success' },
                        { label: t('reports.orderSummary.labels.shipped'), value: formatQty(row.shippedQty), tone: 'success' },
                      ]}
                    />
                  );
                case 'warehouse':
                  return (
                    <HakEdisReportCellFacts
                      items={[
                        { label: t('reports.orderSummary.labels.available'), value: formatQty(row.warehouseAvailableQty) },
                        { label: t('reports.orderSummary.labels.canCreate'), value: formatQty(row.canCreateNewBatchQty), tone: 'success' },
                        { label: t('reports.orderSummary.labels.missing'), value: formatQty(row.missingQty), tone: 'danger' },
                      ]}
                    />
                  );
                case 'status': {
                  const statusLabel = renderStatus(row.status);
                  return hakEdisOpsStatusBadge(row.status, statusLabel);
                }
                case 'lastEvaluationDate':
                  return (
                    <span className="tabular-nums" title={formatDate(row.lastEvaluationDate)}>
                      {formatDate(row.lastEvaluationDate)}
                    </span>
                  );
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
          />
        </HakEdisPageSection>
      </div>
    </OpsListPageShell>
  );
}
