import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import type { SubcontractingHeader } from '../types/subcontracting';
import { useApproveSitHeader } from '../hooks/useApproveSitHeader';
import { useAwaitingApprovalSitHeaders } from '../hooks/useAwaitingApprovalSitHeaders';
import { SubcontractingDetailDialog } from './SubcontractingDetailDialog';

type ColumnKey = 'id' | 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'sourceWarehouse' | 'targetWarehouse' | 'completionDate' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'subcontracting.issue.approval.id' },
  { value: 'documentNo', type: 'string', labelKey: 'subcontracting.issue.approval.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'subcontracting.issue.approval.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'subcontracting.issue.approval.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'subcontracting.issue.approval.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'subcontracting.issue.approval.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'subcontracting.issue.approval.targetWarehouse' },
  { value: 'completionDate', type: 'date', labelKey: 'subcontracting.issue.approval.completionDate' },
];

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'id': return 'Id';
    case 'documentNo': return 'DocumentNo';
    case 'documentDate': return 'DocumentDate';
    case 'customerCode': return 'CustomerCode';
    case 'customerName': return 'CustomerName';
    case 'sourceWarehouse': return 'SourceWarehouse';
    case 'targetWarehouse': return 'TargetWarehouse';
    case 'completionDate': return 'CompletionDate';
    default: return 'Id';
  }
}

export function SubcontractingIssueApprovalPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.subcontracting.issue');
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const approveMutation = useApproveSitHeader();
  const pagedGrid = usePagedDataGrid<ColumnKey>({ pageKey: 'subcontracting-issue-approval-list', defaultSortBy: 'id', defaultSortDirection: 'desc', mapSortBy });
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'id', label: t('subcontracting.issue.approval.id') },
    { key: 'documentNo', label: t('subcontracting.issue.approval.documentNo') },
    { key: 'documentDate', label: t('subcontracting.issue.approval.documentDate') },
    { key: 'customerCode', label: t('subcontracting.issue.approval.customerCode') },
    { key: 'customerName', label: t('subcontracting.issue.approval.customerName') },
    { key: 'sourceWarehouse', label: t('subcontracting.issue.approval.sourceWarehouse') },
    { key: 'targetWarehouse', label: t('subcontracting.issue.approval.targetWarehouse') },
    { key: 'completionDate', label: t('subcontracting.issue.approval.completionDate') },
    { key: 'actions', label: t('subcontracting.issue.approval.actions'), sortable: false },
  ], [t]);
  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({ pageKey: 'subcontracting-issue-approval-list', columns: columns.map(({ key, label }) => ({ key, label })), idColumnKey: 'id' });
  const { data, isLoading, error } = useAwaitingApprovalSitHeaders(pagedGrid.queryParams);
  useEffect(() => { setPageTitle(t('subcontracting.issue.approval.title')); return () => setPageTitle(null); }, [setPageTitle, t]);
  const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const formatDateTime = (value: string | null): string => value ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });
  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({ id: item.id, documentNo: item.documentNo || '-', documentDate: formatDate(item.documentDate), customerCode: item.customerCode || '-', customerName: item.customerName || '-', sourceWarehouse: item.sourceWarehouse || '-', targetWarehouse: item.targetWarehouse || '-', completionDate: formatDateTime(item.completionDate) })), [data?.data]);

  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    if (!permission.canApprove) {
      return;
    }

    try { await approveMutation.mutateAsync({ id, approved }); toast.success(approved ? t('subcontracting.issue.approval.approveSuccess') : t('subcontracting.issue.approval.rejectSuccess')); }
    catch (err) { toast.error(err instanceof Error ? err.message : approved ? t('subcontracting.issue.approval.approveError') : t('subcontracting.issue.approval.rejectError')); }
  };

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>{t('subcontracting.issue.approval.title')}</CardTitle></CardHeader><CardContent>
        <PagedDataGrid<SubcontractingHeader, ColumnKey>
          columns={columns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, key) => ({ id: row.id, documentNo: <span className="font-medium">{row.documentNo || '-'}</span>, documentDate: formatDate(row.documentDate), customerCode: row.customerCode || '-', customerName: row.customerName || '-', sourceWarehouse: row.sourceWarehouse || '-', targetWarehouse: row.targetWarehouse || '-', completionDate: formatDateTime(row.completionDate) } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey !== 'actions') pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('subcontracting.issue.approval.error')}
          emptyText={t('subcontracting.issue.approval.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions') && (permission.canView || permission.canApprove)}
          actionsHeaderLabel={t('subcontracting.issue.approval.actions')}
          renderActionsCell={(row) => <div className="flex items-center justify-end gap-2"><Button variant="ghost" size="sm" disabled={!permission.canView} onClick={() => { setSelectedHeaderId(row.id); setSelectedDocumentType(row.documentType); }}><Eye className="size-4" /><span className="ml-2">{t('subcontracting.issue.approval.viewDetails')}</span></Button><Button variant="default" size="sm" disabled={!permission.canApprove || approveMutation.isPending} onClick={() => handleApproval(row.id, true)}><Check className="size-4" /><span className="ml-2">{t('subcontracting.issue.approval.approve')}</span></Button><Button variant="destructive" size="sm" disabled={!permission.canApprove || approveMutation.isPending} onClick={() => handleApproval(row.id, false)}><X className="size-4" /><span className="ml-2">{t('subcontracting.issue.approval.reject')}</span></Button></div>}
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
            pageKey: 'subcontracting-issue-approval-list',
            userId,
            columns: columns.map(({ key, label }) => ({ key, label })),
            visibleColumns,
            columnOrder,
            onVisibleColumnsChange: setVisibleColumns,
            onColumnOrderChange: setColumnOrder,
            exportFileName: 'subcontracting-issue-approval-list',
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
            search: { ...pagedGrid.searchConfig, placeholder: t('subcontracting.issue.approval.searchPlaceholder'), className: 'h-9 w-full md:w-64' },
            leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />
          }}
        />
      </CardContent></Card>
      {selectedHeaderId && selectedDocumentType && <SubcontractingDetailDialog headerId={selectedHeaderId} documentType={selectedDocumentType} isOpen onClose={() => { setSelectedHeaderId(null); setSelectedDocumentType(null); }} />}
    </div>
  );
}
