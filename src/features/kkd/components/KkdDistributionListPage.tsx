import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
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

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}

export function KkdDistributionListPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const [selectedHeader, setSelectedHeader] = useState<KkdDistributionHeaderDto | null>(null);
  const pagedGrid = usePagedDataGrid<DistributionColumnKey>({
    pageKey: 'kkd-distribution-list-grid',
    defaultSortBy: 'documentDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle('KKD Dağıtım Listesi');
    return () => setPageTitle(null);
  }, [setPageTitle]);

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
      { key: 'documentNo', label: 'Belge No' },
      { key: 'documentDate', label: 'Belge Tarihi' },
      { key: 'customerCode', label: 'Cari' },
      { key: 'employee', label: 'Çalışan' },
      { key: 'warehouseId', label: 'Depo' },
      { key: 'status', label: 'Durum' },
      { key: 'sourceChannel', label: 'Kaynak' },
      { key: 'lineCount', label: 'Satır' },
      { key: 'totalQuantity', label: 'Toplam Miktar' },
      { key: 'erpStatus', label: 'ERP Durumu' },
    ],
    [],
  );

  const detail = detailQuery.data ?? selectedHeader;

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb items={[{ label: 'Operasyonlar' }, { label: 'KKD Dağıtım Listesi', isActive: true }]} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>KKD Belgeleri</CardTitle>
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
                    return formatDate(row.documentDate);
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
              previousLabel="Önceki"
              nextLabel="Sonraki"
              paginationInfoText={`${range.from}-${range.to} / ${range.total}`}
              isLoading={query.isLoading}
              isError={query.isError}
              errorText="KKD dağıtım listesi yüklenemedi."
              emptyText="KKD belgesi bulunamadı."
              search={{
                value: pagedGrid.searchInput,
                onValueChange: pagedGrid.searchConfig.onValueChange,
                onSearchChange: pagedGrid.searchConfig.onSearchChange,
                placeholder: 'Belge no, cari, çalışan veya durum ara',
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Belge Özeti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {detail ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge>{detail.documentNo || `Header #${detail.id}`}</Badge>
                  <Badge variant="secondary">{detail.status}</Badge>
                  <Badge variant="outline">{detail.sourceChannel}</Badge>
                  <Badge variant="outline">ERP: {detail.erpIntegrationStatus || '-'}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Cari / Çalışan</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                      {detail.customerCode || '-'} / #{detail.employeeId}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Belge / Tamamlanma</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                      {formatDate(detail.documentDate)} / {formatDate(detail.completionDate)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Satırlar</h2>
                  {detailQuery.isLoading ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      Belge satırları yükleniyor...
                    </div>
                  ) : detail.lines.length ? (
                    detail.lines.map((line) => (
                      <div key={line.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="flex flex-wrap gap-2">
                          <Badge>{line.stockCode}</Badge>
                          {line.groupCode ? <Badge variant="secondary">{line.groupCode}</Badge> : null}
                          <Badge variant="outline">Miktar: {line.quantity}</Badge>
                          <Badge variant="outline">{line.entitlementType}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                          Barkod: {line.barcode || '-'} | Seri: {line.serialNo || '-'} | Raf: {line.shelfId || '-'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      Belge seçildiğinde satırlar burada gösterilir.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                Soldan bir KKD belgesi seçtiğinde detayları burada göreceksin.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
