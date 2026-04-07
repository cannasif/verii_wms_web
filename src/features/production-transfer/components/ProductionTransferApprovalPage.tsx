import { type ReactElement, useEffect, useMemo } from 'react';
import { Check, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PageActionBar, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import type { ProductionTransferListItem } from '../types/production-transfer';
import { useAwaitingApprovalProductionTransferHeaders } from '../hooks/useAwaitingApprovalProductionTransferHeaders';
import { useApproveProductionTransfer } from '../hooks/useApproveProductionTransfer';

type ColumnKey = 'id' | 'documentNo' | 'documentDate' | 'transferPurpose' | 'sourceWarehouse' | 'targetWarehouse' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'productionTransfer.approval.id' },
  { value: 'documentNo', type: 'string', labelKey: 'productionTransfer.approval.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'productionTransfer.approval.documentDate' },
  { value: 'transferPurpose', type: 'string', labelKey: 'productionTransfer.approval.transferPurpose' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'productionTransfer.approval.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'productionTransfer.approval.targetWarehouse' },
];

export function ProductionTransferApprovalPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const approveMutation = useApproveProductionTransfer();
  const pagedGrid = usePagedDataGrid<ColumnKey>({ pageKey: 'production-transfer-approval-list', defaultSortBy: 'id', defaultSortDirection: 'desc', mapSortBy: () => 'Id' });
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'id', label: t('productionTransfer.approval.id'), sortable: false },
    { key: 'documentNo', label: t('productionTransfer.approval.documentNo'), sortable: false },
    { key: 'documentDate', label: t('productionTransfer.approval.documentDate'), sortable: false },
    { key: 'transferPurpose', label: t('productionTransfer.approval.transferPurpose'), sortable: false },
    { key: 'sourceWarehouse', label: t('productionTransfer.approval.sourceWarehouse'), sortable: false },
    { key: 'targetWarehouse', label: t('productionTransfer.approval.targetWarehouse'), sortable: false },
    { key: 'actions', label: t('productionTransfer.approval.actions'), sortable: false },
  ], [t]);
  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({ pageKey: 'production-transfer-approval-list', columns: columns.map(({ key, label }) => ({ key, label })), idColumnKey: 'id' });
  const { data, isLoading, error } = useAwaitingApprovalProductionTransferHeaders(pagedGrid.queryParams);

  useEffect(() => { setPageTitle(t('productionTransfer.approval.title')); return () => setPageTitle(null); }, [setPageTitle, t]);

  const formatDate = (value?: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({ id: item.id, documentNo: item.documentNo || '-', documentDate: formatDate(item.documentDate), transferPurpose: item.transferPurpose || '-', sourceWarehouse: item.sourceWarehouse || '-', targetWarehouse: item.targetWarehouse || '-' })), [data?.data]);
  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });

  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    try {
      await approveMutation.mutateAsync({ id, approved });
      toast.success(approved ? t('productionTransfer.approval.approveSuccess') : t('productionTransfer.approval.rejectSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : approved ? t('productionTransfer.approval.approveError') : t('productionTransfer.approval.rejectError'));
    }
  };

  return (
    <div className="crm-page space-y-6">
      <Card><CardHeader><PageActionBar title={t('productionTransfer.approval.title')} description={t('productionTransfer.approval.searchPlaceholder')} /></CardHeader><CardContent>
        <PagedDataGrid<ProductionTransferListItem, ColumnKey>
          columns={columns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, key) => ({ id: row.id, documentNo: <span className="font-medium">{row.documentNo || '-'}</span>, documentDate: formatDate(row.documentDate), transferPurpose: row.transferPurpose || '-', sourceWarehouse: row.sourceWarehouse || '-', targetWarehouse: row.targetWarehouse || '-' } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('productionTransfer.approval.error')}
          emptyText={t('productionTransfer.approval.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions')}
          actionsHeaderLabel={t('productionTransfer.approval.actions')}
          iconOnlyActions={false}
          renderActionsCell={(row) => <div className="flex items-center justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => navigate(`/production-transfer/detail/${row.id}`)}><Eye className="size-4" /><span className="ml-2">{t('productionTransfer.approval.viewDetails')}</span></Button><Button variant="default" size="sm" disabled={approveMutation.isPending} onClick={() => handleApproval(row.id, true)}><Check className="size-4" /><span className="ml-2">{t('productionTransfer.approval.approve')}</span></Button><Button variant="destructive" size="sm" disabled={approveMutation.isPending} onClick={() => handleApproval(row.id, false)}><X className="size-4" /><span className="ml-2">{t('productionTransfer.approval.reject')}</span></Button></div>}
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
          actionBar={{ pageKey: 'production-transfer-approval-list', userId, columns: columns.map(({ key, label }) => ({ key, label })), visibleColumns, columnOrder, onVisibleColumnsChange: setVisibleColumns, onColumnOrderChange: setColumnOrder, exportFileName: 'production-transfer-approval-list', exportColumns, exportRows, filterColumns, defaultFilterColumn: 'documentNo', draftFilterRows: pagedGrid.draftFilterRows, onDraftFilterRowsChange: pagedGrid.setDraftFilterRows, filterLogic: pagedGrid.filterLogic, onFilterLogicChange: pagedGrid.setFilterLogic, onApplyFilters: pagedGrid.applyAdvancedFilters, onClearFilters: pagedGrid.clearAdvancedFilters, translationNamespace: 'common', appliedFilterCount: pagedGrid.appliedAdvancedFilters.length, search: { ...pagedGrid.searchConfig, placeholder: t('productionTransfer.approval.searchPlaceholder'), className: 'h-9 w-full md:w-64' }, leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" /> }}
        />
      </CardContent></Card>
    </div>
  );
}
