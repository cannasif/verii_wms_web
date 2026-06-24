import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Trash2 } from 'lucide-react';
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
import { warehouseApi } from '../api/warehouse-api';
import { useAssignedWarehouseOutboundHeadersPaged } from '../hooks/useWarehouseHeaders';
import { WarehouseDetailDialog } from './WarehouseDetailDialog';
import type { WarehouseHeader } from '../types/warehouse';

type AssignedWarehouseOutboundColumnKey =
  | 'documentNo'
  | 'documentDate'
  | 'customerCode'
  | 'customerName'
  | 'sourceWarehouse'
  | 'documentType'
  | 'status'
  | 'createdDate'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'warehouse.outbound.list.documentNo' },
  { value: 'customerCode', type: 'string', labelKey: 'warehouse.outbound.list.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'warehouse.outbound.list.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'warehouse.outbound.list.sourceWarehouse' },
  { value: 'documentType', type: 'string', labelKey: 'warehouse.outbound.list.documentType' },
  { value: 'isCompleted', type: 'boolean', labelKey: 'warehouse.outbound.list.status' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  documentNo: 14,
  documentDate: 12,
  customerCode: 12,
  customerName: 14,
  sourceWarehouse: 12,
  documentType: 10,
  status: 10,
  createdDate: 14,
};

