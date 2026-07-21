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
import type { GrHeader } from '../types/goods-receipt';
import { GoodsReceiptDetailDialog } from './GoodsReceiptDetailDialog';
import { useApproveGrHeader } from '../hooks/useApproveGrHeader';
import { useAwaitingApprovalGrHeaders } from '../hooks/useAwaitingApprovalGrHeaders';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';

type ColumnKey = 'id' | 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'plannedDate' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'goodsReceipt.approval.id' },
  { value: 'documentNo', type: 'string', labelKey: 'goodsReceipt.approval.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'goodsReceipt.approval.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'goodsReceipt.approval.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'goodsReceipt.approval.customerName' },
  { value: 'plannedDate', type: 'date', labelKey: 'goodsReceipt.approval.plannedDate' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  id: 8,
  documentNo: 16,
  documentDate: 14,
  customerCode: 14,
  customerName: 18,
  plannedDate: 14,
};

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'id': return 'id';
    case 'documentNo': return 'documentNo';
    case 'documentDate': return 'documentDate';
    case 'customerCode': return 'customerCode';
    case 'customerName': return 'customerName';
    case 'plannedDate': return 'plannedDate';
    default: return 'id';
  }
}

function formatCustomer(row: GrHeader): string {
  if (row.customerName && row.customerCode) return `${row.customerName} (${row.customerCode})`;
  return row.customerName || row.customerCode || '-';
}

export function GoodsReceiptApprovalPage(): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.goods-receipt');
  const pageKey = 'goods-receipt-approval-list';
  const showActionsColumn = permission.canView || permission.canApprove;
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const approveMutation = useApproveGrHeader();
  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'id',
    defaultSortDirection: 'desc',
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    {
      key: 'id',
      label: t('goodsReceipt.approval.id'),
      headClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
    },
    { key: 'documentNo', label: t('goodsReceipt.approval.documentNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentDate', label: t('goodsReceipt.approval.documentDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customerCode', label: t('goodsReceipt.approval.customerCode'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customerName', label: t('goodsReceipt.approval.customerName'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'plannedDate', label: t('goodsReceipt.approval.plannedDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('goodsReceipt.approval.actions'), sortable: false },
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

  const { data, isLoading, error } = useAwaitingApprovalGrHeaders(pagedGrid.queryParams);

  useEffect(() => {
    setPageTitle(t('goodsReceipt.approval.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const formatDate = (value: string | null): string =>
    value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';

  const getCellText = (row: GrHeader, key: ColumnKey): string | undefined => {
    switch (key) {
      case 'id': return String(row.id);
      case 'documentNo': return row.documentNo || '-';
      case 'documentDate': return formatDate(row.documentDate);
      case 'customerCode': return formatCustomer(row);
      case 'customerName': return row.customerName || '-';
      case 'plannedDate': return formatDate(row.plannedDate);
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
    customerCode: formatCustomer(item),
    customerName: item.customerName || '-',
    plannedDate: formatDate(item.plannedDate),
  })), [data?.data]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total });

  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    if (!permission.canApprove) return;

    try {
      await approveMutation.mutateAsync({ id, approved });
      toast.success(approved ? t('goodsReceipt.approval.approveSuccess') : t('goodsReceipt.approval.rejectSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : approved ? t('goodsReceipt.approval.approveError') : t('goodsReceipt.approval.rejectError'));
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
            <span>{t('goodsReceipt.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('goodsReceipt.create.breadcrumb.module')}</span>
          </>
        }
        title={t('goodsReceipt.approval.title')}
        description={t('goodsReceipt.approval.subtitle', { defaultValue: t('goodsReceipt.list.subtitle') })}
      >
        <PagedDataGrid<GrHeader, ColumnKey>
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
            customerCode: (
              <div className="min-w-0 text-left">
                <div className="truncate font-medium">{row.customerName || row.customerCode || '-'}</div>
                {row.customerName && row.customerCode ? (
                  <div className="truncate font-mono text-[0.65rem] opacity-70">{row.customerCode}</div>
                ) : null}
              </div>
            ),
            customerName: row.customerName || '-',
            plannedDate: <span className="font-mono text-xs">{formatDate(row.plannedDate)}</span>,
          } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(key) => { if (key !== 'actions') pagedGrid.handleSort(key); }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('goodsReceipt.approval.error')}
          emptyText={t('goodsReceipt.approval.noData')}
          showActionsColumn={showActionsColumn}
          actionsHeaderLabel={t('goodsReceipt.approval.actions')}
          iconOnlyActions={false}
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(row) => (
            <div className="wms-ops-row-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                aria-label={t('goodsReceipt.approval.viewDetails')}
                title={t('goodsReceipt.approval.viewDetails')}
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
                aria-label={t('goodsReceipt.approval.approve')}
                title={t('goodsReceipt.approval.approve')}
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
                aria-label={t('goodsReceipt.approval.reject')}
                title={t('goodsReceipt.approval.reject')}
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
            search: { ...pagedGrid.searchConfig, placeholder: t('goodsReceipt.approval.searchPlaceholder') },
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
        <GoodsReceiptDetailDialog grHeaderId={selectedHeaderId} isOpen onClose={() => setSelectedHeaderId(null)} />
      )}
    </>
  );
}
