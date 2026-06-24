import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
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

const pageKey = 'subcontracting-issue-approval-list';

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

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  id: 8,
  documentNo: 14,
  documentDate: 12,
  customerCode: 12,
  customerName: 14,
  sourceWarehouse: 12,
  targetWarehouse: 12,
  completionDate: 14,
};

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
  const { t } = useTranslation(['subcontracting', 'common']);
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.subcontracting.issue');
  const showActionsColumn = permission.canView || permission.canApprove;
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const approveMutation = useApproveSitHeader();
  const pagedGrid = usePagedDataGrid<ColumnKey>({ pageKey, defaultSortBy: 'id', defaultSortDirection: 'desc', mapSortBy });

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'id', label: t('subcontracting.issue.approval.id'), headClassName: 'wms-ops-table-id-col wms-ops-table-center-col', cellClassName: 'wms-ops-table-id-col wms-ops-table-center-col' },
    { key: 'documentNo', label: t('subcontracting.issue.approval.documentNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentDate', label: t('subcontracting.issue.approval.documentDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customerCode', label: t('subcontracting.issue.approval.customerCode'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customerName', label: t('subcontracting.issue.approval.customerName'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'sourceWarehouse', label: t('subcontracting.issue.approval.sourceWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'targetWarehouse', label: t('subcontracting.issue.approval.targetWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'completionDate', label: t('subcontracting.issue.approval.completionDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('subcontracting.issue.approval.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, columnWidths, setColumnOrder, setVisibleColumns, resizeColumnPair } = useColumnPreferences({
    pageKey, columns: columns.map(({ key, label }) => ({ key, label })), idColumnKey: 'id', defaultWidths: DEFAULT_COLUMN_WIDTHS, includeActionsColumn: showActionsColumn,
  });

  const { data, isLoading, error } = useAwaitingApprovalSitHeaders(pagedGrid.queryParams);

  useEffect(() => { setPageTitle(t('subcontracting.issue.approval.title')); return () => setPageTitle(null); }, [setPageTitle, t]);

  const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const formatDateTime = (value: string | null): string => value ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

  const getCellText = (row: SubcontractingHeader, key: ColumnKey): string | undefined => {
    switch (key) {
      case 'id': return String(row.id);
      case 'documentNo': return row.documentNo || '-';
      case 'documentDate': return formatDate(row.documentDate);
      case 'customerCode': return row.customerCode || '-';
      case 'customerName': return row.customerName || '-';
      case 'sourceWarehouse': return row.sourceWarehouse || '-';
      case 'targetWarehouse': return row.targetWarehouse || '-';
      case 'completionDate': return formatDateTime(row.completionDate);
      default: return undefined;
    }
  };

  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({
    id: item.id, documentNo: item.documentNo || '-', documentDate: formatDate(item.documentDate),
    customerCode: item.customerCode || '-', customerName: item.customerName || '-',
    sourceWarehouse: item.sourceWarehouse || '-', targetWarehouse: item.targetWarehouse || '-',
    completionDate: formatDateTime(item.completionDate),
  })), [data?.data]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total });

  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    if (!permission.canApprove) return;
    try {
      await approveMutation.mutateAsync({ id, approved });
      toast.success(approved ? t('subcontracting.issue.approval.approveSuccess') : t('subcontracting.issue.approval.rejectSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : approved ? t('subcontracting.issue.approval.approveError') : t('subcontracting.issue.approval.rejectError'));
    }
  };

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => columnKey !== pagedGrid.sortBy ? null : pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;

  return (
    <>
      <OpsListPageShell
        eyebrow={<><span>{t('subcontracting.create.breadcrumb.parent')}</span><span className="mx-2 opacity-60">/</span><span>{t('subcontracting.create.breadcrumb.module')}</span></>}
        title={t('subcontracting.issue.approval.title')}
        description={t('subcontracting.issue.approval.subtitle')}
      >
        <PagedDataGrid<SubcontractingHeader, ColumnKey>
          variant="ops"
          columns={columns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
          defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
          columnWidths={columnWidths}
          onResizeColumnPair={resizeColumnPair}
          getCellText={getCellText}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, key) => ({
            id: <span className="wms-ops-table-id-value">{row.id}</span>,
            documentNo: <span className="font-medium font-mono text-xs">{row.documentNo || '-'}</span>,
            documentDate: <span className="font-mono text-xs">{formatDate(row.documentDate)}</span>,
            customerCode: row.customerCode || '-',
            customerName: row.customerName || '-',
            sourceWarehouse: row.sourceWarehouse || '-',
            targetWarehouse: row.targetWarehouse || '-',
            completionDate: <span className="font-mono text-xs">{formatDateTime(row.completionDate)}</span>,
          } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => { if (columnKey !== 'actions') pagedGrid.handleSort(columnKey); }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('subcontracting.issue.approval.error')}
          emptyText={t('subcontracting.issue.approval.noData')}
          showActionsColumn={showActionsColumn}
          actionsHeaderLabel={t('subcontracting.issue.approval.actions')}
          iconOnlyActions={false}
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(row) => (
            <div className="wms-ops-row-actions">
              <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn" aria-label={t('subcontracting.issue.approval.viewDetails')} title={t('subcontracting.issue.approval.viewDetails')} disabled={!permission.canView} onClick={() => { setSelectedHeaderId(row.id); setSelectedDocumentType(row.documentType); }}><Eye className="size-3" aria-hidden /></Button>
              <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--approve" aria-label={t('subcontracting.issue.approval.approve')} title={t('subcontracting.issue.approval.approve')} disabled={!permission.canApprove || approveMutation.isPending} onClick={() => handleApproval(row.id, true)}><Check className="size-3" aria-hidden /></Button>
              <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger" aria-label={t('subcontracting.issue.approval.reject')} title={t('subcontracting.issue.approval.reject')} disabled={!permission.canApprove || approveMutation.isPending} onClick={() => handleApproval(row.id, false)}><X className="size-3" aria-hidden /></Button>
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
          actionBar={{
            pageKey, userId, columns: columns.map(({ key, label }) => ({ key, label })), visibleColumns, columnOrder,
            onVisibleColumnsChange: setVisibleColumns, onColumnOrderChange: setColumnOrder, exportFileName: pageKey, exportColumns, exportRows,
            filterColumns, defaultFilterColumn: 'documentNo',
            draftFilterRows: pagedGrid.draftFilterRows, onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
            filterLogic: pagedGrid.filterLogic, onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters, onClearFilters: pagedGrid.clearAdvancedFilters,
            translationNamespace: 'common', appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: { ...pagedGrid.searchConfig, placeholder: t('subcontracting.issue.approval.searchPlaceholder') },
            leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="icon" variant="ghost" className="wms-ops-voice-btn" />,
            variant: 'ops',
          }}
        />
      </OpsListPageShell>
      {selectedHeaderId && selectedDocumentType && <SubcontractingDetailDialog variant="ops" headerId={selectedHeaderId} documentType={selectedDocumentType} isOpen onClose={() => { setSelectedHeaderId(null); setSelectedDocumentType(null); }} />}
    </>
  );
}
