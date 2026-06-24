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
import type { AwaitingApprovalHeader } from '../types/transfer';
import { useApproveTransfer } from '../hooks/useApproveTransfer';
import { useAwaitingApprovalHeaders } from '../hooks/useAwaitingApprovalHeaders';
import { TransferDetailDialog } from './TransferDetailDialog';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';

type ColumnKey =
  | 'id'
  | 'documentNo'
  | 'documentDate'
  | 'customerCode'
  | 'customerName'
  | 'sourceWarehouse'
  | 'targetWarehouse'
  | 'completionDate'
  | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'transfer.approval.id' },
  { value: 'documentNo', type: 'string', labelKey: 'transfer.approval.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'transfer.approval.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'transfer.approval.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'transfer.approval.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'transfer.approval.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'transfer.approval.targetWarehouse' },
  { value: 'completionDate', type: 'date', labelKey: 'transfer.approval.completionDate' },
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

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
}

function formatDateTime(value: string | null): string {
  return value
    ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '-';
}

export function TransferApprovalPage(): ReactElement {
  const { t } = useTranslation(['transfer', 'common']);
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.transfer');
  const pageKey = 'transfer-approval-list';
  const showActionsColumn = permission.canView || permission.canApprove;
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const approveMutation = useApproveTransfer();

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'id',
    defaultSortDirection: 'desc',
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    {
      key: 'id',
      label: t('transfer.approval.id'),
      headClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
    },
    { key: 'documentNo', label: t('transfer.approval.documentNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentDate', label: t('transfer.approval.documentDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customerCode', label: t('transfer.approval.customerCode'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customerName', label: t('transfer.approval.customerName'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'sourceWarehouse', label: t('transfer.approval.sourceWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'targetWarehouse', label: t('transfer.approval.targetWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'completionDate', label: t('transfer.approval.completionDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('transfer.approval.actions'), sortable: false },
  ], [t]);

  const {
    userId,
    columnOrder,
    visibleColumns,
    orderedVisibleColumns,
    columnWidths,
    setColumnOrder,
    setVisibleColumns,
    resizeColumnPair,
  } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    includeActionsColumn: showActionsColumn,
  });

  const { data, isLoading, error } = useAwaitingApprovalHeaders(pagedGrid.queryParams);

  useEffect(() => {
    setPageTitle(t('transfer.approval.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const getCellText = (row: AwaitingApprovalHeader, key: ColumnKey): string | undefined => {
    switch (key) {
      case 'id': return String(row.id);
      case 'documentNo': return row.documentNo || '-';
      case 'documentDate': return formatDate(row.documentDate);
      case 'customerCode': return row.customerCode || '-';
      case 'customerName': return row.customerName || '-';
      case 'sourceWarehouse': return row.sourceWarehouseName || row.sourceWarehouse || '-';
      case 'targetWarehouse': return row.targetWarehouseName || row.targetWarehouse || '-';
      case 'completionDate': return formatDateTime(row.completionDate);
      default: return undefined;
    }
  };

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
    sourceWarehouse: item.sourceWarehouseName || item.sourceWarehouse || '-',
    targetWarehouse: item.targetWarehouseName || item.targetWarehouse || '-',
    completionDate: formatDateTime(item.completionDate),
  })), [data?.data]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
  });

  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    if (!permission.canApprove) return;

    try {
      await approveMutation.mutateAsync({ id, approved });
      toast.success(approved ? t('transfer.approval.approveSuccess') : t('transfer.approval.rejectSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : approved ? t('transfer.approval.approveError') : t('transfer.approval.rejectError'));
    }
  };

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <>
      <OpsListPageShell
        eyebrow={
          <>
            <span>{t('transfer.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('transfer.create.breadcrumb.module')}</span>
          </>
        }
        title={t('transfer.approval.title')}
        description={t('transfer.approval.subtitle', { defaultValue: t('transfer.list.subtitle') })}
      >
        <PagedDataGrid<AwaitingApprovalHeader, ColumnKey>
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
            sourceWarehouse: row.sourceWarehouseName || row.sourceWarehouse || '-',
            targetWarehouse: row.targetWarehouseName || row.targetWarehouse || '-',
            completionDate: <span className="font-mono text-xs">{formatDateTime(row.completionDate)}</span>,
          } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(key) => { if (key !== 'actions') pagedGrid.handleSort(key); }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('transfer.approval.error')}
          emptyText={t('transfer.approval.noData')}
          showActionsColumn={showActionsColumn}
          actionsHeaderLabel={t('transfer.approval.actions')}
          iconOnlyActions={false}
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(row) => (
            <div className="wms-ops-row-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                aria-label={t('transfer.approval.viewDetails')}
                title={t('transfer.approval.viewDetails')}
                disabled={!permission.canView}
                onClick={() => setSelectedHeaderId(row.id)}
              >
                <Eye className="size-3" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--approve"
                aria-label={t('transfer.approval.approve')}
                title={t('transfer.approval.approve')}
                disabled={!permission.canApprove || approveMutation.isPending}
                onClick={() => handleApproval(row.id, true)}
              >
                <Check className="size-3" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
                aria-label={t('transfer.approval.reject')}
                title={t('transfer.approval.reject')}
                disabled={!permission.canApprove || approveMutation.isPending}
                onClick={() => handleApproval(row.id, false)}
              >
                <X className="size-3" aria-hidden />
              </Button>
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
            search: { ...pagedGrid.searchConfig, placeholder: t('transfer.approval.searchPlaceholder') },
            leftSlot: (
              <VoiceSearchButton
                onResult={pagedGrid.handleVoiceSearch}
                size="icon"
                variant="ghost"
                className="wms-ops-voice-btn"
              />
            ),
            variant: 'ops',
          }}
        />
      </OpsListPageShell>

      {selectedHeaderId && (
        <TransferDetailDialog headerId={selectedHeaderId} isOpen onClose={() => setSelectedHeaderId(null)} variant="ops" />
      )}
    </>
  );
}
