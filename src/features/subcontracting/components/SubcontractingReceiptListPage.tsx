import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Pencil, Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { useSubcontractingReceiptHeadersPaged } from '../hooks/useSubcontractingHeaders';
import type { SubcontractingHeader } from '../types/subcontracting';
import { SubcontractingDetailDialog } from './SubcontractingDetailDialog';
import { subcontractingApi } from '../api/subcontracting-api';

type ColumnKey = 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'sourceWarehouse' | 'targetWarehouse' | 'documentType' | 'status' | 'createdDate' | 'actions';

const pageKey = 'subcontracting-receipt-list';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'subcontracting.receipt.list.documentNo' },
  { value: 'customerCode', type: 'string', labelKey: 'subcontracting.receipt.list.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'subcontracting.receipt.list.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'subcontracting.receipt.list.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'subcontracting.receipt.list.targetWarehouse' },
  { value: 'documentType', type: 'string', labelKey: 'subcontracting.receipt.list.documentType' },
  { value: 'isCompleted', type: 'boolean', labelKey: 'subcontracting.receipt.list.status' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  documentNo: 14, documentDate: 12, customerCode: 12, customerName: 14, sourceWarehouse: 12, targetWarehouse: 12, documentType: 10, status: 12, createdDate: 14,
};

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

export function SubcontractingReceiptListPage(): ReactElement {
  const { t } = useTranslation(['subcontracting', 'common']);
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.subcontracting.receipt');
  const showActionsColumn = permission.canView || permission.canUpdate || permission.canDelete;
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [headerToDelete, setHeaderToDelete] = useState<SubcontractingHeader | null>(null);

  const pagedGrid = usePagedDataGrid<ColumnKey>({ pageKey, defaultSortBy: 'createdDate', defaultSortDirection: 'desc', mapSortBy });
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'documentNo', label: t('subcontracting.receipt.list.documentNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentDate', label: t('subcontracting.receipt.list.documentDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customerCode', label: t('subcontracting.receipt.list.customerCode'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customerName', label: t('subcontracting.receipt.list.customerName'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'sourceWarehouse', label: t('subcontracting.receipt.list.sourceWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'targetWarehouse', label: t('subcontracting.receipt.list.targetWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentType', label: t('subcontracting.receipt.list.documentType'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'status', label: t('subcontracting.receipt.list.status'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'createdDate', label: t('subcontracting.receipt.list.createdDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, columnWidths, setColumnOrder, setVisibleColumns, resizeColumnPair } = useColumnPreferences({
    pageKey, columns: columns.map(({ key, label }) => ({ key, label })), defaultWidths: DEFAULT_COLUMN_WIDTHS, includeActionsColumn: showActionsColumn,
  });

  const { data, isLoading, error, refetch } = useSubcontractingReceiptHeadersPaged(pagedGrid.queryParams);
  const deleteMutation = useMutation({
    mutationFn: (id: number) => subcontractingApi.deleteReceiptHeader(id),
    onSuccess: async (response) => {
      if (!response.success) throw new Error(response.message || t('common.errors.deleteFailed'));
      toast.success(response.message || t('common.deleteSuccess'));
      setHeaderToDelete(null);
      await refetch();
    },
    onError: (err: Error) => toast.error(err.message || t('common.errors.deleteFailed')),
  });

  useEffect(() => { setPageTitle(t('subcontracting.receipt.list.title')); return () => setPageTitle(null); }, [setPageTitle, t]);

  const statusLabel = (item: SubcontractingHeader): string => {
    if (item.isCompleted) return t('subcontracting.receipt.list.completed');
    if (item.isPendingApproval) return t('subcontracting.receipt.list.pendingApproval');
    return t('subcontracting.receipt.list.inProgress');
  };

  const statusBadge = (item: SubcontractingHeader): ReactElement => {
    if (item.isCompleted) return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--done mx-auto">{t('subcontracting.receipt.list.completed')}</Badge>;
    if (item.isPendingApproval) return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--pending mx-auto">{t('subcontracting.receipt.list.pendingApproval')}</Badge>;
    return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--active mx-auto">{t('subcontracting.receipt.list.inProgress')}</Badge>;
  };

  const getCellText = (row: SubcontractingHeader, key: ColumnKey): string | undefined => {
    switch (key) {
      case 'documentNo': return row.documentNo || '-';
      case 'documentDate': return formatDate(row.documentDate);
      case 'customerCode': return row.customerCode || '-';
      case 'customerName': return row.customerName || '-';
      case 'sourceWarehouse': return row.sourceWarehouse || '-';
      case 'targetWarehouse': return row.targetWarehouse || '-';
      case 'documentType': return row.documentType || '-';
      case 'status': return statusLabel(row);
      case 'createdDate': return formatDateTime(row.createdDate);
      default: return undefined;
    }
  };

  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({
    documentNo: item.documentNo || '-', documentDate: formatDate(item.documentDate), customerCode: item.customerCode || '-', customerName: item.customerName || '-',
    sourceWarehouse: item.sourceWarehouse || '-', targetWarehouse: item.targetWarehouse || '-', documentType: item.documentType || '-',
    status: statusLabel(item), createdDate: formatDateTime(item.createdDate),
  })), [data?.data, t]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total });
  const visibleColumnKeys = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[], [orderedVisibleColumns]);
  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => columnKey !== pagedGrid.sortBy ? null : pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;

  return (
    <>
      <OpsListPageShell eyebrow={<><span>{t('subcontracting.create.breadcrumb.parent')}</span><span className="mx-2 opacity-60">/</span><span>{t('subcontracting.create.breadcrumb.module')}</span></>} title={t('subcontracting.receipt.list.title')} description={t('subcontracting.receipt.list.subtitle')}>
        {!permission.canMutate ? <PermissionNotice /> : null}
        <PagedDataGrid<SubcontractingHeader, ColumnKey>
          variant="ops" columns={columns} visibleColumnKeys={visibleColumnKeys} defaultColumnWidths={DEFAULT_COLUMN_WIDTHS} columnWidths={columnWidths} onResizeColumnPair={resizeColumnPair} getCellText={getCellText}
          rows={data?.data ?? []} rowKey={(row) => row.id}
          renderCell={(item, columnKey) => ({
            documentNo: <span className="font-medium font-mono text-xs">{item.documentNo || '-'}</span>,
            documentDate: <span className="font-mono text-xs">{formatDate(item.documentDate)}</span>,
            customerCode: item.customerCode || '-', customerName: item.customerName || '-',
            sourceWarehouse: item.sourceWarehouse || '-', targetWarehouse: item.targetWarehouse || '-',
            documentType: <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{item.documentType || '-'}</Badge>,
            status: statusBadge(item),
            createdDate: <span className="font-mono text-xs">{formatDateTime(item.createdDate)}</span>,
          } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[columnKey as Exclude<ColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy} sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => { if (columnKey !== 'status' && columnKey !== 'actions') pagedGrid.handleSort(columnKey); }}
          renderSortIcon={renderSortIcon} isLoading={isLoading} isError={Boolean(error)} errorText={t('subcontracting.receipt.list.error')} emptyText={t('subcontracting.receipt.list.noData')}
          showActionsColumn={showActionsColumn} actionsHeaderLabel={t('common.actions')} iconOnlyActions={false} actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(row) => (
            <div className="wms-ops-row-actions">
              <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn" aria-label={t('subcontracting.receipt.list.viewDetails')} title={t('subcontracting.receipt.list.viewDetails')} disabled={!permission.canView} onClick={() => { setSelectedHeaderId(row.id); setSelectedDocumentType(row.documentType); }}><Eye className="size-3" aria-hidden /></Button>
              <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn" aria-label={t('common.edit')} title={t('common.edit')} disabled={!permission.canUpdate || row.isCompleted} onClick={() => navigate(`/subcontracting/receipt/edit/${row.id}`)}><Pencil className="size-3" aria-hidden /></Button>
              <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger" aria-label={t('common.delete')} title={t('common.delete')} disabled={!permission.canDelete || deleteMutation.isPending} onClick={() => setHeaderToDelete(row)}><Trash2 className="size-3" aria-hidden /></Button>
            </div>
          )}
          pageSize={data?.pageSize ?? pagedGrid.pageSize} pageSizeOptions={pagedGrid.pageSizeOptions} onPageSizeChange={pagedGrid.handlePageSizeChange}
          pageNumber={pagedGrid.getDisplayPageNumber(data)} totalPages={Math.max(data?.totalPages ?? 1, 1)} hasPreviousPage={Boolean(data?.hasPreviousPage)} hasNextPage={Boolean(data?.hasNextPage)}
          onPreviousPage={pagedGrid.goToPreviousPage} onNextPage={pagedGrid.goToNextPage} previousLabel={t('common.previous')} nextLabel={t('common.next')} paginationInfoText={paginationInfoText}
          actionBar={{
            pageKey, userId, columns: columns.map(({ key, label }) => ({ key, label })), visibleColumns, columnOrder, onVisibleColumnsChange: setVisibleColumns, onColumnOrderChange: setColumnOrder,
            exportFileName: pageKey, exportColumns, exportRows, filterColumns: advancedFilterColumns, defaultFilterColumn: 'documentNo',
            draftFilterRows: pagedGrid.draftFilterRows, onDraftFilterRowsChange: pagedGrid.setDraftFilterRows, filterLogic: pagedGrid.filterLogic, onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters, onClearFilters: pagedGrid.clearAdvancedFilters, appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: { ...pagedGrid.searchConfig, placeholder: t('subcontracting.receipt.list.searchPlaceholder') },
            leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="icon" variant="ghost" className="wms-ops-voice-btn" />, variant: 'ops',
          }}
        />
      </OpsListPageShell>
      {selectedHeaderId && selectedDocumentType && <SubcontractingDetailDialog variant="ops" headerId={selectedHeaderId} documentType={selectedDocumentType} isOpen onClose={() => { setSelectedHeaderId(null); setSelectedDocumentType(null); }} />}
      <DeleteConfirmDialog open={Boolean(headerToDelete)} itemLabel={headerToDelete?.documentNo || `#${headerToDelete?.id ?? ''}`} isPending={deleteMutation.isPending} onOpenChange={(open) => { if (!open) setHeaderToDelete(null); }} onConfirm={() => { if (headerToDelete) deleteMutation.mutate(headerToDelete.id); }} />
    </>
  );
}
