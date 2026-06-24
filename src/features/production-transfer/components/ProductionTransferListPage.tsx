import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, Eye, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { FieldHelpTooltip } from '@/features/access-control/components/FieldHelpTooltip';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { productionTransferApi } from '../api/production-transfer-api';
import type { ProductionTransferListItem } from '../types/production-transfer';

type ProductionTransferColumnKey =
  | 'documentNo'
  | 'documentDate'
  | 'transferPurpose'
  | 'productionLink'
  | 'sourceWarehouse'
  | 'targetWarehouse'
  | 'status'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'common.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'common.documentDate' },
  { value: 'transferPurpose', type: 'string', labelKey: 'productionTransfer.create.purpose' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'production.create.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'production.create.targetWarehouse' },
  { value: 'isCompleted', type: 'boolean', labelKey: 'common.status' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  documentNo: 14,
  documentDate: 12,
  transferPurpose: 14,
  productionLink: 12,
  sourceWarehouse: 12,
  targetWarehouse: 12,
  status: 10,
};

function mapSortBy(value: ProductionTransferColumnKey): string {
  switch (value) {
    case 'documentNo':
      return 'DocumentNo';
    case 'documentDate':
      return 'DocumentDate';
    case 'transferPurpose':
      return 'TransferPurpose';
    case 'productionLink':
      return 'ProductionOrderId';
    case 'sourceWarehouse':
      return 'SourceWarehouse';
    case 'targetWarehouse':
      return 'TargetWarehouse';
    case 'status':
      return 'IsCompleted';
    case 'actions':
    default:
      return 'Id';
  }
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function transferPurposeLabel(value: string | null | undefined, t: (key: string, options?: Record<string, unknown>) => string): string {
  switch (value) {
    case 'MaterialSupply':
      return t('productionTransfer.create.guide.materialSupply');
    case 'SemiFinishedMove':
      return t('productionTransfer.create.guide.semiFinishedMove');
    case 'FinishedGoodsPutaway':
      return t('productionTransfer.create.guide.outputMove');
    case 'ScrapMove':
      return t('productionTransfer.create.guide.scrapMove');
    case 'ReturnToStock':
      return t('productionTransfer.create.guide.returnToStock');
    default:
      return value || '-';
  }
}

export function ProductionTransferListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.production-transfer');
  const canUpdateTransfer = permission.canUpdate;
  const canCreateTransfer = permission.canCreate;
  const canDeleteTransfer = permission.canDelete;
  const pageKey = 'production-transfer-list';
  const showActionsColumn = permission.canView || canUpdateTransfer || canDeleteTransfer || canCreateTransfer;
  const [itemToDelete, setItemToDelete] = useState<ProductionTransferListItem | null>(null);

  const pagedGrid = usePagedDataGrid<ProductionTransferColumnKey>({
    pageKey,
    defaultSortBy: 'documentDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('productionTransfer.list.title', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ProductionTransferColumnKey>[]>(() => [
    { key: 'documentNo', label: t('common.documentNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'documentDate', label: t('common.documentDate', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'transferPurpose', label: t('productionTransfer.create.purpose', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'productionLink', label: t('productionTransfer.list.productionLink', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'sourceWarehouse', label: t('production.create.sourceWarehouse', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'targetWarehouse', label: t('production.create.targetWarehouse', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'status', label: t('common.status', { defaultValue: 'Missing translation' }), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
    { key: 'actions', label: t('common.actions', { defaultValue: 'Missing translation' }), sortable: false },
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
    idColumnKey: 'documentNo',
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    includeActionsColumn: showActionsColumn,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['production-transfer-headers-paged', pagedGrid.queryParams],
    queryFn: () => productionTransferApi.getHeadersPaged(pagedGrid.queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productionTransferApi.softDeleteProductionTransfer(id),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('productionTransfer.list.deleteError'));
      }
      toast.success(t('productionTransfer.list.deleteSuccess'));
      setItemToDelete(null);
      await refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('productionTransfer.list.deleteError'));
    },
  });

  const getCellText = (row: ProductionTransferListItem, key: ProductionTransferColumnKey): string | undefined => {
    switch (key) {
      case 'documentNo': return row.documentNo || '-';
      case 'documentDate': return formatDate(row.documentDate);
      case 'transferPurpose': return transferPurposeLabel(row.transferPurpose, t);
      case 'productionLink':
        return row.productionOrderId
          ? t('productionTransfer.list.orderLink', { id: row.productionOrderId })
          : row.productionHeaderId
            ? t('productionTransfer.list.planLink', { id: row.productionHeaderId })
            : '-';
      case 'sourceWarehouse': return row.sourceWarehouse || '-';
      case 'targetWarehouse': return row.targetWarehouse || '-';
      case 'status': return row.isCompleted ? t('productionTransfer.detail.completed') : t('productionTransfer.detail.open');
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

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    return (data?.data ?? []).map((item) => ({
      documentNo: item.documentNo || '-',
      documentDate: formatDate(item.documentDate),
      transferPurpose: transferPurposeLabel(item.transferPurpose, t),
      productionLink: item.productionOrderId ? t('productionTransfer.list.orderLink', { id: item.productionOrderId }) : (item.productionHeaderId ? t('productionTransfer.list.planLink', { id: item.productionHeaderId }) : '-'),
      sourceWarehouse: item.sourceWarehouse || '-',
      targetWarehouse: item.targetWarehouse || '-',
      status: item.isCompleted ? t('productionTransfer.detail.completed') : t('productionTransfer.detail.open'),
    }));
  }, [data?.data, t]);

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as ProductionTransferColumnKey[],
    [orderedVisibleColumns],
  );

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const renderSortIcon = (columnKey: ProductionTransferColumnKey): ReactElement | null => {
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
            <span>{t('productionTransfer.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('productionTransfer.breadcrumb.module')}</span>
          </>
        }
        title={t('productionTransfer.list.title', { defaultValue: 'Missing translation' })}
        description={t('productionTransfer.list.subtitle', { defaultValue: t('productionTransfer.list.searchPlaceholder') })}
      >
        {!permission.canMutate ? <PermissionNotice /> : null}

        <PagedDataGrid<ProductionTransferListItem, ProductionTransferColumnKey>
          variant="ops"
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
          columnWidths={columnWidths}
          onResizeColumnPair={resizeColumnPair}
          getCellText={getCellText}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, columnKey) => ({
            documentNo: <span className="font-medium font-mono text-xs">{row.documentNo || '-'}</span>,
            documentDate: <span className="font-mono text-xs">{formatDate(row.documentDate)}</span>,
            transferPurpose: transferPurposeLabel(row.transferPurpose, t),
            productionLink: row.productionOrderId
              ? <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{t('productionTransfer.list.orderLink', { id: row.productionOrderId })}</Badge>
              : row.productionHeaderId
                ? <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{t('productionTransfer.list.planLink', { id: row.productionHeaderId })}</Badge>
                : '-',
            sourceWarehouse: row.sourceWarehouse || '-',
            targetWarehouse: row.targetWarehouse || '-',
            status: (
              <Badge
                variant="outline"
                className={`wms-ops-status-badge mx-auto ${row.isCompleted ? 'wms-ops-status-badge--done' : 'wms-ops-status-badge--active'}`}
              >
                {row.isCompleted ? t('productionTransfer.detail.completed') : t('productionTransfer.detail.open')}
              </Badge>
            ),
          } as Record<Exclude<ProductionTransferColumnKey, 'actions'>, React.ReactNode>)[columnKey as Exclude<ProductionTransferColumnKey, 'actions'>] ?? null}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'actions') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={error instanceof Error ? error.message : t('productionTransfer.list.error', { defaultValue: 'Missing translation' })}
          emptyText={t('productionTransfer.list.noData', { defaultValue: 'Missing translation' })}
          showActionsColumn={showActionsColumn}
          actionsHeaderLabel={t('common.actions', { defaultValue: 'Missing translation' })}
          iconOnlyActions={false}
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(row) => (
            <div className="wms-ops-row-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                aria-label={t('productionTransfer.list.openDetail', { defaultValue: 'Missing translation' })}
                title={t('productionTransfer.list.openDetail', { defaultValue: 'Missing translation' })}
                onClick={() => navigate(`/production-transfer/detail/${row.id}`)}
              >
                <Eye className="size-3" aria-hidden />
              </Button>
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn"
                  aria-label={t('productionTransfer.list.editTransfer', { defaultValue: 'Missing translation' })}
                  title={t('productionTransfer.list.editTransfer', { defaultValue: 'Missing translation' })}
                  onClick={() => navigate(`/production-transfer/edit/${row.id}`)}
                  disabled={!canUpdateTransfer || Boolean(row.isCompleted)}
                >
                  <Pencil className="size-3" aria-hidden />
                </Button>
                {!canUpdateTransfer || row.isCompleted ? (
                  <FieldHelpTooltip
                    text={!canUpdateTransfer
                      ? t('productionTransfer.list.editDisabledPermission')
                      : t('productionTransfer.list.editDisabledHelp', { defaultValue: 'Missing translation' })}
                  />
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                aria-label={t('productionTransfer.list.cloneTransfer', { defaultValue: 'Missing translation' })}
                title={t('productionTransfer.list.cloneTransfer', { defaultValue: 'Missing translation' })}
                onClick={() => navigate(`/production-transfer/create?cloneId=${row.id}`)}
                disabled={!canCreateTransfer}
              >
                <Copy className="size-3" aria-hidden />
              </Button>
              {canDeleteTransfer && row.canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
                  aria-label={t('common.delete')}
                  title={t('common.delete')}
                  onClick={() => setItemToDelete(row)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="size-3" aria-hidden />
                </Button>
              ) : null}
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
              placeholder: t('productionTransfer.list.searchPlaceholder', { defaultValue: 'Missing translation' }),
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

      <DeleteConfirmDialog
        variant="ops"
        open={Boolean(itemToDelete)}
        itemLabel={itemToDelete?.documentNo || `#${itemToDelete?.id ?? ''}`}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null);
        }}
        onConfirm={() => {
          if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
        }}
      />
    </>
  );
}
