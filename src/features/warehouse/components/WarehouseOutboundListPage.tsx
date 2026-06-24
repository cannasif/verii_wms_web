import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
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
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useWarehouseOutboundHeadersPaged } from '../hooks/useWarehouseHeaders';
import type { WarehouseHeader } from '../types/warehouse';
import { WarehouseDetailDialog } from './WarehouseDetailDialog';
import { warehouseApi } from '../api/warehouse-api';

type WarehouseOutboundColumnKey =
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
  { value: 'documentDate', type: 'date', labelKey: 'warehouse.outbound.list.documentDate' },
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

function mapSortBy(value: WarehouseOutboundColumnKey): string {
  switch (value) {
    case 'documentNo':
      return 'DocumentNo';
    case 'documentDate':
      return 'DocumentDate';
    case 'customerCode':
      return 'CustomerCode';
    case 'customerName':
      return 'CustomerName';
    case 'sourceWarehouse':
      return 'SourceWarehouse';
    case 'documentType':
      return 'DocumentType';
    case 'createdDate':
    default:
      return 'CreatedDate';
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

export function WarehouseOutboundListPage(): ReactElement {
  const { t } = useTranslation(['warehouse', 'common']);
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.warehouse.outbound');
  const pageKey = 'warehouse-outbound-list';
  const showActionsColumn = permission.canView || permission.canUpdate || permission.canDelete;
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [headerToDelete, setHeaderToDelete] = useState<WarehouseHeader | null>(null);

  const pagedGrid = usePagedDataGrid<WarehouseOutboundColumnKey>({
    pageKey,
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<WarehouseOutboundColumnKey>[]>(
    () => [
      { key: 'documentNo', label: t('warehouse.outbound.list.documentNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'documentDate', label: t('warehouse.outbound.list.documentDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'customerCode', label: t('warehouse.outbound.list.customerCode'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'customerName', label: t('warehouse.outbound.list.customerName'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'sourceWarehouse', label: t('warehouse.outbound.list.sourceWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'documentType', label: t('warehouse.outbound.list.documentType'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'status', label: t('warehouse.outbound.list.status'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'createdDate', label: t('warehouse.outbound.list.createdDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'actions', label: t('common.actions'), sortable: false },
    ],
    [t],
  );

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

  const { data, isLoading, error, refetch } = useWarehouseOutboundHeadersPaged(pagedGrid.queryParams);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => warehouseApi.deleteOutboundHeader(id),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('common.errors.deleteFailed'));
      }
      toast.success(response.message || t('common.deleteSuccess'));
      setHeaderToDelete(null);
      await refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message || t('common.errors.deleteFailed'));
    },
  });

  useEffect(() => {
    setPageTitle(t('warehouse.outbound.list.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const getStatusLabel = useCallback((item: WarehouseHeader): string => {
    if (item.isCompleted) return t('warehouse.outbound.list.completed');
    if (item.isPendingApproval) return t('warehouse.outbound.list.pendingApproval');
    return t('warehouse.outbound.list.inProgress');
  }, [t]);

  const handleRowClick = (header: WarehouseHeader): void => {
    setSelectedHeaderId(header.id);
    setSelectedDocumentType(header.documentType);
  };

  const getCellText = (row: WarehouseHeader, key: WarehouseOutboundColumnKey): string | undefined => {
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
    () => orderedVisibleColumns
      .filter((key) => key !== 'actions')
      .map((key) => ({
        key,
        label: columns.find((column) => column.key === key)?.label ?? key,
      })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({
    documentNo: item.documentNo || '-',
    documentDate: formatDate(item.documentDate),
    customerCode: item.customerCode || '-',
    customerName: item.customerName || '-',
    sourceWarehouse: item.sourceWarehouse || '-',
    documentType: item.documentType || '-',
    status: getStatusLabel(item),
    createdDate: formatDateTime(item.createdDate),
  })), [data?.data, getStatusLabel]);

  const renderSortIcon = (columnKey: WarehouseOutboundColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
  });

  const renderStatusBadge = (row: WarehouseHeader): ReactElement => {
    if (row.isCompleted) {
      return <Badge variant="default" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{t('warehouse.outbound.list.completed')}</Badge>;
    }
    if (row.isPendingApproval) {
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
        title={t('warehouse.outbound.list.title')}
        description={t('warehouse.outbound.list.subtitle')}
      >
        {!permission.canMutate ? <PermissionNotice /> : null}

        <PagedDataGrid<WarehouseHeader, WarehouseOutboundColumnKey>
          variant="ops"
          columns={columns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as WarehouseOutboundColumnKey[]}
          defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
          columnWidths={columnWidths}
          onResizeColumnPair={resizeColumnPair}
          getCellText={getCellText}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, columnKey) => ({
            documentNo: <span className="font-medium font-mono text-xs">{row.documentNo || '-'}</span>,
            documentDate: <span className="font-mono text-xs">{formatDate(row.documentDate)}</span>,
            customerCode: row.customerCode || '-',
            customerName: row.customerName || '-',
            sourceWarehouse: row.sourceWarehouse || '-',
            documentType: <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{row.documentType || '-'}</Badge>,
            status: renderStatusBadge(row),
            createdDate: <span className="font-mono text-xs">{formatDateTime(row.createdDate)}</span>,
          } as Record<Exclude<WarehouseOutboundColumnKey, 'actions'>, React.ReactNode>)[columnKey as Exclude<WarehouseOutboundColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'status' || columnKey === 'actions') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('warehouse.outbound.list.error')}
          emptyText={t('warehouse.outbound.list.noData')}
          showActionsColumn={showActionsColumn}
          actionsHeaderLabel={t('common.actions')}
          iconOnlyActions={false}
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(row) => (
            <div className="wms-ops-row-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                aria-label={t('warehouse.outbound.list.viewDetails')}
                title={t('warehouse.outbound.list.viewDetails')}
                onClick={() => handleRowClick(row)}
                disabled={!permission.canView}
              >
                <Eye className="size-3" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                aria-label={t('common.edit')}
                title={t('common.edit')}
                onClick={() => navigate(`/warehouse/outbound/edit/${row.id}`)}
                disabled={!permission.canUpdate || row.isCompleted}
              >
                <Pencil className="size-3" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
                aria-label={t('common.delete')}
                title={t('common.delete')}
                onClick={() => setHeaderToDelete(row)}
                disabled={!permission.canDelete || deleteMutation.isPending}
              >
                <Trash2 className="size-3" aria-hidden />
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
            filterColumns: advancedFilterColumns,
            defaultFilterColumn: 'documentNo',
            draftFilterRows: pagedGrid.draftFilterRows,
            onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
            filterLogic: pagedGrid.filterLogic,
            onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters,
            onClearFilters: pagedGrid.clearAdvancedFilters,
            translationNamespace: 'common',
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: {
              ...pagedGrid.searchConfig,
              placeholder: t('warehouse.outbound.list.searchPlaceholder'),
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

      <WarehouseDetailDialog
        headerId={selectedHeaderId ?? 0}
        documentType={selectedDocumentType ?? ''}
        isOpen={selectedHeaderId !== null}
        onClose={() => {
          setSelectedHeaderId(null);
          setSelectedDocumentType(null);
        }}
      />
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
    </>
  );
}
