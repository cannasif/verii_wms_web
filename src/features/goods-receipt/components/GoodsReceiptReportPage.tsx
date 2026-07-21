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
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { useGrHeaders } from '../hooks/useGrHeaders';
import type { GrHeader } from '../types/goods-receipt';
import { GoodsReceiptDetailDialog } from './GoodsReceiptDetailDialog';
import { goodsReceiptApi } from '../api/goods-receipt-api';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';

type ColumnKey = 'id' | 'orderId' | 'customerCode' | 'projectCode' | 'documentType' | 'plannedDate' | 'status' | 'createdDate' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'goodsReceipt.report.id' },
  { value: 'orderId', type: 'string', labelKey: 'goodsReceipt.report.orderId' },
  { value: 'customerCode', type: 'string', labelKey: 'goodsReceipt.report.customerCode' },
  { value: 'projectCode', type: 'string', labelKey: 'goodsReceipt.report.projectCode' },
  { value: 'documentType', type: 'string', labelKey: 'goodsReceipt.report.documentType' },
  { value: 'plannedDate', type: 'date', labelKey: 'goodsReceipt.report.plannedDate' },
  { value: 'createdDate', type: 'date', labelKey: 'goodsReceipt.report.createdDate' },
];

const ELECTRONIC_DISPATCH_DOCUMENT_TYPE = 'E-IRSALIYE';
const ELECTRONIC_DISPATCH_DOCUMENT_TYPE_ALTERNATE = 'E-INVOICE';

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

const normalizeDocumentType = (value: string | null | undefined): string =>
  (value ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'I')
    .toUpperCase();

const isElectronicDispatchDocumentType = (documentType: string | null | undefined): boolean => {
  const normalized = normalizeDocumentType(documentType);
  return normalized === ELECTRONIC_DISPATCH_DOCUMENT_TYPE || normalized === ELECTRONIC_DISPATCH_DOCUMENT_TYPE_ALTERNATE;
};

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'id': return 'id';
    case 'orderId': return 'orderId';
    case 'customerCode': return 'customerCode';
    case 'projectCode': return 'projectCode';
    case 'documentType': return 'documentType';
    case 'plannedDate': return 'plannedDate';
    case 'createdDate':
    default: return 'createdDate';
  }
}

function formatCustomer(row: GrHeader): string {
  if (row.customerName && row.customerCode) return `${row.customerName} (${row.customerCode})`;
  return row.customerName || row.customerCode || '-';
}

