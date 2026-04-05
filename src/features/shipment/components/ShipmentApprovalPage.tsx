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
import type { ShipmentHeader } from '../types/shipment';
import { useApproveShipment } from '../hooks/useApproveShipment';
import { useAwaitingApprovalShipmentHeaders } from '../hooks/useAwaitingApprovalHeaders';
import { ShipmentDetailDialog } from './ShipmentDetailDialog';

type ColumnKey = 'id' | 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'sourceWarehouse' | 'targetWarehouse' | 'completionDate' | 'actions';
const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'shipment.approval.id' },
  { value: 'documentNo', type: 'string', labelKey: 'shipment.approval.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'shipment.approval.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'shipment.approval.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'shipment.approval.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'shipment.approval.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'shipment.approval.targetWarehouse' },
  { value: 'completionDate', type: 'date', labelKey: 'shipment.approval.completionDate' },
];

export function ShipmentApprovalPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const approveMutation = useApproveShipment();
  const pagedGrid = usePagedDataGrid<ColumnKey>({ pageKey: 'shipment-approval-list', defaultSortBy: 'id', defaultSortDirection: 'desc', mapSortBy: () => 'Id' });
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'id', label: t('shipment.approval.id'), sortable: false },
    { key: 'documentNo', label: t('shipment.approval.documentNo'), sortable: false },
    { key: 'documentDate', label: t('shipment.approval.documentDate'), sortable: false },
    { key: 'customerCode', label: t('shipment.approval.customerCode'), sortable: false },
    { key: 'customerName', label: t('shipment.approval.customerName'), sortable: false },
    { key: 'sourceWarehouse', label: t('shipment.approval.sourceWarehouse'), sortable: false },
    { key: 'targetWarehouse', label: t('shipment.approval.targetWarehouse'), sortable: false },
    { key: 'completionDate', label: t('shipment.approval.completionDate'), sortable: false },
    { key: 'actions', label: t('shipment.approval.actions'), sortable: false },
  ], [t]);
  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({ pageKey: 'shipment-approval-list', columns: columns.map(({ key, label }) => ({ key, label })), idColumnKey: 'id' });
  const { data, isLoading, error } = useAwaitingApprovalShipmentHeaders(pagedGrid.queryParams);
  useEffect(() => { setPageTitle(t('shipment.approval.title')); return () => setPageTitle(null); }, [setPageTitle, t]);
  const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const formatDateTime = (value: string | null): string => value ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({ id: item.id, documentNo: item.documentNo || '-', documentDate: formatDate(item.documentDate), customerCode: item.customerCode || '-', customerName: item.customerName || '-', sourceWarehouse: item.sourceWarehouse || '-', targetWarehouse: item.targetWarehouse || '-', completionDate: formatDateTime(item.completionDate) })), [data?.data]);
  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, count: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });
  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    try { await approveMutation.mutateAsync({ id, approved }); toast.success(approved ? t('shipment.approval.approveSuccess') : t('shipment.approval.rejectSuccess')); }
    catch (err) { toast.error(err instanceof Error ? err.message : approved ? t('shipment.approval.approveError') : t('shipment.approval.rejectError')); }
  };
  return (
    <div className="crm-page space-y-6">
      <Card><CardHeader><PageActionBar title={t('shipment.approval.title')} description={t('shipment.approval.searchPlaceholder')} /></CardHeader><CardContent>
        <PagedDataGrid<ShipmentHeader, ColumnKey>
          columns={columns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, key) => ({ id: row.id, documentNo: <span className="font-medium">{row.documentNo || '-'}</span>, documentDate: formatDate(row.documentDate), customerCode: row.customerCode || '-', customerName: row.customerName || '-', sourceWarehouse: row.sourceWarehouse || '-', targetWarehouse: row.targetWarehouse || '-', completionDate: formatDateTime(row.completionDate) } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('shipment.approval.error')}
          emptyText={t('shipment.approval.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions')}
          actionsHeaderLabel={t('shipment.approval.actions')}
          iconOnlyActions={false}
          renderActionsCell={(row) => <div className="flex items-center justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setSelectedHeaderId(row.id)}><Eye className="size-4" /><span className="ml-2">{t('shipment.approval.viewDetails')}</span></Button><Button variant="default" size="sm" disabled={approveMutation.isPending} onClick={() => handleApproval(row.id, true)}><Check className="size-4" /><span className="ml-2">{t('shipment.approval.approve')}</span></Button><Button variant="destructive" size="sm" disabled={approveMutation.isPending} onClick={() => handleApproval(row.id, false)}><X className="size-4" /><span className="ml-2">{t('shipment.approval.reject')}</span></Button></div>}
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
          actionBar={{ pageKey: 'shipment-approval-list', userId, columns: columns.map(({ key, label }) => ({ key, label })), visibleColumns, columnOrder, onVisibleColumnsChange: setVisibleColumns, onColumnOrderChange: setColumnOrder, exportFileName: 'shipment-approval-list', exportColumns, exportRows, filterColumns, defaultFilterColumn: 'documentNo', draftFilterRows: pagedGrid.draftFilterRows, onDraftFilterRowsChange: pagedGrid.setDraftFilterRows, filterLogic: pagedGrid.filterLogic, onFilterLogicChange: pagedGrid.setFilterLogic, onApplyFilters: pagedGrid.applyAdvancedFilters, onClearFilters: pagedGrid.clearAdvancedFilters, translationNamespace: 'common', appliedFilterCount: pagedGrid.appliedAdvancedFilters.length, search: { ...pagedGrid.searchConfig, placeholder: t('shipment.approval.searchPlaceholder'), className: 'h-9 w-full md:w-64' }, leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" /> }}
        />
      </CardContent></Card>
      {selectedHeaderId && <ShipmentDetailDialog headerId={selectedHeaderId} isOpen onClose={() => setSelectedHeaderId(null)} />}
    </div>
  );
}
