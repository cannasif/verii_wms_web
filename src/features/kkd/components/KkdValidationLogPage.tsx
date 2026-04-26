import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getLocaleForFormatting } from '@/lib/i18n';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';
import type { KkdValidationLogDto } from '../types/kkd.types';

type ValidationColumnKey =
  | 'createdDate'
  | 'employee'
  | 'customerCode'
  | 'stock'
  | 'groupCode'
  | 'attemptedQuantity'
  | 'reasonCode'
  | 'reasonMessage';

function mapSortBy(value: ValidationColumnKey): string {
  switch (value) {
    case 'createdDate':
      return 'CreatedDate';
    case 'employee':
      return 'EmployeeCode';
    case 'customerCode':
      return 'CustomerCode';
    case 'stock':
      return 'StockCode';
    case 'groupCode':
      return 'GroupCode';
    case 'attemptedQuantity':
      return 'AttemptedQuantity';
    case 'reasonCode':
      return 'ReasonCode';
    case 'reasonMessage':
      return 'ReasonMessage';
    default:
      return 'CreatedDate';
  }
}

export function KkdValidationLogPage(): ReactElement {
  const { t, i18n } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const [selectedRow, setSelectedRow] = useState<KkdValidationLogDto | null>(null);
  const pagedGrid = usePagedDataGrid<ValidationColumnKey>({
    pageKey: 'kkd-validation-log-grid',
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const formatDate = useCallback(
    (value?: string | null): string => {
      if (!value) return '-';
      return new Date(value).toLocaleString(getLocaleForFormatting(i18n.language));
    },
    [i18n.language],
  );

  useEffect(() => {
    setPageTitle(t('kkd.operational.validationLog.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useQuery({
    queryKey: ['kkd', 'validation-logs', pagedGrid.queryParams],
    queryFn: ({ signal }) => kkdApi.getValidationLogs(pagedGrid.queryParams, { signal }),
    retry: false,
  });

  const rows = query.data?.data ?? [];
  const range = getPagedRange(query.data);

  const columns = useMemo<PagedDataGridColumn<ValidationColumnKey>[]>(
    () => [
      { key: 'createdDate', label: t('kkd.operational.validationLog.time') },
      { key: 'employee', label: t('kkd.operational.validationLog.employee') },
      { key: 'customerCode', label: t('kkd.operational.validationLog.account') },
      { key: 'stock', label: t('kkd.operational.validationLog.stock') },
      { key: 'groupCode', label: t('kkd.operational.validationLog.group') },
      { key: 'attemptedQuantity', label: t('kkd.operational.validationLog.qty') },
      { key: 'reasonCode', label: t('kkd.operational.validationLog.code') },
      { key: 'reasonMessage', label: t('kkd.operational.validationLog.desc') },
    ],
    [t],
  );

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.operationsGroup') },
          { label: t('kkd.operational.validationLog.breadcrumb'), isActive: true },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.validationLog.gridTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <PagedDataGrid<KkdValidationLogDto, ValidationColumnKey>
              pageKey="kkd-validation-log"
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              renderCell={(row, columnKey) => {
                switch (columnKey) {
                  case 'createdDate':
                    return formatDate(row.createdDate);
                  case 'employee':
                    return row.employeeCode
                      ? `${row.employeeCode} - ${row.employeeName || ''}`.trim()
                      : row.employeeName || '-';
                  case 'customerCode':
                    return row.customerCode || '-';
                  case 'stock':
                    return row.stockCode
                      ? `${row.stockCode} - ${row.stockName || ''}`.trim()
                      : row.stockName || '-';
                  case 'groupCode':
                    return row.groupCode || '-';
                  case 'attemptedQuantity':
                    return row.attemptedQuantity;
                  case 'reasonCode':
                    return row.reasonCode;
                  case 'reasonMessage':
                    return row.reasonMessage || '-';
                  default:
                    return '-';
                }
              }}
              sortBy={pagedGrid.sortBy}
              sortDirection={pagedGrid.sortDirection}
              onSort={pagedGrid.handleSort}
              onRowClick={setSelectedRow}
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
              paginationInfoText={`${range.from}-${range.to} / ${range.total}`}
              isLoading={query.isLoading}
              isError={query.isError}
              errorText={t('kkd.operational.validationLog.errLoad')}
              emptyText={t('kkd.operational.validationLog.empty')}
              search={{
                value: pagedGrid.searchInput,
                onValueChange: pagedGrid.searchConfig.onValueChange,
                onSearchChange: pagedGrid.searchConfig.onSearchChange,
                placeholder: t('kkd.operational.validationLog.searchPh'),
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.validationLog.detailTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedRow ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge>{selectedRow.reasonCode}</Badge>
                  {selectedRow.groupCode ? <Badge variant="secondary">{selectedRow.groupCode}</Badge> : null}
                  <Badge variant="outline">{formatDate(selectedRow.createdDate)}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {t('kkd.operational.validationLog.employeeCust')}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                      {(selectedRow.employeeCode || selectedRow.employeeName)
                        ? `${selectedRow.employeeCode || ''} ${selectedRow.employeeName || ''}`.trim()
                        : '-'}{' '}
                      / {selectedRow.customerCode || '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {t('kkd.operational.validationLog.stockQty')}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                      {(selectedRow.stockCode || selectedRow.stockName)
                        ? `${selectedRow.stockCode || ''} ${selectedRow.stockName || ''}`.trim()
                        : '-'}{' '}
                      / {selectedRow.attemptedQuantity}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {t('kkd.operational.validationLog.message')}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{selectedRow.reasonMessage || '-'}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
                  {t('kkd.operational.validationLog.metaQr')}: {selectedRow.scannedQr || '-'}
                  <br />
                  {t('kkd.operational.validationLog.metaBarcode')}: {selectedRow.scannedBarcode || '-'}
                  <br />
                  {t('kkd.operational.validationLog.metaWh')}: {selectedRow.warehouseId || '-'}
                  <br />
                  {t('kkd.operational.validationLog.metaDevice')}: {selectedRow.deviceInfo || '-'}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                {t('kkd.operational.validationLog.pickLog')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