export function GoodsReceiptReportPage(): ReactElement {
  const { t } = useTranslation(['goods-receipt', 'common']);
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.goods-receipt');
  const showActionsColumn = permission.canView || permission.canUpdate || permission.canDelete;
  const [selectedGrHeaderId, setSelectedGrHeaderId] = useState<number | null>(null);
  const [headerToDelete, setHeaderToDelete] = useState<GrHeader | null>(null);
  const pagedGrid = usePagedDataGrid<ColumnKey>({ pageKey: 'goods-receipt-report', defaultSortBy: 'createdDate', defaultSortDirection: 'desc', defaultPageNumber: 1, pageNumberBase: 1, mapSortBy });
  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    {
      key: 'id',
      label: t('goodsReceipt.report.id'),
      headClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
    },
    {
      key: 'orderId',
      label: t('goodsReceipt.report.orderId'),
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'customerCode',
      label: t('goodsReceipt.report.customerCode'),
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'projectCode',
      label: t('goodsReceipt.report.projectCode'),
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'documentType',
      label: t('goodsReceipt.report.documentType'),
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'plannedDate',
      label: t('goodsReceipt.report.plannedDate'),
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'status',
      label: t('goodsReceipt.report.status'),
      sortable: false,
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    {
      key: 'createdDate',
      label: t('goodsReceipt.report.createdDate'),
      headClassName: 'wms-ops-table-center-col',
      cellClassName: 'wms-ops-table-center-col',
    },
    { key: 'actions', label: t('goodsReceipt.report.actions'), sortable: false },
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
    pageKey: 'goods-receipt-report',
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    includeActionsColumn: showActionsColumn,
  });
  const { data, isLoading, error, refetch } = useGrHeaders(pagedGrid.queryParams);
  const deleteMutation = useMutation({
    mutationFn: (id: number) => goodsReceiptApi.deleteGoodsReceiptHeader(id),
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
  useEffect(() => { setPageTitle(t('goodsReceipt.list.title')); return () => setPageTitle(null); }, [setPageTitle, t]);
  const formatDate = (value: string | null): string => value ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const formatDateTime = (value: string | null): string => value ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
  const statusLabel = (item: GrHeader): string => {
    if (item.isCompleted) return t('goodsReceipt.report.completed');
    if (item.isPendingApproval) return t('goodsReceipt.report.pendingApproval');
    return t('goodsReceipt.report.inProgress');
  };
  const getCellText = (row: GrHeader, key: ColumnKey): string | undefined => {
    switch (key) {
      case 'id':
        return String(row.id);
      case 'orderId':
        return row.orderId || '-';
      case 'customerCode':
        return formatCustomer(row);
      case 'projectCode':
        return row.projectCode || '-';
      case 'documentType':
        return row.documentType || '-';
      case 'plannedDate':
        return formatDate(row.plannedDate);
      case 'status':
        return statusLabel(row);
      case 'createdDate':
        return formatDateTime(row.createdDate);
      default:
        return undefined;
    }
  };
  const statusBadge = (item: GrHeader): ReactElement => {
    if (item.isCompleted) {
      return (
        <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--done mx-auto">
          {t('goodsReceipt.report.completed')}
        </Badge>
      );
    }
    if (item.isPendingApproval) {
      return (
        <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--pending mx-auto">
          {t('goodsReceipt.report.pendingApproval')}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--active mx-auto">
        {t('goodsReceipt.report.inProgress')}
      </Badge>
    );
  };
  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };
  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({ id: item.id, orderId: item.orderId || '-', customerCode: formatCustomer(item), projectCode: item.projectCode || '-', documentType: item.documentType || '-', plannedDate: formatDate(item.plannedDate), status: statusLabel(item), createdDate: formatDateTime(item.createdDate) })), [data?.data, t]);
  const range = getPagedRange(data, 1);
  const paginationInfoText = t('goodsReceipt.report.paginationInfo', { current: range.from, total: range.to, totalCount: range.total });

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
        title={t('goodsReceipt.list.title')}
        description={t('goodsReceipt.list.subtitle')}
      >
        {!permission.canMutate ? <PermissionNotice /> : null}

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
            orderId: <span className="font-medium font-mono text-xs">{row.orderId || '-'}</span>,
            customerCode: (
              <div className="min-w-0 text-left">
                <div className="truncate font-medium">{row.customerName || row.customerCode || '-'}</div>
                {row.customerName && row.customerCode ? (
                  <div className="truncate font-mono text-[0.65rem] opacity-70">{row.customerCode}</div>
                ) : null}
              </div>
            ),
            projectCode: row.projectCode || '-',
            documentType: (
              <Badge
                variant="outline"
                className={cn(
                  'wms-ops-code-badge mx-auto rounded-none text-[0.625rem]',
                  isElectronicDispatchDocumentType(row.documentType) && 'opacity-90',
                )}
              >
                {row.documentType || '-'}
              </Badge>
            ),
            plannedDate: formatDate(row.plannedDate),
            status: statusBadge(row),
            createdDate: <span className="font-mono text-xs">{formatDateTime(row.createdDate)}</span>,
          } as Record<Exclude<ColumnKey, 'actions'>, React.ReactNode>)[key as Exclude<ColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(key) => { if (key !== 'status' && key !== 'actions') pagedGrid.handleSort(key); }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('goodsReceipt.report.error')}
          emptyText={t('goodsReceipt.report.noData')}
          showActionsColumn={showActionsColumn}
          actionsHeaderLabel={t('goodsReceipt.report.actions')}
          iconOnlyActions={false}
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(row) => (
            <div className="wms-ops-row-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                aria-label={t('goodsReceipt.report.viewDetails')}
                title={t('goodsReceipt.report.viewDetails')}
                onClick={() => setSelectedGrHeaderId(row.id)}
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
                onClick={() => navigate(`/goods-receipt/edit/${row.id}`)}
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
            pageKey: 'goods-receipt-report',
            userId,
            columns: columns.map(({ key, label }) => ({ key, label })),
            visibleColumns,
            columnOrder,
            onVisibleColumnsChange: setVisibleColumns,
            onColumnOrderChange: setColumnOrder,
            exportFileName: 'goods-receipt-report',
            exportColumns,
            exportRows,
            filterColumns,
            defaultFilterColumn: 'orderId',
            draftFilterRows: pagedGrid.draftFilterRows,
            onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
            filterLogic: pagedGrid.filterLogic,
            onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters,
            onClearFilters: pagedGrid.clearAdvancedFilters,
            translationNamespace: 'common',
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: { ...pagedGrid.searchConfig, placeholder: t('goodsReceipt.report.searchPlaceholder'), className: 'h-9 w-full md:w-64' },
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

      {selectedGrHeaderId && <GoodsReceiptDetailDialog grHeaderId={selectedGrHeaderId} isOpen onClose={() => setSelectedGrHeaderId(null)} />}
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
