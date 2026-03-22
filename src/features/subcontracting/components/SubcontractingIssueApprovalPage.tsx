import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Check, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { DataTableGrid, type DataTableGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { SubcontractingHeader } from '../types/subcontracting';
import { useApproveSitHeader } from '../hooks/useApproveSitHeader';
import { useAwaitingApprovalSitHeaders } from '../hooks/useAwaitingApprovalSitHeaders';
import { SubcontractingDetailDialog } from './SubcontractingDetailDialog';

type ColumnKey = 'id' | 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'sourceWarehouse' | 'targetWarehouse' | 'completionDate' | 'actions';

export function SubcontractingIssueApprovalPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const approveMutation = useApproveSitHeader();
  const pagedGrid = usePagedDataGrid<ColumnKey>({ pageKey: 'subcontracting-issue-approval-list', defaultSortBy: 'id', defaultSortDirection: 'desc', mapSortBy: () => 'Id' });
  const columns = useMemo<DataTableGridColumn<ColumnKey>[]>(() => [
    { key: 'id', label: t('subcontracting.issue.approval.id'), sortable: false },
    { key: 'documentNo', label: t('subcontracting.issue.approval.documentNo'), sortable: false },
    { key: 'documentDate', label: t('subcontracting.issue.approval.documentDate'), sortable: false },
    { key: 'customerCode', label: t('subcontracting.issue.approval.customerCode'), sortable: false },
    { key: 'customerName', label: t('subcontracting.issue.approval.customerName'), sortable: false },
    { key: 'sourceWarehouse', label: t('subcontracting.issue.approval.sourceWarehouse'), sortable: false },
    { key: 'targetWarehouse', label: t('subcontracting.issue.approval.targetWarehouse'), sortable: false },
    { key: 'completionDate', label: t('subcontracting.issue.approval.completionDate'), sortable: false },
    { key: 'actions', label: t('subcontracting.issue.approval.actions'), sortable: false },
  ], [t]);
  const { data, isLoading, error } = useAwaitingApprovalSitHeaders(pagedGrid.queryParams);
  useEffect(() => { setPageTitle(t('subcontracting.issue.approval.title')); return () => setPageTitle(null); }, [setPageTitle, t]);
  const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const formatDateTime = (value: string | null): string => value ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, count: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });
  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    try { await approveMutation.mutateAsync({ id, approved }); toast.success(approved ? t('subcontracting.issue.approval.approveSuccess') : t('subcontracting.issue.approval.rejectSuccess')); }
    catch (err) { toast.error(err instanceof Error ? err.message : approved ? t('subcontracting.issue.approval.approveError') : t('subcontracting.issue.approval.rejectError')); }
  };
  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>{t('subcontracting.issue.approval.title')}</CardTitle></CardHeader><CardContent>
        <DataTableGrid<SubcontractingHeader, ColumnKey>
          columns={columns}
          visibleColumnKeys={['id', 'documentNo', 'documentDate', 'customerCode', 'customerName', 'sourceWarehouse', 'targetWarehouse', 'completionDate']}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, key) => ({ id: row.id, documentNo: <span className="font-medium">{row.documentNo || '-'}</span>, documentDate: formatDate(row.documentDate), customerCode: row.customerCode || '-', customerName: row.customerName || '-', sourceWarehouse: row.sourceWarehouse || '-', targetWarehouse: row.targetWarehouse || '-', completionDate: formatDateTime(row.completionDate) } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('subcontracting.issue.approval.error')}
          emptyText={t('subcontracting.issue.approval.noData')}
          showActionsColumn
          actionsHeaderLabel={t('subcontracting.issue.approval.actions')}
          iconOnlyActions={false}
          renderActionsCell={(row) => <div className="flex items-center justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => { setSelectedHeaderId(row.id); setSelectedDocumentType(row.documentType); }}><Eye className="size-4" /><span className="ml-2">{t('subcontracting.issue.approval.viewDetails')}</span></Button><Button variant="default" size="sm" disabled={approveMutation.isPending} onClick={() => handleApproval(row.id, true)}><Check className="size-4" /><span className="ml-2">{t('subcontracting.issue.approval.approve')}</span></Button><Button variant="destructive" size="sm" disabled={approveMutation.isPending} onClick={() => handleApproval(row.id, false)}><X className="size-4" /><span className="ml-2">{t('subcontracting.issue.approval.reject')}</span></Button></div>}
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
          actionBar={{ pageKey: 'subcontracting-issue-approval-list', columns: columns.map(({ key, label }) => ({ key, label })), visibleColumns: columns.map(({ key }) => key), columnOrder: columns.map(({ key }) => key), onVisibleColumnsChange: () => undefined, onColumnOrderChange: () => undefined, exportFileName: 'subcontracting-issue-approval-list', exportColumns: columns.filter((c) => c.key !== 'actions').map(({ key, label }) => ({ key, label })), exportRows: (data?.data ?? []).map((item) => ({ id: item.id, documentNo: item.documentNo || '-', documentDate: formatDate(item.documentDate), customerCode: item.customerCode || '-', customerName: item.customerName || '-', sourceWarehouse: item.sourceWarehouse || '-', targetWarehouse: item.targetWarehouse || '-', completionDate: formatDateTime(item.completionDate) })), filterColumns: [], defaultFilterColumn: 'documentNo', draftFilterRows: [], onDraftFilterRowsChange: () => undefined, onApplyFilters: () => undefined, onClearFilters: () => undefined, appliedFilterCount: 0, search: { ...pagedGrid.searchConfig, placeholder: t('subcontracting.issue.approval.searchPlaceholder'), className: 'h-9 w-full md:w-64' }, leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" /> }}
        />
      </CardContent></Card>
      {selectedHeaderId && selectedDocumentType && <SubcontractingDetailDialog headerId={selectedHeaderId} documentType={selectedDocumentType} isOpen onClose={() => { setSelectedHeaderId(null); setSelectedDocumentType(null); }} />}
    </div>
  );
}
