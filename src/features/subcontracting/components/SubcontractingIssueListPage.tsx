import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { useSubcontractingIssueHeadersPaged } from '../hooks/useSubcontractingHeaders';
import type { SubcontractingHeader } from '../types/subcontracting';
import { SubcontractingDetailDialog } from './SubcontractingDetailDialog';
import { subcontractingApi } from '../api/subcontracting-api';

type ColumnKey = 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'sourceWarehouse' | 'targetWarehouse' | 'documentType' | 'status' | 'createdDate' | 'actions';

export function SubcontractingIssueListPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.subcontracting.issue');
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [headerToDelete, setHeaderToDelete] = useState<SubcontractingHeader | null>(null);
  const pagedGrid = usePagedDataGrid<ColumnKey>({ pageKey: 'subcontracting-issue-list', defaultSortBy: 'createdDate', defaultSortDirection: 'desc', mapSortBy: () => 'Id' });
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'documentNo', label: t('subcontracting.issue.list.documentNo'), sortable: false },
    { key: 'documentDate', label: t('subcontracting.issue.list.documentDate'), sortable: false },
    { key: 'customerCode', label: t('subcontracting.issue.list.customerCode'), sortable: false },
    { key: 'customerName', label: t('subcontracting.issue.list.customerName'), sortable: false },
    { key: 'sourceWarehouse', label: t('subcontracting.issue.list.sourceWarehouse'), sortable: false },
    { key: 'targetWarehouse', label: t('subcontracting.issue.list.targetWarehouse'), sortable: false },
    { key: 'documentType', label: t('subcontracting.issue.list.documentType'), sortable: false },
    { key: 'status', label: t('subcontracting.issue.list.status'), sortable: false },
    { key: 'createdDate', label: t('subcontracting.issue.list.createdDate'), sortable: false },
    { key: 'actions', label: t('subcontracting.issue.list.actions'), sortable: false },
  ], [t]);
  const { data, isLoading, error, refetch } = useSubcontractingIssueHeadersPaged(pagedGrid.queryParams);
  const deleteMutation = useMutation({
    mutationFn: (id: number) => subcontractingApi.deleteIssueHeader(id),
    onSuccess: async (response) => {
      if (!response.success) throw new Error(response.message || t('common.errors.deleteFailed'));
      toast.success(response.message || t('common.deleteSuccess', { defaultValue: 'Kayıt silindi.' }));
      setHeaderToDelete(null);
      await refetch();
    },
    onError: (err: Error) => toast.error(err.message || t('common.errors.deleteFailed')),
  });
  useEffect(() => { setPageTitle(t('subcontracting.issue.list.title')); return () => setPageTitle(null); }, [setPageTitle, t]);
  const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const formatDateTime = (value: string | null): string => value ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
  const getStatus = (item: SubcontractingHeader): ReactElement => item.isCompleted ? <Badge variant="default" className="w-fit">{t('subcontracting.issue.list.completed')}</Badge> : item.isPendingApproval ? <Badge variant="secondary" className="w-fit">{t('subcontracting.issue.list.pendingApproval')}</Badge> : <Badge variant="outline" className="w-fit">{t('subcontracting.issue.list.inProgress')}</Badge>;
  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });

  return (
    <div className="space-y-6">
      {!permission.canMutate ? <PermissionNotice /> : null}
      <Card><CardHeader><CardTitle>{t('subcontracting.issue.list.title')}</CardTitle></CardHeader><CardContent>
        <PagedDataGrid<SubcontractingHeader, ColumnKey>
          columns={columns}
          visibleColumnKeys={['documentNo', 'documentDate', 'customerCode', 'customerName', 'sourceWarehouse', 'targetWarehouse', 'documentType', 'status', 'createdDate']}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, key) => ({ documentNo: <span className="font-medium">{row.documentNo || '-'}</span>, documentDate: formatDate(row.documentDate), customerCode: row.customerCode || '-', customerName: row.customerName || '-', sourceWarehouse: row.sourceWarehouse || '-', targetWarehouse: row.targetWarehouse || '-', documentType: <Badge variant="outline">{row.documentType || '-'}</Badge>, status: getStatus(row), createdDate: formatDateTime(row.createdDate) } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('subcontracting.issue.list.error')}
          emptyText={t('subcontracting.issue.list.noData')}
          showActionsColumn={permission.canView || permission.canDelete}
          actionsHeaderLabel={t('subcontracting.issue.list.actions')}
          iconOnlyActions={false}
          renderActionsCell={(row) => (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" size="sm" disabled={!permission.canView} onClick={() => { setSelectedHeaderId(row.id); setSelectedDocumentType(row.documentType); }}><Eye className="size-4" /><span className="ml-2">{t('subcontracting.issue.list.viewDetails')}</span></Button>
              <Button variant="destructive" size="sm" disabled={!permission.canDelete || deleteMutation.isPending} onClick={() => setHeaderToDelete(row)}><Trash2 className="size-4" /><span className="ml-2">{t('common.delete')}</span></Button>
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
          actionBar={{ pageKey: 'subcontracting-issue-list', columns: columns.map(({ key, label }) => ({ key, label })), visibleColumns: columns.map(({ key }) => key), columnOrder: columns.map(({ key }) => key), onVisibleColumnsChange: () => undefined, onColumnOrderChange: () => undefined, exportFileName: 'subcontracting-issue-list', exportColumns: columns.filter((c) => c.key !== 'actions').map(({ key, label }) => ({ key, label })), exportRows: (data?.data ?? []).map((item) => ({ documentNo: item.documentNo || '-', documentDate: formatDate(item.documentDate), customerCode: item.customerCode || '-', customerName: item.customerName || '-', sourceWarehouse: item.sourceWarehouse || '-', targetWarehouse: item.targetWarehouse || '-', documentType: item.documentType || '-', status: item.isCompleted ? t('subcontracting.issue.list.completed') : item.isPendingApproval ? t('subcontracting.issue.list.pendingApproval') : t('subcontracting.issue.list.inProgress'), createdDate: formatDateTime(item.createdDate) })), filterColumns: [], defaultFilterColumn: 'documentNo', draftFilterRows: [], onDraftFilterRowsChange: () => undefined, onApplyFilters: () => undefined, onClearFilters: () => undefined, appliedFilterCount: 0, search: { ...pagedGrid.searchConfig, placeholder: t('subcontracting.issue.list.searchPlaceholder'), className: 'h-9 w-full md:w-64' }, leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" /> }}
        />
      </CardContent></Card>
      {selectedHeaderId && selectedDocumentType && <SubcontractingDetailDialog headerId={selectedHeaderId} documentType={selectedDocumentType} isOpen onClose={() => { setSelectedHeaderId(null); setSelectedDocumentType(null); }} />}
      <DeleteConfirmDialog
        open={Boolean(headerToDelete)}
        itemLabel={headerToDelete?.documentNo || `#${headerToDelete?.id ?? ''}`}
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
