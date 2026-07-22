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
import { useAssignedGrHeaders } from '../hooks/useAssignedGrHeaders';
import { GoodsReceiptDetailDialog } from './GoodsReceiptDetailDialog';
import type { GrHeader } from '../types/goods-receipt';
import { goodsReceiptApi } from '../api/goods-receipt-api';

type AssignedGrColumnKey =
  | 'id'
  | 'orderId'
  | 'customerCode'
  | 'projectCode'
  | 'documentType'
  | 'plannedDate'
  | 'status'
  | 'createdDate'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'orderId', type: 'string', labelKey: 'goodsReceipt.report.orderId' },
  { value: 'customerCode', type: 'string', labelKey: 'goodsReceipt.report.customerCode' },
  { value: 'projectCode', type: 'string', labelKey: 'goodsReceipt.report.projectCode' },
  { value: 'documentType', type: 'string', labelKey: 'goodsReceipt.report.documentType' },
  { value: 'isCompleted', type: 'boolean', labelKey: 'goodsReceipt.report.status' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  id: 9,
  orderId: 14,
  customerCode: 16,
  projectCode: 12,
  documentType: 12,
  plannedDate: 14,
  status: 12,
  createdDate: 16,
};

function mapSortBy(value: AssignedGrColumnKey): string {
  switch (value) {
    case 'orderId':
      return 'OrderId';
    case 'customerCode':
      return 'CustomerCode';
    case 'projectCode':
      return 'ProjectCode';
    case 'documentType':
      return 'DocumentType';
    case 'plannedDate':
      return 'PlannedDate';
    case 'createdDate':
      return 'CreatedDate';
    case 'id':
    default:
      return 'Id';
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCustomer(row: GrHeader): string {
  if (row.customerName && row.customerCode) return `${row.customerName} (${row.customerCode})`;
  return row.customerName || row.customerCode || '-';
}

export function AssignedGrListPage(): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.goods-receipt');
  const pageKey = 'goods-receipt-assigned-list';
  const showActionsColumn = permission.canView || permission.canUpdate || permission.canDelete;
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [headerToDelete, setHeaderToDelete] = useState<GrHeader | null>(null);

  const pagedGrid = usePagedDataGrid<AssignedGrColumnKey>({
    pageKey,
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<AssignedGrColumnKey>[]>(() => [
    {
      key: 'id',
      label: t('goodsReceipt.report.id'),
      headClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
    },
    { key: 'orderId', label: t('goodsReceipt.report.orderId'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customerCode', label: t('goodsReceipt.report.customerCode'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'projectCode', label: t('goodsReceipt.report.projectCode'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentType', label: t('goodsReceipt.report.documentType'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'plannedDate', label: t('goodsReceipt.report.plannedDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'status', label: t('goodsReceipt.report.status'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'createdDate', label: t('goodsReceipt.report.createdDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('common.actions'), sortable: false },
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

  const { data, isLoading, error, refetch } = useAssignedGrHeaders(pagedGrid.queryParams);
  const deleteMutation = useMutation({
    mutationFn: (id: number) => goodsReceiptApi.deleteGoodsReceiptHeader(id),
    onSuccess: async (response) => {
      if (!response.success) throw new Error(response.message || t('common.errors.deleteFailed'));
      toast.success(response.message || t('common.deleteSuccess'));
      setHeaderToDelete(null);
      await refetch();
    },
    onError: (err: Error) => toast.error(err.message || t('common.errors.deleteFailed')),
  });

  useEffect(() => {
    setPageTitle(t('goodsReceipt.assignedList.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const statusLabel = (item: GrHeader): string => {
    if (['pendinginspection', 'quarantined'].includes((item.qualityStatus || '').toLowerCase())) {
      return t('goodsReceipt.report.pendingQualityApproval');
    }
    if (item.isCompleted) return t('goodsReceipt.report.completed');
    if (item.isPendingApproval) return t('goodsReceipt.report.pendingApproval');
    return t('goodsReceipt.report.inProgress');
  };

  const statusBadge = (item: GrHeader): ReactElement => {
    if (['pendinginspection', 'quarantined'].includes((item.qualityStatus || '').toLowerCase())) {
      return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--pending mx-auto">{t('goodsReceipt.report.pendingQualityApproval')}</Badge>;
    }
    if (item.isCompleted) {
      return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--done mx-auto">{t('goodsReceipt.report.completed')}</Badge>;
    }
    if (item.isPendingApproval) {
      return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--pending mx-auto">{t('goodsReceipt.report.pendingApproval')}</Badge>;
    }
    return <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--active mx-auto">{t('goodsReceipt.report.inProgress')}</Badge>;
  };

  const getCellText = (row: GrHeader, key: AssignedGrColumnKey): string | undefined => {
    switch (key) {
      case 'id': return String(row.id);
      case 'orderId': return row.orderId || '-';
      case 'customerCode': return formatCustomer(row);
      case 'projectCode': return row.projectCode || '-';
      case 'documentType': return row.documentType || '-';
      case 'plannedDate': return formatDate(row.plannedDate);
      case 'status': return statusLabel(row);
      case 'createdDate': return formatDateTime(row.createdDate);
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
    orderId: item.orderId || '-',
    customerCode: formatCustomer(item),
    projectCode: item.projectCode || '-',
    documentType: item.documentType || '-',
    plannedDate: formatDate(item.plannedDate),
    status: statusLabel(item),
    createdDate: formatDateTime(item.createdDate),
  })), [data?.data, t]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
  });

  const renderSortIcon = (columnKey: AssignedGrColumnKey): ReactElement | null => {
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
        title={t('goodsReceipt.assignedList.title')}
        description={t('goodsReceipt.assignedList.subtitle', { defaultValue: t('goodsReceipt.list.subtitle') })}
      >
        {!permission.canMutate ? <PermissionNotice /> : null}

        <PagedDataGrid<GrHeader, AssignedGrColumnKey>
          variant="ops"
          columns={columns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as AssignedGrColumnKey[]}
          defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
          columnWidths={columnWidths}
          onResizeColumnPair={resizeColumnPair}
          getCellText={getCellText}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(item, columnKey) => ({
            id: <span className="wms-ops-table-id-value">{item.id}</span>,
            orderId: <span className="font-medium font-mono text-xs">{item.orderId || '-'}</span>,
            customerCode: (
              <div className="min-w-0 text-left">
                <div className="truncate font-medium">{item.customerName || item.customerCode || '-'}</div>
                {item.customerName && item.customerCode ? (
                  <div className="truncate font-mono text-[0.65rem] opacity-70">{item.customerCode}</div>
                ) : null}
              </div>
            ),
            projectCode: item.projectCode || '-',
            documentType: <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{item.documentType || '-'}</Badge>,
            plannedDate: formatDate(item.plannedDate),
            status: statusBadge(item),
            createdDate: <span className="font-mono text-xs">{formatDateTime(item.createdDate)}</span>,
          } as Record<Exclude<AssignedGrColumnKey, 'actions'>, React.ReactNode>)[columnKey as Exclude<AssignedGrColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'status' || columnKey === 'actions') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('goodsReceipt.assignedList.error')}
          emptyText={t('goodsReceipt.assignedList.noData')}
          showActionsColumn={showActionsColumn}
          actionsHeaderLabel={t('common.actions')}
          iconOnlyActions={false}
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(item) => (
            <div className="wms-ops-row-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                aria-label={t('goodsReceipt.report.viewDetails')}
                title={t('goodsReceipt.report.viewDetails')}
                onClick={() => setSelectedHeaderId(item.id)}
                disabled={!permission.canView}
              >
                <Eye className="size-3" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--start"
                aria-label={t('common.start')}
                title={t('common.start')}
                onClick={() => navigate(`/goods-receipt/collection/${item.id}`)}
                disabled={!permission.canUpdate}
              >
                <PlayCircle className="size-3" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
                aria-label={t('common.delete')}
                title={t('common.delete')}
                onClick={() => setHeaderToDelete(item)}
                disabled={!permission.canDelete || deleteMutation.isPending}
              >
                <Trash2 className="size-3" aria-hidden />
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
            defaultFilterColumn: 'orderId',
            draftFilterRows: pagedGrid.draftFilterRows,
            onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
            filterLogic: pagedGrid.filterLogic,
            onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters,
            onClearFilters: pagedGrid.clearAdvancedFilters,
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: {
              ...pagedGrid.searchConfig,
              placeholder: t('goodsReceipt.assignedList.searchPlaceholder'),
            },
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
        <GoodsReceiptDetailDialog
          grHeaderId={selectedHeaderId}
          isOpen={selectedHeaderId != null}
          onClose={() => setSelectedHeaderId(null)}
        />
      )}
      <DeleteConfirmDialog
        open={Boolean(headerToDelete)}
        itemLabel={headerToDelete?.orderId || `#${headerToDelete?.id ?? ''}`}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setHeaderToDelete(null);
        }}
        onConfirm={() => {
          if (headerToDelete) deleteMutation.mutate(headerToDelete.id);
        }}
      />
    </>
  );
}
