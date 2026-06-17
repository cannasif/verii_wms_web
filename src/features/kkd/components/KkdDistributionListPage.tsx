import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { getLocaleForFormatting } from '@/lib/i18n';
import { localizeStatus } from '@/lib/localize-status';
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
  const { t, i18n } = useTranslation(['kkd', 'common']);
  const { setPageTitle } = useUIStore();
  const dateLocale = getLocaleForFormatting(i18n.language);
  const [selectedHeader, setSelectedHeader] = useState<KkdDistributionHeaderDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
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

  const openDetail = (row: KkdDistributionListItemDto): void => {
    setSelectedHeader({ ...row, lines: [] });
    setDetailOpen(true);
  };

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb items={[{ label: t('sidebar.kkdOperationsGroup') }, { label: t('kkd.operational.distributionList.breadcrumb'), isActive: true }]} />

      <div className="grid gap-6">
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
                    return localizeStatus(row.status, t);
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
              actionsHeaderLabel={t('common.actions')}
              renderActionsCell={(row) => (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title={t('common.view')}
                    aria-label={t('common.view')}
                    onClick={() => openDetail(row)}
                  >
                    <Eye className="h-4 w-4" />
                    <span>{t('common.view')}</span>
                  </Button>
                </div>
              )}
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
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('kkd.operational.distributionList.detailTitle')}</DialogTitle>
            <DialogDescription>
              {detail?.documentNo || (detail ? t('kkd.operational.distributionList.headerBadge', { id: detail.id }) : t('kkd.operational.distributionList.linesLoading'))}
            </DialogDescription>
          </DialogHeader>

          {detail ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge>{detail.documentNo || t('kkd.operational.distributionList.headerBadge', { id: detail.id })}</Badge>
                <Badge variant="secondary">{localizeStatus(detail.status, t)}</Badge>
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
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                    <div className="hidden grid-cols-[1.5fr_2fr_0.7fr_1fr_1.2fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:bg-white/5 dark:text-slate-400 md:grid">
                      <span>{t('kkd.operational.distributionList.stockCode')}</span>
                      <span>{t('kkd.operational.distributionList.stockName')}</span>
                      <span>{t('kkd.operational.distributionList.quantity')}</span>
                      <span>{t('kkd.operational.distributionList.group')}</span>
                      <span>{t('kkd.operational.distributionList.barcodeSerial')}</span>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-white/10">
                      {detail.lines.map((line) => (
                        <div key={line.id} className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.5fr_2fr_0.7fr_1fr_1.2fr] md:items-center">
                          <div>
                            <p className="md:hidden text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('kkd.operational.distributionList.stockCode')}</p>
                            <Badge>{line.stockCode || '-'}</Badge>
                          </div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            <p className="md:hidden text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('kkd.operational.distributionList.stockName')}</p>
                            {line.stockName || '-'}
                          </div>
                          <div>
                            <p className="md:hidden text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('kkd.operational.distributionList.quantity')}</p>
                            {line.quantity}
                          </div>
                          <div>
                            <p className="md:hidden text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('kkd.operational.distributionList.group')}</p>
                            {line.groupCode ? <Badge variant="secondary">{line.groupName ? `${line.groupCode} - ${line.groupName}` : line.groupCode}</Badge> : '-'}
                          </div>
                          <div className="text-slate-600 dark:text-slate-300">
                            <p className="md:hidden text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('kkd.operational.distributionList.barcodeSerial')}</p>
                            {t('kkd.operational.distributionList.lineMeta', { b: line.barcode || '-', s: line.serialNo || '-', r: line.shelfId || '-' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    {t('kkd.operational.distributionList.pickDocument')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              {t('kkd.operational.distributionList.linesLoading')}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
