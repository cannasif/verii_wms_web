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
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useTransferHeadersPaged } from '../hooks/useTransferHeaders';
import type { TransferHeader } from '../types/transfer';
import { TransferDetailDialog } from './TransferDetailDialog';
import { transferApi } from '../api/transfer-api';

type TransferColumnKey =
  | 'id'
  | 'documentNo'
  | 'documentDate'
  | 'customerCode'
  | 'customerName'
  | 'sourceWarehouse'
  | 'targetWarehouse'
  | 'documentType'
  | 'createdDate'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'transfer.list.id' },
  { value: 'documentNo', type: 'string', labelKey: 'transfer.list.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'transfer.list.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'transfer.list.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'transfer.list.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'transfer.list.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'transfer.list.targetWarehouse' },
  { value: 'documentType', type: 'string', labelKey: 'transfer.list.documentType' },
  { value: 'createdDate', type: 'date', labelKey: 'transfer.list.createdDate' },
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

function mapSortBy(value: TransferColumnKey): string {
  switch (value) {
    case 'id':
      return 'Id';
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
    case 'targetWarehouse':
      return 'TargetWarehouse';
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

export function TransferListPage(): ReactElement {
  const { t } = useTranslation(['transfer', 'common']);
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.transfer');
  const pageKey = 'transfer-list';
  const showActionsColumn = permission.canView || permission.canUpdate || permission.canDelete;
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [headerToDelete, setHeaderToDelete] = useState<TransferHeader | null>(null);

  const pagedGrid = usePagedDataGrid<TransferColumnKey>({
    pageKey,
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<TransferColumnKey>[]>(
    () => [
      {
        key: 'id',
        label: t('transfer.list.id'),
        headClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
        cellClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
      },
      { key: 'documentNo', label: t('transfer.list.documentNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'documentDate', label: t('transfer.list.documentDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'customerCode', label: t('transfer.list.customerCode'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'customerName', label: t('transfer.list.customerName'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'sourceWarehouse', label: t('transfer.list.sourceWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'targetWarehouse', label: t('transfer.list.targetWarehouse'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'documentType', label: t('transfer.list.documentType'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'createdDate', label: t('transfer.list.createdDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
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
    idColumnKey: 'id',
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    includeActionsColumn: showActionsColumn,
  });

  const { data, isLoading, error, refetch } = useTransferHeadersPaged(pagedGrid.queryParams);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => transferApi.deleteTransferHeader(id),
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
    setPageTitle(t('transfer.list.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const getCellText = (row: TransferHeader, key: TransferColumnKey): string | undefined => {
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

  const renderSortIcon = (columnKey: TransferColumnKey): ReactElement | null => {
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

  const renderDocumentNo = (row: TransferHeader): ReactElement => (
    <div className="space-y-1">
      <span className="font-medium font-mono text-xs">{row.documentNo || '-'}</span>
      {row.businessContext === 'BilginogluHakEdis' ? (
        <Badge className="rounded-xl border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50">
          {t(`transfer.businessContext.${row.businessContextStep || 'BilginogluHakEdis'}`, {
            defaultValue: t('transfer.businessContext.BilginogluHakEdis'),
          })}
        </Badge>
      ) : null}
    </div>
  );

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
        title={t('transfer.list.title')}
        description={t('transfer.list.subtitle')}
      >
        {!permission.canMutate ? <PermissionNotice /> : null}

        <PagedDataGrid<TransferHeader, TransferColumnKey>
          variant="ops"
          columns={columns}
          visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as TransferColumnKey[]}
          defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
          columnWidths={columnWidths}
          onResizeColumnPair={resizeColumnPair}
          getCellText={getCellText}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, columnKey) => ({
            id: <span className="wms-ops-table-id-value">{row.id}</span>,
            documentNo: renderDocumentNo(row),
            documentDate: <span className="font-mono text-xs">{formatDate(row.documentDate)}</span>,
            customerCode: row.customerCode || '-',
            customerName: row.customerName || '-',
            sourceWarehouse: row.sourceWarehouse || '-',
            targetWarehouse: row.targetWarehouse || '-',
            documentType: <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{row.documentType || '-'}</Badge>,
            createdDate: <span className="font-mono text-xs">{formatDateTime(row.createdDate)}</span>,
          } as Record<Exclude<TransferColumnKey, 'actions'>, React.ReactNode>)[columnKey as Exclude<TransferColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'actions') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('transfer.list.error')}
          emptyText={t('transfer.list.noData')}
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
                aria-label={t('transfer.list.viewDetails')}
                title={t('transfer.list.viewDetails')}
                onClick={() => setSelectedHeaderId(row.id)}
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
                onClick={() => navigate(`/transfer/edit/${row.id}`)}
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
              placeholder: t('transfer.list.searchPlaceholder'),
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

      <TransferDetailDialog
        headerId={selectedHeaderId ?? 0}
        isOpen={selectedHeaderId !== null}
        onClose={() => setSelectedHeaderId(null)}
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
