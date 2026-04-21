import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Check, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PageActionBar, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import type { GrHeader } from '../types/goods-receipt';
import { GoodsReceiptDetailDialog } from './GoodsReceiptDetailDialog';
import { useApproveGrHeader } from '../hooks/useApproveGrHeader';
import { useAwaitingApprovalGrHeaders } from '../hooks/useAwaitingApprovalGrHeaders';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';

type ColumnKey = 'id' | 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'plannedDate' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'goodsReceipt.approval.id' },
  { value: 'documentNo', type: 'string', labelKey: 'goodsReceipt.approval.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'goodsReceipt.approval.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'goodsReceipt.approval.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'goodsReceipt.approval.customerName' },
  { value: 'plannedDate', type: 'date', labelKey: 'goodsReceipt.approval.plannedDate' },
];

export function GoodsReceiptApprovalPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.goods-receipt');
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const approveMutation = useApproveGrHeader();
  const pagedGrid = usePagedDataGrid<ColumnKey>({ pageKey: 'goods-receipt-approval-list', defaultSortBy: 'id', defaultSortDirection: 'desc', mapSortBy: () => 'Id' });
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'id', label: t('goodsReceipt.approval.id'), sortable: false },
    { key: 'documentNo', label: t('goodsReceipt.approval.documentNo'), sortable: false },
    { key: 'documentDate', label: t('goodsReceipt.approval.documentDate'), sortable: false },
    { key: 'customerCode', label: t('goodsReceipt.approval.customerCode'), sortable: false },
    { key: 'customerName', label: t('goodsReceipt.approval.customerName'), sortable: false },
    { key: 'plannedDate', label: t('goodsReceipt.approval.plannedDate'), sortable: false },
    { key: 'actions', label: t('goodsReceipt.approval.actions'), sortable: false },
  ], [t]);
  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({ pageKey: 'goods-receipt-approval-list', columns: columns.map(({ key, label }) => ({ key, label })), idColumnKey: 'id' });
  const { data, isLoading, error } = useAwaitingApprovalGrHeaders(pagedGrid.queryParams);

  useEffect(() => { setPageTitle(t('goodsReceipt.approval.title')); return () => setPageTitle(null); }, [setPageTitle, t]);

  const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({ id: item.id, documentNo: item.documentNo || '-', documentDate: formatDate(item.documentDate), customerCode: item.customerCode || '-', customerName: item.customerName || '-', plannedDate: formatDate(item.plannedDate) })), [data?.data]);
  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });

  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    if (!permission.canUpdate) {
      return;
    }

    try {
      await approveMutation.mutateAsync({ id, approved });
      toast.success(approved ? t('goodsReceipt.approval.approveSuccess') : t('goodsReceipt.approval.rejectSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : approved ? t('goodsReceipt.approval.approveError') : t('goodsReceipt.approval.rejectError'));
    }
  };

  return (
    <div className="crm-page space-y-6">
      <Card><CardHeader><PageActionBar title={t('goodsReceipt.approval.title')} description={t('goodsReceipt.approval.searchPlaceholder')} /></CardHeader><CardContent>
        <PagedDataGrid<GrHeader, ColumnKey>
          columns={columns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, key) => ({ id: row.id, documentNo: <span className="font-medium">{row.documentNo || '-'}</span>, documentDate: formatDate(row.documentDate), customerCode: row.customerCode || '-', customerName: row.customerName || '-', plannedDate: formatDate(row.plannedDate) } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('goodsReceipt.approval.error')}
          emptyText={t('goodsReceipt.approval.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions')}
          actionsHeaderLabel={t('goodsReceipt.approval.actions')}
          iconOnlyActions={false}
          renderActionsCell={(row) => <div className="flex items-center justify-end gap-2"><Button variant="ghost" size="sm" disabled={!permission.canView} onClick={() => setSelectedHeaderId(row.id)}><Eye className="size-4" /><span className="ml-2">{t('goodsReceipt.approval.viewDetails')}</span></Button><Button variant="default" size="sm" disabled={!permission.canUpdate || approveMutation.isPending} onClick={() => handleApproval(row.id, true)}><Check className="size-4" /><span className="ml-2">{t('goodsReceipt.approval.approve')}</span></Button><Button variant="destructive" size="sm" disabled={!permission.canUpdate || approveMutation.isPending} onClick={() => handleApproval(row.id, false)}><X className="size-4" /><span className="ml-2">{t('goodsReceipt.approval.reject')}</span></Button></div>}
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
          actionBar={{ pageKey: 'goods-receipt-approval-list', userId, columns: columns.map(({ key, label }) => ({ key, label })), visibleColumns, columnOrder, onVisibleColumnsChange: setVisibleColumns, onColumnOrderChange: setColumnOrder, exportFileName: 'goods-receipt-approval-list', exportColumns, exportRows, filterColumns, defaultFilterColumn: 'documentNo', draftFilterRows: pagedGrid.draftFilterRows, onDraftFilterRowsChange: pagedGrid.setDraftFilterRows, filterLogic: pagedGrid.filterLogic, onFilterLogicChange: pagedGrid.setFilterLogic, onApplyFilters: pagedGrid.applyAdvancedFilters, onClearFilters: pagedGrid.clearAdvancedFilters, translationNamespace: 'common', appliedFilterCount: pagedGrid.appliedAdvancedFilters.length, search: { ...pagedGrid.searchConfig, placeholder: t('goodsReceipt.approval.searchPlaceholder'), className: 'h-9 w-full md:w-64' }, leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" /> }}
        />
      </CardContent></Card>
      {selectedHeaderId && <GoodsReceiptDetailDialog grHeaderId={selectedHeaderId} isOpen onClose={() => setSelectedHeaderId(null)} />}
    </div>
  );
}
