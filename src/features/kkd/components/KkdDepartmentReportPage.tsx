import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { kkdApi } from '../api/kkd.api';
import type { KkdDepartmentUsageReportDto } from '../types/kkd.types';

type ColumnKey = 'departmentCode' | 'departmentName' | 'employeeCount' | 'distributionCount' | 'totalQuantity' | 'lastUsageDate';

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'departmentCode':
      return 'DepartmentCode';
    case 'departmentName':
      return 'DepartmentName';
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

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}

export function KkdDepartmentReportPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const [selectedRow, setSelectedRow] = useState<KkdDepartmentUsageReportDto | null>(null);
  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey: 'kkd-department-report-grid',
    defaultSortBy: 'totalQuantity',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle('KKD Bölüm Raporu');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  const query = useQuery({
    queryKey: ['kkd', 'reports', 'departments', pagedGrid.queryParams],
    queryFn: ({ signal }) => kkdApi.getDepartmentUsageReports(pagedGrid.queryParams, { signal }),
    retry: false,
  });

  const rows = query.data?.data ?? [];
  const range = getPagedRange(query.data);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'departmentCode', label: 'Bölüm Kodu' },
    { key: 'departmentName', label: 'Bölüm Adı' },
    { key: 'employeeCount', label: 'Çalışan' },
    { key: 'distributionCount', label: 'Belge' },
    { key: 'totalQuantity', label: 'Toplam Miktar' },
    { key: 'lastUsageDate', label: 'Son Hareket' },
  ], []);

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb items={[{ label: 'Operasyonlar' }, { label: 'KKD Bölüm Raporu', isActive: true }]} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Bölüm Bazlı Kullanım</CardTitle>
          </CardHeader>
          <CardContent>
            <PagedDataGrid<KkdDepartmentUsageReportDto, ColumnKey>
              pageKey="kkd-department-report"
              columns={columns}
              rows={rows}
              rowKey={(row) => `${row.departmentId ?? 0}-${row.departmentCode ?? 'unknown'}`}
              renderCell={(row, columnKey) => {
                switch (columnKey) {
                  case 'departmentCode':
                    return row.departmentCode || '-';
                  case 'departmentName':
                    return row.departmentName || 'Tanımsız';
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
              previousLabel="Önceki"
              nextLabel="Sonraki"
              paginationInfoText={`${range.from}-${range.to} / ${range.total}`}
              isLoading={query.isLoading}
              isError={query.isError}
              errorText="Bölüm raporu yüklenemedi."
              emptyText="Bölüm raporu bulunamadı."
              search={{
                value: pagedGrid.searchInput,
                onValueChange: pagedGrid.searchConfig.onValueChange,
                onSearchChange: pagedGrid.searchConfig.onSearchChange,
                placeholder: 'Bölüm kodu veya adı ara',
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bölüm Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRow ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Bölüm</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                    {selectedRow.departmentCode || '-'} - {selectedRow.departmentName || 'Tanımsız'}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Toplam Miktar</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{selectedRow.totalQuantity}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Belge / Çalışan</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                      {selectedRow.distributionCount} / {selectedRow.employeeCount}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                  Son hareket: {formatDate(selectedRow.lastUsageDate)}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                Soldan bir bölüm seçtiğinde özet burada görünür.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
