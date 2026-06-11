import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Pencil, Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { useSubcontractingIssueHeadersPaged } from '../hooks/useSubcontractingHeaders';
import type { SubcontractingHeader } from '../types/subcontracting';
import { SubcontractingDetailDialog } from './SubcontractingDetailDialog';
import { subcontractingApi } from '../api/subcontracting-api';

type ColumnKey = 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'sourceWarehouse' | 'targetWarehouse' | 'documentType' | 'status' | 'createdDate' | 'actions';

const pageKey = 'subcontracting-issue-list';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'subcontracting.issue.list.documentNo' },
  { value: 'customerCode', type: 'string', labelKey: 'subcontracting.issue.list.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'subcontracting.issue.list.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'subcontracting.issue.list.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'subcontracting.issue.list.targetWarehouse' },
  { value: 'documentType', type: 'string', labelKey: 'subcontracting.issue.list.documentType' },
  { value: 'isCompleted', type: 'boolean', labelKey: 'subcontracting.issue.list.status' },
];

const mapSortBy = (value: ColumnKey): string => {
  switch (value) {
    case 'documentNo': return 'DocumentNo';
    case 'documentDate': return 'DocumentDate';
    case 'customerCode': return 'CustomerCode';
    case 'customerName': return 'CustomerName';
    case 'sourceWarehouse': return 'SourceWarehouse';
    case 'targetWarehouse': return 'TargetWarehouse';
    case 'documentType': return 'DocumentType';
    case 'createdDate': return 'CreatedDate';
    default: return 'Id';
  }
};

const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
const formatDateTime = (value: string | null): string => value ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

