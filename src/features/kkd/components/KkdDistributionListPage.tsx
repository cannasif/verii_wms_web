import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { getLocaleForFormatting } from '@/lib/i18n';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';
import type { KkdDistributionHeaderDto, KkdDistributionListItemDto } from '../types/kkd.types';

type DistributionColumnKey =
  | 'documentNo'
  | 'documentDate'
  | 'customerCode'
  | 'employee'
  | 'warehouseId'
  | 'status'
  | 'sourceChannel'
  | 'lineCount'
  | 'totalQuantity'
  | 'erpStatus';

function mapSortBy(value: DistributionColumnKey): string {
  switch (value) {
    case 'documentNo':
      return 'DocumentNo';
    case 'documentDate':
      return 'DocumentDate';
    case 'customerCode':
      return 'CustomerCode';
    case 'employee':
      return 'EmployeeCode';
    case 'warehouseId':
      return 'WarehouseId';
    case 'status':
      return 'Status';
    case 'sourceChannel':
      return 'SourceChannel';
    case 'lineCount':
      return 'LineCount';
    case 'totalQuantity':
      return 'TotalQuantity';
    case 'erpStatus':
      return 'ERPIntegrationStatus';
    default:
      return 'DocumentDate';
  }
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return '-';
  return new Date(value).toLocaleString(locale);
}

export function KkdDistributionListPage(): ReactElement {
  const { t, i18n } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const dateLocale = getLocaleForFormatting(i18n.language);
  const [selectedHeader, setSelectedHeader] = useState<KkdDistributionHeaderDto | null>(null);
  const pagedGrid = usePagedDataGrid<DistributionColumnKey>({
    pageKey: 'kkd-distribution-list-grid',
    defaultSortBy: 'documentDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('kkd.operational.distributionList.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useQuery({
    queryKey: ['kkd', 'distribution-list', pagedGrid.queryParams],
    queryFn: ({ signal }) => kkdApi.getDistributions(pagedGrid.queryParams, { signal }),
    retry: false,
  });

  const detailQuery = useQuery({
    queryKey: ['kkd', 'distribution-detail', selectedHeader?.id],
    queryFn: () => kkdApi.getDistributionById(selectedHeader!.id),
    enabled: Boolean(selectedHeader?.id),
    retry: false,
  });

  const rows = query.data?.data ?? [];
  const range = getPagedRange(query.data);

  const columns = useMemo<PagedDataGridColumn<DistributionColumnKey>[]>(
    () => [
      { key: 'documentNo', label: t('kkd.operational.distributionList.colDocNo') },
      { key: 'documentDate', label: t('kkd.operational.distributionList.colDocDate') },
      { key: 'customerCode', label: t('kkd.operational.distributionList.colCustomer') },
      { key: 'employee', label: t('kkd.operational.distributionList.colEmployee') },
      { key: 'warehouseId', label: t('kkd.operational.distributionList.colWarehouse') },
      { key: 'status', label: t('kkd.operational.distributionList.colStatus') },
      { key: 'sourceChannel', label: t('kkd.operational.distributionList.colSource') },
      { key: 'lineCount', label: t('kkd.operational.distributionList.colLineCount') },
      { key: 'totalQuantity', label: t('kkd.operational.distributionList.colTotalQty') },
      { key: 'erpStatus', label: t('kkd.operational.distributionList.colErpStatus') },
    ],
    [t],
  );

  const detail = detailQuery.data ?? selectedHeader;

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb items={[{ label: t('sidebar.kkdOperationsGroup') }, { label: t('kkd.operational.distributionList.breadcrumb'), isActive: true }]} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.distributionList.gridTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <PagedDataGrid<KkdDistributionListItemDto, DistributionColumnKey>
              pageKey="kkd-distribution-list"
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              renderCell={(row, columnKey) => {
                switch (columnKey) {
                  case 'documentNo':
                    return row.documentNo || '-';
                  case 'documentDate':
                    return formatDate(row.documentDate, dateLocale);
                  case 'customerCode':
                    return row.customerCode;
                  case 'employee':
                    return row.employeeCode ? `${row.employeeCode} - ${row.employeeName || ''}`.trim() : row.employeeName || '-';
                  case 'warehouseId':
                    return `#${row.warehouseId}`;
                  case 'status':
                    return row.status;
                  case 'sourceChannel':
                    return row.sourceChannel;
                  case 'lineCount':
                    return row.lineCount;
                  case 'totalQuantity':
                    return row.totalQuantity;
                  case 'erpStatus':
                    return row.erpIntegrationStatus || '-';
                  default:
                    return '-';
                }
              }}
              sortBy={pagedGrid.sortBy}
              sortDirection={pagedGrid.sortDirection}
              onSort={pagedGrid.handleSort}
              onRowClick={(row) => setSelectedHeader({ ...row, lines: [] })}
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
              paginationInfoText={t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total })}
              isLoading={query.isLoading}
              isError={query.isError}
              errorText={t('kkd.operational.distributionList.errLoad')}
              emptyText={t('kkd.operational.distributionList.empty')}
              search={{
                value: pagedGrid.searchInput,
                onValueChange: pagedGrid.searchConfig.onValueChange,
                onSearchChange: pagedGrid.searchConfig.onSearchChange,
                placeholder: t('kkd.operational.distributionList.searchPh'),
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.distributionList.detailTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {detail ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge>{detail.documentNo || t('kkd.operational.distributionList.headerBadge', { id: detail.id })}</Badge>
                  <Badge variant="secondary">{detail.status}</Badge>
                  <Badge variant="outline">{detail.sourceChannel}</Badge>
                  <Badge variant="outline">{t('kkd.operational.distributionList.erpPrefix')}: {detail.erpIntegrationStatus || '-'}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('kkd.operational.distributionList.customerEmployee')}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                      {detail.customerCode || '-'} / #{detail.employeeId}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('kkd.operational.distributionList.documentCompletion')}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                      {formatDate(detail.documentDate, dateLocale)} / {formatDate(detail.completionDate, dateLocale)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('kkd.operational.distributionList.linesTitle')}</h2>
                  {detailQuery.isLoading ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      {t('kkd.operational.distributionList.linesLoading')}
                    </div>
                  ) : detail.lines.length ? (
                    detail.lines.map((line) => (
                      <div key={line.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/3">
                        <div className="flex flex-wrap gap-2">
                          <Badge>{line.stockCode}</Badge>
                          {line.groupCode ? <Badge variant="secondary">{line.groupCode}</Badge> : null}
                          <Badge variant="outline">{t('kkd.operational.distributionList.qtyPrefix')}: {line.quantity}</Badge>
                          <Badge variant="outline">{line.entitlementType}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                          {t('kkd.operational.distributionList.lineMeta', { b: line.barcode || '-', s: line.serialNo || '-', r: line.shelfId || '-' })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      {t('kkd.operational.distributionList.pickDocument')}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                {t('kkd.operational.distributionList.pickLeft')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
