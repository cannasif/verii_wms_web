import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import type { SubcontractingHeader } from '../types/subcontracting';
import { useApproveSrtHeader } from '../hooks/useApproveSrtHeader';
import { useAwaitingApprovalSrtHeaders } from '../hooks/useAwaitingApprovalSrtHeaders';
import { SubcontractingDetailDialog } from './SubcontractingDetailDialog';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';

type ColumnKey = 'id' | 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'sourceWarehouse' | 'targetWarehouse' | 'completionDate' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'subcontracting.receipt.approval.id' },
  { value: 'documentNo', type: 'string', labelKey: 'subcontracting.receipt.approval.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'subcontracting.receipt.approval.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'subcontracting.receipt.approval.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'subcontracting.receipt.approval.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'subcontracting.receipt.approval.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'subcontracting.receipt.approval.targetWarehouse' },
  { value: 'completionDate', type: 'date', labelKey: 'subcontracting.receipt.approval.completionDate' },
];

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'id': return 'id';
    case 'documentNo': return 'documentNo';
    case 'documentDate': return 'documentDate';
    case 'customerCode': return 'customerCode';
    case 'customerName': return 'customerName';
    case 'sourceWarehouse': return 'sourceWarehouse';
    case 'targetWarehouse': return 'targetWarehouse';
    case 'completionDate': return 'completionDate';
    default: return 'id';
  }
}

export function SubcontractingReceiptApprovalPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.subcontracting.receipt');
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const approveMutation = useApproveSrtHeader();
  const pagedGrid = usePagedDataGrid<ColumnKey>({ pageKey: 'subcontracting-receipt-approval-list', defaultSortBy: 'id', defaultSortDirection: 'desc', mapSortBy });
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'id', label: t('subcontracting.receipt.approval.id') },
    { key: 'documentNo', label: t('subcontracting.receipt.approval.documentNo') },
    { key: 'documentDate', label: t('subcontracting.receipt.approval.documentDate') },
    { key: 'customerCode', label: t('subcontracting.receipt.approval.customerCode') },
    { key: 'customerName', label: t('subcontracting.receipt.approval.customerName') },
    { key: 'sourceWarehouse', label: t('subcontracting.receipt.approval.sourceWarehouse') },
    { key: 'targetWarehouse', label: t('subcontracting.receipt.approval.targetWarehouse') },
    { key: 'completionDate', label: t('subcontracting.receipt.approval.completionDate') },
    { key: 'actions', label: t('subcontracting.receipt.approval.actions'), sortable: false },
  ], [t]);
  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey: 'subcontracting-receipt-approval-list',
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
  });
  const { data, isLoading, error } = useAwaitingApprovalSrtHeaders(pagedGrid.queryParams);
  useEffect(() => { setPageTitle(t('subcontracting.receipt.approval.title')); return () => setPageTitle(null); }, [setPageTitle, t]);
  const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const formatDateTime = (value: string | null): string => value ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
  const exportColumns = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({
      key,
      label: columns.find((column) => column.key === key)?.label ?? key,
    })),
    [columns, orderedVisibleColumns],
  );
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({
    id: item.id,
    documentNo: item.documentNo || '-',
    documentDate: formatDate(item.documentDate),
    customerCode: item.customerCode || '-',
    customerName: item.customerName || '-',
    sourceWarehouse: item.sourceWarehouse || '-',
    targetWarehouse: item.targetWarehouse || '-',
    completionDate: formatDateTime(item.completionDate),
  })), [data?.data]);
  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });
  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    if (!permission.canApprove) {
      return;
    }

    try { await approveMutation.mutateAsync({ id, approved }); toast.success(approved ? t('subcontracting.receipt.approval.approveSuccess') : t('subcontracting.receipt.approval.rejectSuccess')); }
    catch (err) { toast.error(err instanceof Error ? err.message : approved ? t('subcontracting.receipt.approval.approveError') : t('subcontracting.receipt.approval.rejectError')); }
  };
  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>{t('subcontracting.receipt.approval.title')}</CardTitle></CardHeader><CardContent>
        <PagedDataGrid<SubcontractingHeader, ColumnKey>
          columns={columns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, key) => ({ id: row.id, documentNo: <span className="font-medium">{row.documentNo || '-'}</span>, documentDate: formatDate(row.documentDate), customerCode: row.customerCode || '-', customerName: row.customerName || '-', sourceWarehouse: row.sourceWarehouse || '-', targetWarehouse: row.targetWarehouse || '-', completionDate: formatDateTime(row.completionDate) } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(key) => { if (key !== 'actions') pagedGrid.handleSort(key); }}
          renderSortIcon={(key) => {
            if (key !== pagedGrid.sortBy) return null;
            return pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
          }}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('subcontracting.receipt.approval.error')}
          emptyText={t('subcontracting.receipt.approval.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions') && (permission.canView || permission.canApprove)}
          actionsHeaderLabel={t('subcontracting.receipt.approval.actions')}
          renderActionsCell={(row) => <div className="flex items-center justify-end gap-2"><Button variant="ghost" size="sm" disabled={!permission.canView} onClick={() => { setSelectedHeaderId(row.id); setSelectedDocumentType(row.documentType); }}><Eye className="size-4" /><span className="ml-2">{t('subcontracting.receipt.approval.viewDetails')}</span></Button><Button variant="default" size="sm" disabled={!permission.canApprove || approveMutation.isPending} onClick={() => handleApproval(row.id, true)}><Check className="size-4" /><span className="ml-2">{t('subcontracting.receipt.approval.approve')}</span></Button><Button variant="destructive" size="sm" disabled={!permission.canApprove || approveMutation.isPending} onClick={() => handleApproval(row.id, false)}><X className="size-4" /><span className="ml-2">{t('subcontracting.receipt.approval.reject')}</span></Button></div>}
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
            pageKey: 'subcontracting-receipt-approval-list',
            userId,
            columns: columns.map(({ key, label }) => ({ key, label })),
            visibleColumns,
            columnOrder,
            onVisibleColumnsChange: setVisibleColumns,
            onColumnOrderChange: setColumnOrder,
            exportFileName: 'subcontracting-receipt-approval-list',
            exportColumns,
            exportRows,
            filterColumns,
            defaultFilterColumn: 'documentNo',
            draftFilterRows: pagedGrid.draftFilterRows,
            onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
            filterLogic: pagedGrid.filterLogic,
            onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters,
            onClearFilters: pagedGrid.clearAdvancedFilters,
            translationNamespace: 'common',
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: { ...pagedGrid.searchConfig, placeholder: t('subcontracting.receipt.approval.searchPlaceholder'), className: 'h-9 w-full md:w-64' },
            leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />
          }}
        />
      </CardContent></Card>
      {selectedHeaderId && selectedDocumentType && <SubcontractingDetailDialog headerId={selectedHeaderId} documentType={selectedDocumentType} isOpen onClose={() => { setSelectedHeaderId(null); setSelectedDocumentType(null); }} />}
    </div>
  );
}
