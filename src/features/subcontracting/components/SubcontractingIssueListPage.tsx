import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { useSubcontractingIssueHeadersPaged } from '../hooks/useSubcontractingHeaders';
import type { SubcontractingHeader } from '../types/subcontracting';
import { SubcontractingDetailDialog } from './SubcontractingDetailDialog';

type ColumnKey = 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'sourceWarehouse' | 'targetWarehouse' | 'documentType' | 'status' | 'createdDate' | 'actions';

export function SubcontractingIssueListPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
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
  const { data, isLoading, error } = useSubcontractingIssueHeadersPaged(pagedGrid.queryParams);
  useEffect(() => { setPageTitle(t('subcontracting.issue.list.title')); return () => setPageTitle(null); }, [setPageTitle, t]);
  const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const formatDateTime = (value: string | null): string => value ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
  const getStatus = (item: SubcontractingHeader): ReactElement => item.isCompleted ? <Badge variant="default" className="w-fit">{t('subcontracting.issue.list.completed')}</Badge> : item.isPendingApproval ? <Badge variant="secondary" className="w-fit">{t('subcontracting.issue.list.pendingApproval')}</Badge> : <Badge variant="outline" className="w-fit">{t('subcontracting.issue.list.inProgress')}</Badge>;
  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });

  return (
    <div className="space-y-6">
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
          showActionsColumn
          actionsHeaderLabel={t('subcontracting.issue.list.actions')}
          iconOnlyActions={false}
          renderActionsCell={(row) => <Button variant="ghost" size="sm" onClick={() => { setSelectedHeaderId(row.id); setSelectedDocumentType(row.documentType); }}><Eye className="size-4" /><span className="ml-2">{t('subcontracting.issue.list.viewDetails')}</span></Button>}
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
    </div>
  );
}
