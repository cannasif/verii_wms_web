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
import type { AwaitingApprovalHeader } from '../types/transfer';
import { useApproveTransfer } from '../hooks/useApproveTransfer';
import { useAwaitingApprovalHeaders } from '../hooks/useAwaitingApprovalHeaders';
import { TransferDetailDialog } from './TransferDetailDialog';

type ColumnKey = 'id' | 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'sourceWarehouse' | 'targetWarehouse' | 'completionDate' | 'actions';
const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'transfer.approval.id' },
  { value: 'documentNo', type: 'string', labelKey: 'transfer.approval.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'transfer.approval.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'transfer.approval.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'transfer.approval.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'transfer.approval.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'transfer.approval.targetWarehouse' },
  { value: 'completionDate', type: 'date', labelKey: 'transfer.approval.completionDate' },
];

export function TransferApprovalPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const approveMutation = useApproveTransfer();
  const pagedGrid = usePagedDataGrid<ColumnKey>({ pageKey: 'transfer-approval-list', defaultSortBy: 'id', defaultSortDirection: 'desc', mapSortBy: () => 'Id' });
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'id', label: t('transfer.approval.id'), sortable: false },
    { key: 'documentNo', label: t('transfer.approval.documentNo'), sortable: false },
    { key: 'documentDate', label: t('transfer.approval.documentDate'), sortable: false },
    { key: 'customerCode', label: t('transfer.approval.customerCode'), sortable: false },
    { key: 'customerName', label: t('transfer.approval.customerName'), sortable: false },
    { key: 'sourceWarehouse', label: t('transfer.approval.sourceWarehouse'), sortable: false },
    { key: 'targetWarehouse', label: t('transfer.approval.targetWarehouse'), sortable: false },
    { key: 'completionDate', label: t('transfer.approval.completionDate'), sortable: false },
    { key: 'actions', label: t('transfer.approval.actions'), sortable: false },
  ], [t]);
  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({ pageKey: 'transfer-approval-list', columns: columns.map(({ key, label }) => ({ key, label })), idColumnKey: 'id' });
  const { data, isLoading, error } = useAwaitingApprovalHeaders(pagedGrid.queryParams);

  useEffect(() => { setPageTitle(t('transfer.approval.title')); return () => setPageTitle(null); }, [setPageTitle, t]);
  const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const formatDateTime = (value: string | null): string => value ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({ id: item.id, documentNo: item.documentNo || '-', documentDate: formatDate(item.documentDate), customerCode: item.customerCode || '-', customerName: item.customerName || '-', sourceWarehouse: item.sourceWarehouseName || item.sourceWarehouse || '-', targetWarehouse: item.targetWarehouseName || item.targetWarehouse || '-', completionDate: formatDateTime(item.completionDate) })), [data?.data]);
  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });

  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    try {
      await approveMutation.mutateAsync({ id, approved });
      toast.success(approved ? t('transfer.approval.approveSuccess') : t('transfer.approval.rejectSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : approved ? t('transfer.approval.approveError') : t('transfer.approval.rejectError'));
    }
  };

  return (
    <div className="crm-page space-y-6">
      <Card><CardHeader><PageActionBar title={t('transfer.approval.title')} description={t('transfer.approval.searchPlaceholder')} /></CardHeader><CardContent>
        <PagedDataGrid<AwaitingApprovalHeader, ColumnKey>
          columns={columns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, key) => ({ id: row.id, documentNo: <span className="font-medium">{row.documentNo || '-'}</span>, documentDate: formatDate(row.documentDate), customerCode: row.customerCode || '-', customerName: row.customerName || '-', sourceWarehouse: row.sourceWarehouseName || row.sourceWarehouse || '-', targetWarehouse: row.targetWarehouseName || row.targetWarehouse || '-', completionDate: formatDateTime(row.completionDate) } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('transfer.approval.error')}
          emptyText={t('transfer.approval.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions')}
          actionsHeaderLabel={t('transfer.approval.actions')}
          iconOnlyActions={false}
          renderActionsCell={(row) => <div className="flex items-center justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setSelectedHeaderId(row.id)}><Eye className="size-4" /><span className="ml-2">{t('transfer.approval.viewDetails')}</span></Button><Button variant="default" size="sm" disabled={approveMutation.isPending} onClick={() => handleApproval(row.id, true)}><Check className="size-4" /><span className="ml-2">{t('transfer.approval.approve')}</span></Button><Button variant="destructive" size="sm" disabled={approveMutation.isPending} onClick={() => handleApproval(row.id, false)}><X className="size-4" /><span className="ml-2">{t('transfer.approval.reject')}</span></Button></div>}
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
          actionBar={{ pageKey: 'transfer-approval-list', userId, columns: columns.map(({ key, label }) => ({ key, label })), visibleColumns, columnOrder, onVisibleColumnsChange: setVisibleColumns, onColumnOrderChange: setColumnOrder, exportFileName: 'transfer-approval-list', exportColumns, exportRows, filterColumns, defaultFilterColumn: 'documentNo', draftFilterRows: pagedGrid.draftFilterRows, onDraftFilterRowsChange: pagedGrid.setDraftFilterRows, filterLogic: pagedGrid.filterLogic, onFilterLogicChange: pagedGrid.setFilterLogic, onApplyFilters: pagedGrid.applyAdvancedFilters, onClearFilters: pagedGrid.clearAdvancedFilters, translationNamespace: 'common', appliedFilterCount: pagedGrid.appliedAdvancedFilters.length, search: { ...pagedGrid.searchConfig, placeholder: t('transfer.approval.searchPlaceholder'), className: 'h-9 w-full md:w-64' }, leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" /> }}
        />
      </CardContent></Card>
      {selectedHeaderId && <TransferDetailDialog headerId={selectedHeaderId} isOpen onClose={() => setSelectedHeaderId(null)} />}
    </div>
  );
}
