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
import type { ProductionHeaderListItem } from '../types/production';
import { useAwaitingApprovalProductionHeaders } from '../hooks/useAwaitingApprovalProductionHeaders';
import { useApproveProductionHeader } from '../hooks/useApproveProductionHeader';

type ColumnKey = 'id' | 'documentNo' | 'documentDate' | 'mainStockCode' | 'mainYapKod' | 'plannedQuantity' | 'completedQuantity' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'production.approval.id' },
  { value: 'documentNo', type: 'string', labelKey: 'production.approval.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'production.approval.documentDate' },
  { value: 'mainStockCode', type: 'string', labelKey: 'production.approval.mainStockCode' },
  { value: 'mainYapKod', type: 'string', labelKey: 'production.approval.mainYapKod' },
];

export function ProductionApprovalPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const approveMutation = useApproveProductionHeader();
  const pagedGrid = usePagedDataGrid<ColumnKey>({ pageKey: 'production-approval-list', defaultSortBy: 'id', defaultSortDirection: 'desc', mapSortBy: () => 'Id' });
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'id', label: t('production.approval.id'), sortable: false },
    { key: 'documentNo', label: t('production.approval.documentNo'), sortable: false },
    { key: 'documentDate', label: t('production.approval.documentDate'), sortable: false },
    { key: 'mainStockCode', label: t('production.approval.mainStockCode'), sortable: false },
    { key: 'mainYapKod', label: t('production.approval.mainYapKod'), sortable: false },
    { key: 'plannedQuantity', label: t('production.approval.plannedQuantity'), sortable: false },
    { key: 'completedQuantity', label: t('production.approval.completedQuantity'), sortable: false },
    { key: 'actions', label: t('production.approval.actions'), sortable: false },
  ], [t]);
  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({ pageKey: 'production-approval-list', columns: columns.map(({ key, label }) => ({ key, label })), idColumnKey: 'id' });
  const { data, isLoading, error } = useAwaitingApprovalProductionHeaders(pagedGrid.queryParams);

  useEffect(() => { setPageTitle(t('production.approval.title')); return () => setPageTitle(null); }, [setPageTitle, t]);

  const formatDate = (value?: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({ id: item.id, documentNo: item.documentNo || '-', documentDate: formatDate(item.documentDate), mainStockCode: item.mainStockCode || '-', mainYapKod: item.mainYapKod || '-', plannedQuantity: item.plannedQuantity ?? 0, completedQuantity: item.completedQuantity ?? 0 })), [data?.data]);
  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });

  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    try {
      await approveMutation.mutateAsync({ id, approved });
      toast.success(approved ? t('production.approval.approveSuccess') : t('production.approval.rejectSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : approved ? t('production.approval.approveError') : t('production.approval.rejectError'));
    }
  };

  return (
    <div className="crm-page space-y-6">
      <Card><CardHeader><PageActionBar title={t('production.approval.title')} description={t('production.approval.searchPlaceholder')} /></CardHeader><CardContent>
        <PagedDataGrid<ProductionHeaderListItem, ColumnKey>
          columns={columns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, key) => ({ id: row.id, documentNo: <span className="font-medium">{row.documentNo || '-'}</span>, documentDate: formatDate(row.documentDate), mainStockCode: row.mainStockCode || '-', mainYapKod: row.mainYapKod || '-', plannedQuantity: row.plannedQuantity ?? 0, completedQuantity: row.completedQuantity ?? 0 } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('production.approval.error')}
          emptyText={t('production.approval.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions')}
          actionsHeaderLabel={t('production.approval.actions')}
          iconOnlyActions={false}
          renderActionsCell={(row) => <div className="flex items-center justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => navigate(`/production/detail/${row.id}`)}><Eye className="size-4" /><span className="ml-2">{t('production.approval.viewDetails')}</span></Button><Button variant="default" size="sm" disabled={approveMutation.isPending} onClick={() => handleApproval(row.id, true)}><Check className="size-4" /><span className="ml-2">{t('production.approval.approve')}</span></Button><Button variant="destructive" size="sm" disabled={approveMutation.isPending} onClick={() => handleApproval(row.id, false)}><X className="size-4" /><span className="ml-2">{t('production.approval.reject')}</span></Button></div>}
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
          actionBar={{ pageKey: 'production-approval-list', userId, columns: columns.map(({ key, label }) => ({ key, label })), visibleColumns, columnOrder, onVisibleColumnsChange: setVisibleColumns, onColumnOrderChange: setColumnOrder, exportFileName: 'production-approval-list', exportColumns, exportRows, filterColumns, defaultFilterColumn: 'documentNo', draftFilterRows: pagedGrid.draftFilterRows, onDraftFilterRowsChange: pagedGrid.setDraftFilterRows, filterLogic: pagedGrid.filterLogic, onFilterLogicChange: pagedGrid.setFilterLogic, onApplyFilters: pagedGrid.applyAdvancedFilters, onClearFilters: pagedGrid.clearAdvancedFilters, translationNamespace: 'common', appliedFilterCount: pagedGrid.appliedAdvancedFilters.length, search: { ...pagedGrid.searchConfig, placeholder: t('production.approval.searchPlaceholder'), className: 'h-9 w-full md:w-64' }, leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" /> }}
        />
      </CardContent></Card>
    </div>
  );
}