export function SubcontractingIssueListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.subcontracting.issue');
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [headerToDelete, setHeaderToDelete] = useState<SubcontractingHeader | null>(null);

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'documentNo', label: t('subcontracting.issue.list.documentNo') },
    { key: 'documentDate', label: t('subcontracting.issue.list.documentDate') },
    { key: 'customerCode', label: t('subcontracting.issue.list.customerCode') },
    { key: 'customerName', label: t('subcontracting.issue.list.customerName') },
    { key: 'sourceWarehouse', label: t('subcontracting.issue.list.sourceWarehouse') },
    { key: 'targetWarehouse', label: t('subcontracting.issue.list.targetWarehouse') },
    { key: 'documentType', label: t('subcontracting.issue.list.documentType') },
    { key: 'status', label: t('subcontracting.issue.list.status') },
    { key: 'createdDate', label: t('subcontracting.issue.list.createdDate') },
    { key: 'actions', label: t('subcontracting.issue.list.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
  });

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

  useEffect(() => {
    setPageTitle(t('subcontracting.issue.list.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const getStatus = (item: SubcontractingHeader): ReactElement =>
    item.isCompleted
      ? <Badge variant="default" className="w-fit">{t('subcontracting.issue.list.completed')}</Badge>
      : item.isPendingApproval
        ? <Badge variant="secondary" className="w-fit">{t('subcontracting.issue.list.pendingApproval')}</Badge>
        : <Badge variant="outline" className="w-fit">{t('subcontracting.issue.list.inProgress')}</Badge>;

  const exportColumns = useMemo(() =>
    orderedVisibleColumns
      .filter((key) => key !== 'actions')
      .map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })),
    [columns, orderedVisibleColumns]
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() =>
    (data?.data ?? []).map((item) => ({
      documentNo: item.documentNo || '-',
      documentDate: formatDate(item.documentDate),
      customerCode: item.customerCode || '-',
      customerName: item.customerName || '-',
      sourceWarehouse: item.sourceWarehouse || '-',
      targetWarehouse: item.targetWarehouse || '-',
      documentType: item.documentType || '-',
      status: item.isCompleted
        ? t('subcontracting.issue.list.completed')
        : item.isPendingApproval
          ? t('subcontracting.issue.list.pendingApproval')
          : t('subcontracting.issue.list.inProgress'),
      createdDate: formatDateTime(item.createdDate)
    })),
    [data?.data, t]
  );

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });
  const visibleColumnKeys = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[], [orderedVisibleColumns]);
  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null =>
    columnKey !== pagedGrid.sortBy ? null : pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;

  return (
    <div className="space-y-6">
      {!permission.canMutate ? <PermissionNotice /> : null}
      <Card>
        <CardHeader>
          <CardTitle>{t('subcontracting.issue.list.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<SubcontractingHeader, ColumnKey>
            columns={columns}
            visibleColumnKeys={visibleColumnKeys}
            rows={data?.data ?? []}
            rowKey={(row) => row.id}
            renderCell={(item, columnKey) => {
              switch (columnKey) {
                case 'documentNo': return <span className="font-medium">{item.documentNo || '-'}</span>;
                case 'documentDate': return formatDate(item.documentDate);
                case 'customerCode': return item.customerCode || '-';
                case 'customerName': return item.customerName || '-';
                case 'sourceWarehouse': return item.sourceWarehouse || '-';
                case 'targetWarehouse': return item.targetWarehouse || '-';
                case 'documentType': return <Badge variant="outline">{item.documentType || '-'}</Badge>;
                case 'status': return getStatus(item);
                case 'createdDate': return formatDateTime(item.createdDate);
                default: return null;
              }
            }}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={(columnKey) => {
              if (columnKey === 'status' || columnKey === 'actions') return;
              pagedGrid.handleSort(columnKey);
            }}
            renderSortIcon={renderSortIcon}
            isLoading={isLoading}
            isError={Boolean(error)}
            errorText={t('subcontracting.issue.list.error')}
            emptyText={t('subcontracting.issue.list.noData')}
            showActionsColumn={orderedVisibleColumns.includes('actions') && (permission.canView || permission.canUpdate || permission.canDelete)}
            actionsHeaderLabel={t('subcontracting.issue.list.actions')}
            renderActionsCell={(row) => (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button variant="ghost" size="sm" disabled={!permission.canView} onClick={() => { setSelectedHeaderId(row.id); setSelectedDocumentType(row.documentType); }}>
                  <Eye className="size-4" />
                  <span className="ml-2">{t('subcontracting.issue.list.viewDetails')}</span>
                </Button>
                <Button variant="secondary" size="sm" disabled={!permission.canUpdate || row.isCompleted} onClick={() => navigate(`/subcontracting/issue/edit/${row.id}`)}>
                  <Pencil className="size-4" />
                  <span className="ml-2">{t('common.edit')}</span>
                </Button>
                <Button variant="destructive" size="sm" disabled={!permission.canDelete || deleteMutation.isPending} onClick={() => setHeaderToDelete(row)}>
                  <Trash2 className="size-4" />
                  <span className="ml-2">{t('common.delete')}</span>
                </Button>
              </div>
            )}
            pageSize={data?.pageSize ?? pagedGrid.pageSize}
            pageSizeOptions={pagedGrid.pageSizeOptions}
            onPageSizeChange={pagedGrid.handlePageSizeChange}
            pageNumber={pagedGrid.getDisplayPageNumber(data)}
            totalPages={Math.max(data?.totalPages ?? 1, 1)}
            hasPreviousPage={Boolean(data?.hasPreviousPage)}
            hasNextPage={Boolean(data?.hasNextPage)}
            onPreviousPage={pagedGrid.goToPreviousPage}
            onNextPage={pagedGrid.goToNextPage}
            previousLabel={t('common.previous')}
            nextLabel={t('common.next')}
            paginationInfoText={paginationInfoText}
            actionBar={{
              pageKey,
              userId,
              columns: columns.map(({ key, label }) => ({ key, label })),
              visibleColumns,
              columnOrder,
              onVisibleColumnsChange: setVisibleColumns,
              onColumnOrderChange: setColumnOrder,
              exportFileName: pageKey,
              exportColumns,
              exportRows,
              filterColumns: advancedFilterColumns,
              defaultFilterColumn: 'documentNo',
              draftFilterRows: pagedGrid.draftFilterRows,
              onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
              filterLogic: pagedGrid.filterLogic,
              onFilterLogicChange: pagedGrid.setFilterLogic,
              onApplyFilters: pagedGrid.applyAdvancedFilters,
              onClearFilters: pagedGrid.clearAdvancedFilters,
              appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
              search: {
                value: pagedGrid.searchInput,
                onValueChange: pagedGrid.searchConfig.onValueChange,
                onSearchChange: pagedGrid.searchConfig.onSearchChange,
                placeholder: t('subcontracting.issue.list.searchPlaceholder'),
              },
              leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
            }}
          />
        </CardContent>
      </Card>
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
