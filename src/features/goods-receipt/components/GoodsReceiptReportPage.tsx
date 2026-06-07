import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Pencil, Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { useGrHeaders } from '../hooks/useGrHeaders';
import type { GrHeader } from '../types/goods-receipt';
import { GoodsReceiptDetailDialog } from './GoodsReceiptDetailDialog';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';

type ColumnKey = 'id' | 'orderId' | 'customerCode' | 'projectCode' | 'documentType' | 'plannedDate' | 'status' | 'createdDate' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'goodsReceipt.report.id' },
  { value: 'orderId', type: 'string', labelKey: 'goodsReceipt.report.orderId' },
  { value: 'customerCode', type: 'string', labelKey: 'goodsReceipt.report.customerCode' },
  { value: 'projectCode', type: 'string', labelKey: 'goodsReceipt.report.projectCode' },
  { value: 'documentType', type: 'string', labelKey: 'goodsReceipt.report.documentType' },
  { value: 'plannedDate', type: 'date', labelKey: 'goodsReceipt.report.plannedDate' },
  { value: 'createdDate', type: 'date', labelKey: 'goodsReceipt.report.createdDate' },
];
const ElectronicDispatchDocumentType = 'E-İrsaliye';

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
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.goods-receipt');
  const [selectedGrHeaderId, setSelectedGrHeaderId] = useState<number | null>(null);
  const [headerToDelete, setHeaderToDelete] = useState<GrHeader | null>(null);
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
  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey: 'goods-receipt-report',
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
  });
  const { data, isLoading, error, refetch } = useGrHeaders(pagedGrid.queryParams);
  const deleteMutation = useMutation({
    mutationFn: (id: number) => goodsReceiptApi.deleteGoodsReceiptHeader(id),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('common.errors.deleteFailed'));
      }
      toast.success(response.message || t('common.deleteSuccess'));
      setHeaderToDelete(null);
      await refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message || t('common.errors.deleteFailed'));
    },
  });
  useEffect(() => { setPageTitle(t('goodsReceipt.report.title')); return () => setPageTitle(null); }, [setPageTitle, t]);
  const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const formatDateTime = (value: string | null): string => value ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
  const statusBadge = (item: GrHeader): ReactElement => item.isCompleted ? <Badge variant="default" className="w-fit">{t('goodsReceipt.report.completed')}</Badge> : item.isPendingApproval ? <Badge variant="secondary" className="w-fit">{t('goodsReceipt.report.pendingApproval')}</Badge> : <Badge variant="outline" className="w-fit">{t('goodsReceipt.report.inProgress')}</Badge>;
  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };
  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({ id: item.id, orderId: item.orderId || '-', customerCode: item.customerCode || '-', projectCode: item.projectCode || '-', documentType: item.documentType || '-', plannedDate: formatDate(item.plannedDate), status: item.isCompleted ? t('goodsReceipt.report.completed') : item.isPendingApproval ? t('goodsReceipt.report.pendingApproval') : t('goodsReceipt.report.inProgress'), createdDate: formatDateTime(item.createdDate) })), [data?.data, t]);
  const range = getPagedRange(data, 1);
  const paginationInfoText = t('goodsReceipt.report.paginationInfo', { current: range.from, total: range.to, totalCount: range.total });
  return (
    <div className="crm-page space-y-6">
      {!permission.canMutate ? <PermissionNotice /> : null}
      <Card><CardHeader><CardTitle>{t('goodsReceipt.report.title')}</CardTitle></CardHeader><CardContent>
        <PagedDataGrid<GrHeader, ColumnKey>
          columns={columns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, key) => ({ id: row.id, orderId: <span className="font-medium">{row.orderId || '-'}</span>, customerCode: row.customerCode || '-', projectCode: row.projectCode || '-', documentType: <Badge variant={row.documentType === ElectronicDispatchDocumentType ? 'secondary' : 'default'}>{row.documentType || '-'}</Badge>, plannedDate: formatDate(row.plannedDate), status: statusBadge(row), createdDate: formatDateTime(row.createdDate) } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(key) => { if (key !== 'status' && key !== 'actions') pagedGrid.handleSort(key); }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('goodsReceipt.report.error')}
          emptyText={t('goodsReceipt.report.noData')}
          showActionsColumn={permission.canView || permission.canUpdate || permission.canDelete}
          actionsHeaderLabel={t('goodsReceipt.report.actions')}
          iconOnlyActions={false}
          renderActionsCell={(row) => (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedGrHeaderId(row.id)} disabled={!permission.canView}><Eye className="size-4" /><span className="ml-2">{t('goodsReceipt.report.viewDetails')}</span></Button>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/goods-receipt/edit/${row.id}`)} disabled={!permission.canUpdate || row.isCompleted}><Pencil className="size-4" /><span className="ml-2">{t('common.edit')}</span></Button>
              <Button variant="destructive" size="sm" onClick={() => setHeaderToDelete(row)} disabled={!permission.canDelete || deleteMutation.isPending}><Trash2 className="size-4" /><span className="ml-2">{t('common.delete')}</span></Button>
            </div>
          )}
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
          actionBar={{
            pageKey: 'goods-receipt-report',
            userId,
            columns: columns.map(({ key, label }) => ({ key, label })),
            visibleColumns,
            columnOrder,
            onVisibleColumnsChange: setVisibleColumns,
            onColumnOrderChange: setColumnOrder,
            exportFileName: 'goods-receipt-report',
            exportColumns,
            exportRows,
            filterColumns,
            defaultFilterColumn: 'orderId',
            draftFilterRows: pagedGrid.draftFilterRows,
            onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
            filterLogic: pagedGrid.filterLogic,
            onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters,
            onClearFilters: pagedGrid.clearAdvancedFilters,
            translationNamespace: 'common',
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: { ...pagedGrid.searchConfig, placeholder: t('goodsReceipt.report.searchPlaceholder'), className: 'h-9 w-full md:w-64' },
            leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />
          }}
        />
      </CardContent></Card>
      {selectedGrHeaderId && <GoodsReceiptDetailDialog grHeaderId={selectedGrHeaderId} isOpen onClose={() => setSelectedGrHeaderId(null)} />}
      <DeleteConfirmDialog
        open={Boolean(headerToDelete)}
        itemLabel={headerToDelete?.orderId || `#${headerToDelete?.id ?? ''}`}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setHeaderToDelete(null);
        }}
        onConfirm={() => {
          if (headerToDelete) deleteMutation.mutate(headerToDelete.id);
        }}
      />
    </div>
  );
}
