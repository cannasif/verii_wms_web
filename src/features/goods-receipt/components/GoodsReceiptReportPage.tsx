import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { useGrHeaders } from '../hooks/useGrHeaders';
import type { GrHeader } from '../types/goods-receipt';
import { GoodsReceiptDetailDialog } from './GoodsReceiptDetailDialog';

type ColumnKey = 'id' | 'orderId' | 'customerCode' | 'projectCode' | 'documentType' | 'plannedDate' | 'status' | 'createdDate' | 'actions';

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'id': return 'id';
    case 'orderId': return 'orderId';
    case 'customerCode': return 'customerCode';
    case 'projectCode': return 'projectCode';
    case 'documentType': return 'documentType';
    case 'plannedDate': return 'plannedDate';
    case 'createdDate':
    default: return 'createdDate';
  }
}

export function GoodsReceiptReportPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [selectedGrHeaderId, setSelectedGrHeaderId] = useState<number | null>(null);
  const pagedGrid = usePagedDataGrid<ColumnKey>({ pageKey: 'goods-receipt-report', defaultSortBy: 'createdDate', defaultSortDirection: 'desc', defaultPageNumber: 1, pageNumberBase: 1, mapSortBy });
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'id', label: t('goodsReceipt.report.id') },
    { key: 'orderId', label: t('goodsReceipt.report.orderId') },
    { key: 'customerCode', label: t('goodsReceipt.report.customerCode') },
    { key: 'projectCode', label: t('goodsReceipt.report.projectCode') },
    { key: 'documentType', label: t('goodsReceipt.report.documentType') },
    { key: 'plannedDate', label: t('goodsReceipt.report.plannedDate') },
    { key: 'status', label: t('goodsReceipt.report.status'), sortable: false },
    { key: 'createdDate', label: t('goodsReceipt.report.createdDate') },
    { key: 'actions', label: t('goodsReceipt.report.actions'), sortable: false },
  ], [t]);
  const { data, isLoading, error } = useGrHeaders(pagedGrid.queryParams);
  useEffect(() => { setPageTitle(t('goodsReceipt.report.title')); return () => setPageTitle(null); }, [setPageTitle, t]);
  const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const formatDateTime = (value: string | null): string => value ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
  const statusBadge = (item: GrHeader): ReactElement => item.isCompleted ? <Badge variant="default" className="w-fit">{t('goodsReceipt.report.completed')}</Badge> : item.isPendingApproval ? <Badge variant="secondary" className="w-fit">{t('goodsReceipt.report.pendingApproval')}</Badge> : <Badge variant="outline" className="w-fit">{t('goodsReceipt.report.inProgress')}</Badge>;
  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };
  const range = getPagedRange(data, 1);
  const paginationInfoText = t('goodsReceipt.report.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });
  return (
    <div className="crm-page space-y-6">
      <Card><CardHeader><CardTitle>{t('goodsReceipt.report.title')}</CardTitle></CardHeader><CardContent>
        <PagedDataGrid<GrHeader, ColumnKey>
          columns={columns}
          visibleColumnKeys={['id', 'orderId', 'customerCode', 'projectCode', 'documentType', 'plannedDate', 'status', 'createdDate']}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, key) => ({ id: row.id, orderId: <span className="font-medium">{row.orderId || '-'}</span>, customerCode: row.customerCode || '-', projectCode: row.projectCode || '-', documentType: <Badge variant={row.documentType === 'E-İrsaliye' ? 'secondary' : 'default'}>{row.documentType || '-'}</Badge>, plannedDate: formatDate(row.plannedDate), status: statusBadge(row), createdDate: formatDateTime(row.createdDate) } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(key) => { if (key !== 'status' && key !== 'actions') pagedGrid.handleSort(key); }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('goodsReceipt.report.error')}
          emptyText={t('goodsReceipt.report.noData')}
          showActionsColumn
          actionsHeaderLabel={t('goodsReceipt.report.actions')}
          iconOnlyActions={false}
          renderActionsCell={(row) => <Button variant="ghost" size="sm" onClick={() => setSelectedGrHeaderId(row.id)}><Eye className="size-4" /><span className="ml-2">{t('goodsReceipt.report.viewDetails')}</span></Button>}
          pageSize={pagedGrid.pageSize}
          pageSizeOptions={pagedGrid.pageSizeOptions}
          onPageSizeChange={pagedGrid.handlePageSizeChange}
          pageNumber={pagedGrid.getDisplayPageNumber(data)}
          totalPages={data?.totalPages ?? 1}
          hasPreviousPage={data?.hasPreviousPage ?? false}
          hasNextPage={data?.hasNextPage ?? false}
          onPreviousPage={pagedGrid.goToPreviousPage}
          onNextPage={pagedGrid.goToNextPage}
          previousLabel={t('common.previous')}
          nextLabel={t('common.next')}
          paginationInfoText={paginationInfoText}
          actionBar={{ pageKey: 'goods-receipt-report', columns: columns.map(({ key, label }) => ({ key, label })), visibleColumns: columns.map(({ key }) => key), columnOrder: columns.map(({ key }) => key), onVisibleColumnsChange: () => undefined, onColumnOrderChange: () => undefined, exportFileName: 'goods-receipt-report', exportColumns: columns.filter((c) => c.key !== 'actions').map(({ key, label }) => ({ key, label })), exportRows: (data?.data ?? []).map((item) => ({ id: item.id, orderId: item.orderId || '-', customerCode: item.customerCode || '-', projectCode: item.projectCode || '-', documentType: item.documentType || '-', plannedDate: formatDate(item.plannedDate), status: item.isCompleted ? t('goodsReceipt.report.completed') : item.isPendingApproval ? t('goodsReceipt.report.pendingApproval') : t('goodsReceipt.report.inProgress'), createdDate: formatDateTime(item.createdDate) })), filterColumns: [], defaultFilterColumn: 'orderId', draftFilterRows: [], onDraftFilterRowsChange: () => undefined, onApplyFilters: () => undefined, onClearFilters: () => undefined, appliedFilterCount: 0, search: { ...pagedGrid.searchConfig, placeholder: t('goodsReceipt.report.searchPlaceholder'), className: 'h-9 w-full md:w-64' }, leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" /> }}
        />
      </CardContent></Card>
      {selectedGrHeaderId && <GoodsReceiptDetailDialog grHeaderId={selectedGrHeaderId} isOpen onClose={() => setSelectedGrHeaderId(null)} />}
    </div>
  );
}
