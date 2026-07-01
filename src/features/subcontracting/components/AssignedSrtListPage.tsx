import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, Eye, PlayCircle, Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { subcontractingApi } from '../api/subcontracting-api';
import { useAssignedSrtHeadersPaged } from '../hooks/useSubcontractingHeaders';
import { SubcontractingDetailDialog } from './SubcontractingDetailDialog';
import type { SubcontractingHeader } from '../types/subcontracting';

type AssignedSrtColumnKey = 'id' | 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'sourceWarehouse' | 'targetWarehouse' | 'documentType' | 'createdDate' | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'subcontracting.srt.assignedList.documentNo' },
  { value: 'customerCode', type: 'string', labelKey: 'subcontracting.srt.assignedList.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'subcontracting.srt.assignedList.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'subcontracting.srt.assignedList.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'subcontracting.srt.assignedList.targetWarehouse' },
  { value: 'documentType', type: 'string', labelKey: 'subcontracting.srt.assignedList.documentType' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  id: 8,
  documentNo: 14,
  documentDate: 12,
  customerCode: 12,
  customerName: 14,
  sourceWarehouse: 12,
  targetWarehouse: 12,
  documentType: 10,
  createdDate: 14,
};

function mapSortBy(value: AssignedSrtColumnKey): string {
  switch (value) {
    case 'documentNo': return 'DocumentNo';
    case 'documentDate': return 'DocumentDate';
    case 'customerCode': return 'CustomerCode';
    case 'customerName': return 'CustomerName';
    case 'sourceWarehouse': return 'SourceWarehouse';
    case 'targetWarehouse': return 'TargetWarehouse';
    case 'documentType': return 'DocumentType';
    case 'createdDate': return 'CreatedDate';
    case 'id':
    default: return 'Id';
  }
}

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function AssignedSrtListPage(): ReactElement {
  const { t } = useTranslation(['subcontracting', 'common']);
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.subcontracting.receipt');
  const pageKey = 'subcontracting-srt-assigned-list';
  const showActionsColumn = permission.canView || permission.canUpdate || permission.canDelete;
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [headerToDelete, setHeaderToDelete] = useState<SubcontractingHeader | null>(null);

  const pagedGrid = usePagedDataGrid<AssignedSrtColumnKey>({ pageKey, defaultSortBy: 'createdDate', defaultSortDirection: 'desc', defaultPageSize: 20, mapSortBy });
  const columns = useMemo<PagedDataGridColumn<AssignedSrtColumnKey>[]>(() => [
    { key: 'id', label: t('subcontracting.srt.assignedList.id'), headClassName: 'wms-ops-table-id-col wms-ops-table-center-col', cellClassName: 'wms-ops-table-id-col wms-ops-table-center-col' },
    { key: 'documentNo', label: t('subcontracting.srt.assignedList.documentNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentDate', label: t('subcontracting.srt.assignedList.documentDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customerCode', label: t('subcontracting.srt.assignedList.customerCode'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customerName', label: t('subcontracting.srt.assignedList.customerName'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'sourceWarehouse', label: t('subcontracting.srt.assignedList.sourceWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'targetWarehouse', label: t('subcontracting.srt.assignedList.targetWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentType', label: t('subcontracting.srt.assignedList.documentType'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'createdDate', label: t('subcontracting.srt.assignedList.createdDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, columnWidths, setColumnOrder, setVisibleColumns, resizeColumnPair } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    includeActionsColumn: showActionsColumn,
  });

  const { data, isLoading, error, refetch } = useAssignedSrtHeadersPaged(pagedGrid.queryParams);
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

  useEffect(() => {
    setPageTitle(t('subcontracting.srt.assignedList.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const getCellText = (row: SubcontractingHeader, key: AssignedSrtColumnKey): string | undefined => {
    switch (key) {
      case 'id': return String(row.id);
      case 'documentNo': return row.documentNo || '-';
      case 'documentDate': return formatDate(row.documentDate);
      case 'customerCode': return row.customerCode || '-';
      case 'customerName': return row.customerName || '-';
      case 'sourceWarehouse': return row.sourceWarehouse || '-';
      case 'targetWarehouse': return row.targetWarehouse || '-';
      case 'documentType': return row.documentType || '-';
      case 'createdDate': return formatDateTime(row.createdDate);
      default: return undefined;
    }
  };

  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({
    id: item.id,
    documentNo: item.documentNo || '-',
    documentDate: formatDate(item.documentDate),
    customerCode: item.customerCode || '-',
    customerName: item.customerName || '-',
    sourceWarehouse: item.sourceWarehouse || '-',
    targetWarehouse: item.targetWarehouse || '-',
    documentType: item.documentType || '-',
    createdDate: formatDateTime(item.createdDate),
  })), [data?.data]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total });
  const visibleColumnKeys = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions') as AssignedSrtColumnKey[], [orderedVisibleColumns]);
  const renderSortIcon = (columnKey: AssignedSrtColumnKey): ReactElement | null => columnKey !== pagedGrid.sortBy ? null : pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;

  return (
    <>
      <OpsListPageShell
        eyebrow={<><span>{t('subcontracting.create.breadcrumb.parent')}</span><span className="mx-2 opacity-60">/</span><span>{t('subcontracting.create.breadcrumb.module')}</span></>}
        title={t('subcontracting.srt.assignedList.title')}
        description={t('subcontracting.srt.assignedList.subtitle')}
      >
        {!permission.canMutate ? <PermissionNotice /> : null}
        <PagedDataGrid<SubcontractingHeader, AssignedSrtColumnKey>
          variant="ops"
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
          columnWidths={columnWidths}
          onResizeColumnPair={resizeColumnPair}
          getCellText={getCellText}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(item, columnKey) => ({
            id: <span className="wms-ops-table-id-value">{item.id}</span>,
            documentNo: <span className="font-medium font-mono text-xs">{item.documentNo || '-'}</span>,
            documentDate: <span className="font-mono text-xs">{formatDate(item.documentDate)}</span>,
            customerCode: item.customerCode || '-',
            customerName: item.customerName || '-',
            sourceWarehouse: item.sourceWarehouse || '-',
            targetWarehouse: item.targetWarehouse || '-',
            documentType: <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{item.documentType || '-'}</Badge>,
            createdDate: <span className="font-mono text-xs">{formatDateTime(item.createdDate)}</span>,
          } as Record<Exclude<AssignedSrtColumnKey, 'actions'>, React.ReactNode>)[columnKey as Exclude<AssignedSrtColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => { if (columnKey !== 'actions') pagedGrid.handleSort(columnKey); }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('subcontracting.srt.assignedList.error')}
          emptyText={t('subcontracting.srt.assignedList.noData')}
          showActionsColumn={showActionsColumn}
          actionsHeaderLabel={t('common.actions')}
          iconOnlyActions={false}
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(item) => (
            <div className="wms-ops-row-actions">
              <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn" aria-label={t('subcontracting.srt.assignedList.viewDetails')} title={t('subcontracting.srt.assignedList.viewDetails')} onClick={() => { setSelectedHeaderId(item.id); setSelectedDocumentType(item.documentType); }} disabled={!permission.canView}><Eye className="size-3" aria-hidden /></Button>
              <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--start" aria-label={t('common.start')} title={t('common.start')} onClick={() => navigate(`/subcontracting/receipt/collection/${item.id}`)} disabled={!permission.canUpdate}><PlayCircle className="size-3" aria-hidden /></Button>
              <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger" aria-label={t('common.delete')} title={t('common.delete')} onClick={() => setHeaderToDelete(item)} disabled={!permission.canDelete || deleteMutation.isPending}><Trash2 className="size-3" aria-hidden /></Button>
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
            pageKey, userId, columns: columns.map(({ key, label }) => ({ key, label })), visibleColumns, columnOrder,
            onVisibleColumnsChange: setVisibleColumns, onColumnOrderChange: setColumnOrder, exportFileName: pageKey, exportColumns, exportRows,
            filterColumns: advancedFilterColumns, defaultFilterColumn: 'documentNo',
            draftFilterRows: pagedGrid.draftFilterRows, onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
            filterLogic: pagedGrid.filterLogic, onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters, onClearFilters: pagedGrid.clearAdvancedFilters,
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: { ...pagedGrid.searchConfig, placeholder: t('subcontracting.srt.assignedList.searchPlaceholder') },
            leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="icon" variant="ghost" className="wms-ops-voice-btn" />,
            variant: 'ops',
          }}
        />
      </OpsListPageShell>
      {selectedHeaderId && <SubcontractingDetailDialog variant="ops" headerId={selectedHeaderId} documentType={selectedDocumentType ?? ''} isOpen onClose={() => { setSelectedHeaderId(null); setSelectedDocumentType(null); }} />}
      <DeleteConfirmDialog open={headerToDelete != null} onOpenChange={(open) => { if (!open) setHeaderToDelete(null); }} itemLabel={headerToDelete?.documentNo || (headerToDelete ? `#${headerToDelete.id}` : undefined)} isPending={deleteMutation.isPending} onConfirm={() => { if (headerToDelete) deleteMutation.mutate(headerToDelete.id); }} />
    </>
  );
}