function mapSortBy(value: AssignedWarehouseOutboundColumnKey): string {
  switch (value) {
    case 'documentNo': return 'DocumentNo';
    case 'documentDate': return 'DocumentDate';
    case 'customerCode': return 'CustomerCode';
    case 'customerName': return 'CustomerName';
    case 'sourceWarehouse': return 'SourceWarehouse';
    case 'documentType': return 'DocumentType';
    case 'createdDate': return 'CreatedDate';
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

export function AssignedWarehouseOutboundListPage(): ReactElement {
  const { t } = useTranslation(['warehouse', 'common']);
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.warehouse.outbound');
  const pageKey = 'warehouse-outbound-assigned-list';
  const showActionsColumn = permission.canView || permission.canDelete;
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [headerToDelete, setHeaderToDelete] = useState<WarehouseHeader | null>(null);

  const pagedGrid = usePagedDataGrid<AssignedWarehouseOutboundColumnKey>({
    pageKey,
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<AssignedWarehouseOutboundColumnKey>[]>(() => [
    { key: 'documentNo', label: t('warehouse.outbound.list.documentNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentDate', label: t('warehouse.outbound.list.documentDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customerCode', label: t('warehouse.outbound.list.customerCode'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'customerName', label: t('warehouse.outbound.list.customerName'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'sourceWarehouse', label: t('warehouse.outbound.list.sourceWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentType', label: t('warehouse.outbound.list.documentType'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'status', label: t('warehouse.outbound.list.status'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'createdDate', label: t('warehouse.outbound.list.createdDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
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
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    includeActionsColumn: showActionsColumn,
  });

  const { data, isLoading, error, refetch } = useAssignedWarehouseOutboundHeadersPaged(pagedGrid.queryParams);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => warehouseApi.deleteOutboundHeader(id),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('common.deleteError'));
      }
      toast.success(t('common.deleteSuccess'));
      setHeaderToDelete(null);
      await refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('common.deleteError'));
    },
  });

  useEffect(() => {
    setPageTitle(t('warehouse.outbound.assignedList.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const getStatusLabel = (item: WarehouseHeader): string => (
    item.isCompleted
      ? t('warehouse.outbound.list.completed')
      : item.isPendingApproval
        ? t('warehouse.outbound.list.pendingApproval')
        : t('warehouse.outbound.list.inProgress')
  );

  const getCellText = (row: WarehouseHeader, key: AssignedWarehouseOutboundColumnKey): string | undefined => {
    switch (key) {
      case 'documentNo': return row.documentNo || '-';
      case 'documentDate': return formatDate(row.documentDate);
      case 'customerCode': return row.customerCode || '-';
      case 'customerName': return row.customerName || '-';
      case 'sourceWarehouse': return row.sourceWarehouse || '-';
      case 'documentType': return row.documentType || '-';
      case 'status': return getStatusLabel(row);
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

  const exportRows = useMemo<Record<string, unknown>[]>(() => (
    (data?.data ?? []).map((item) => ({
      documentNo: item.documentNo || '-',
      documentDate: formatDate(item.documentDate),
      customerCode: item.customerCode || '-',
      customerName: item.customerName || '-',
      sourceWarehouse: item.sourceWarehouse || '-',
      documentType: item.documentType || '-',
      status: getStatusLabel(item),
      createdDate: formatDateTime(item.createdDate),
    }))
  ), [data?.data, t]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total });

  const renderSortIcon = (columnKey: AssignedWarehouseOutboundColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const renderStatusBadge = (item: WarehouseHeader): ReactElement => {
    if (item.isCompleted) {
      return <Badge variant="default" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{t('warehouse.outbound.list.completed')}</Badge>;
    }
    if (item.isPendingApproval) {
      return <Badge variant="secondary" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{t('warehouse.outbound.list.pendingApproval')}</Badge>;
    }
    return <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{t('warehouse.outbound.list.inProgress')}</Badge>;
  };

  return (
    <>
      <OpsListPageShell
        eyebrow={
          <>
            <span>{t('warehouse.outbound.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('warehouse.outbound.create.breadcrumb.module')}</span>
          </>
        }
        title={t('warehouse.outbound.assignedList.title')}
        description={t('warehouse.outbound.assignedList.subtitle')}
      >
        {!permission.canMutate ? <PermissionNotice /> : null}

        <PagedDataGrid<WarehouseHeader, AssignedWarehouseOutboundColumnKey>
          variant="ops"
          columns={columns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as AssignedWarehouseOutboundColumnKey[]}
          defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
          columnWidths={columnWidths}
          onResizeColumnPair={resizeColumnPair}
          getCellText={getCellText}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(item, columnKey) => ({
            documentNo: <span className="font-medium font-mono text-xs">{item.documentNo || '-'}</span>,
            documentDate: <span className="font-mono text-xs">{formatDate(item.documentDate)}</span>,
            customerCode: item.customerCode || '-',
            customerName: item.customerName || '-',
            sourceWarehouse: item.sourceWarehouse || '-',
            documentType: <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{item.documentType || '-'}</Badge>,
            status: renderStatusBadge(item),
            createdDate: <span className="font-mono text-xs">{formatDateTime(item.createdDate)}</span>,
          } as Record<Exclude<AssignedWarehouseOutboundColumnKey, 'actions'>, React.ReactNode>)[columnKey as Exclude<AssignedWarehouseOutboundColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'status' || columnKey === 'actions') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('warehouse.outbound.assignedList.error')}
          emptyText={t('warehouse.outbound.assignedList.noData')}
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
                aria-label={t('warehouse.outbound.list.viewDetails')}
                title={t('warehouse.outbound.list.viewDetails')}
                onClick={() => {
                  setSelectedHeaderId(item.id);
                  setSelectedDocumentType(item.documentType);
                }}
                disabled={!permission.canView}
              >
                <Eye className="size-3" aria-hidden />
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
            defaultFilterColumn: 'documentNo',
            draftFilterRows: pagedGrid.draftFilterRows,
            onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
            filterLogic: pagedGrid.filterLogic,
            onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters,
            onClearFilters: pagedGrid.clearAdvancedFilters,
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: {
              ...pagedGrid.searchConfig,
              placeholder: t('warehouse.outbound.assignedList.searchPlaceholder'),
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
        <WarehouseDetailDialog
          headerId={selectedHeaderId}
          documentType={selectedDocumentType ?? ''}
          isOpen={selectedHeaderId != null}
          onClose={() => {
            setSelectedHeaderId(null);
            setSelectedDocumentType(null);
          }}
        />
      )}

      <DeleteConfirmDialog
        open={headerToDelete != null}
        onOpenChange={(open) => {
          if (!open) setHeaderToDelete(null);
        }}
        itemLabel={headerToDelete?.documentNo || (headerToDelete ? `#${headerToDelete.id}` : undefined)}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (headerToDelete) deleteMutation.mutate(headerToDelete.id);
        }}
      />
    </>
  );
}
