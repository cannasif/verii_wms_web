import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getLocaleForFormatting } from '@/lib/i18n';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';
import type { KkdRoleUsageReportDto } from '../types/kkd.types';

type ColumnKey = 'roleCode' | 'roleName' | 'employeeCount' | 'distributionCount' | 'totalQuantity' | 'lastUsageDate';

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'roleCode':
      return 'RoleCode';
    case 'roleName':
      return 'RoleName';
    case 'employeeCount':
      return 'EmployeeCount';
    case 'distributionCount':
      return 'DistributionCount';
    case 'totalQuantity':
      return 'TotalQuantity';
    case 'lastUsageDate':
      return 'LastUsageDate';
    default:
      return 'TotalQuantity';
  }
}

export function KkdRoleReportPage(): ReactElement {
  const { t, i18n } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const [selectedRow, setSelectedRow] = useState<KkdRoleUsageReportDto | null>(null);
  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey: 'kkd-role-report-grid',
    defaultSortBy: 'totalQuantity',
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
    setPageTitle(t('kkd.operational.roleReport.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useQuery({
    queryKey: ['kkd', 'reports', 'roles', pagedGrid.queryParams],
    queryFn: ({ signal }) => kkdApi.getRoleUsageReports(pagedGrid.queryParams, { signal }),
    retry: false,
  });

  const rows = query.data?.data ?? [];
  const range = getPagedRange(query.data);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(
    () => [
      { key: 'roleCode', label: t('kkd.operational.reports.colRoleCode') },
      { key: 'roleName', label: t('kkd.operational.reports.colRoleName') },
      { key: 'employeeCount', label: t('kkd.operational.reports.colEmployees') },
      { key: 'distributionCount', label: t('kkd.operational.reports.colDocs') },
      { key: 'totalQuantity', label: t('kkd.operational.reports.colQty') },
      { key: 'lastUsageDate', label: t('kkd.operational.reports.colLast') },
    ],
    [t],
  );

  const undefinedName = t('kkd.operational.common.undefinedName');

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.operationsGroup') },
          { label: t('kkd.operational.roleReport.breadcrumb'), isActive: true },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.reports.summaryRole')}</CardTitle>
          </CardHeader>
          <CardContent>
            <PagedDataGrid<KkdRoleUsageReportDto, ColumnKey>
              pageKey="kkd-role-report"
              columns={columns}
              rows={rows}
              rowKey={(row) => `${row.roleId ?? 0}-${row.roleCode ?? 'unknown'}`}
              renderCell={(row, columnKey) => {
                switch (columnKey) {
                  case 'roleCode':
                    return row.roleCode || '-';
                  case 'roleName':
                    return row.roleName || undefinedName;
                  case 'employeeCount':
                    return row.employeeCount;
                  case 'distributionCount':
                    return row.distributionCount;
                  case 'totalQuantity':
                    return row.totalQuantity;
                  case 'lastUsageDate':
                    return formatDate(row.lastUsageDate);
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
              errorText={t('kkd.operational.reports.errRole')}
              emptyText={t('kkd.operational.reports.emptyRole')}
              search={{
                value: pagedGrid.searchInput,
                onValueChange: pagedGrid.searchConfig.onValueChange,
                onSearchChange: pagedGrid.searchConfig.onSearchChange,
                placeholder: t('kkd.operational.reports.roleSearchPh'),
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('kkd.operational.reports.summaryK')}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRow ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {t('kkd.operational.reports.labelRole')}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                    {selectedRow.roleCode || '-'} - {selectedRow.roleName || undefinedName}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {t('kkd.operational.reports.labelQty')}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{selectedRow.totalQuantity}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {t('kkd.operational.reports.labelDocEmp')}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                      {selectedRow.distributionCount} / {selectedRow.employeeCount}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                  {t('kkd.operational.reports.lastMove')}: {formatDate(selectedRow.lastUsageDate)}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                {t('kkd.operational.reports.pickRowRole')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
