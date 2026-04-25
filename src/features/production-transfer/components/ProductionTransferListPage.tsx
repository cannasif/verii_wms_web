import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { FieldHelpTooltip } from '@/features/access-control/components/FieldHelpTooltip';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
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
  const permissionAccess = usePermissionAccess();
  const canUpdateTransfer = permissionAccess.can('wms.production-transfer.update');
  const canCreateTransfer = permissionAccess.can('wms.production-transfer.create');
  const canDeleteTransfer = permissionAccess.can('wms.production-transfer.delete');
  const pageKey = 'production-transfer-list';
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
    { key: 'documentNo', label: t('common.documentNo') },
    { key: 'documentDate', label: t('common.documentDate', { defaultValue: 'Missing translation' }) },
    { key: 'transferPurpose', label: t('productionTransfer.create.purpose', { defaultValue: 'Missing translation' }) },
    { key: 'productionLink', label: t('productionTransfer.list.productionLink', { defaultValue: 'Missing translation' }) },
    { key: 'sourceWarehouse', label: t('production.create.sourceWarehouse', { defaultValue: 'Missing translation' }) },
    { key: 'targetWarehouse', label: t('production.create.targetWarehouse', { defaultValue: 'Missing translation' }) },
    { key: 'status', label: t('common.status', { defaultValue: 'Missing translation' }) },
    { key: 'actions', label: t('common.actions', { defaultValue: 'Missing translation' }), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'documentNo',
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
    <div className="crm-page space-y-6">
      <PagedDataGrid<ProductionTransferListItem, ProductionTransferColumnKey>
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'documentNo':
              return <span className="font-medium">{row.documentNo || '-'}</span>;
            case 'documentDate':
              return formatDate(row.documentDate);
            case 'transferPurpose':
              return transferPurposeLabel(row.transferPurpose, t);
            case 'productionLink':
              return row.productionOrderId
                ? <Badge variant="outline">{t('productionTransfer.list.orderLink', { id: row.productionOrderId })}</Badge>
                : row.productionHeaderId
                  ? <Badge variant="outline">{t('productionTransfer.list.planLink', { id: row.productionHeaderId })}</Badge>
                  : '-';
            case 'sourceWarehouse':
              return row.sourceWarehouse || '-';
            case 'targetWarehouse':
              return row.targetWarehouse || '-';
            case 'status':
              return <Badge variant="secondary">{row.isCompleted ? t('productionTransfer.detail.completed') : t('productionTransfer.detail.open')}</Badge>;
            case 'actions':
            default:
              return null;
          }
        }}
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
        showActionsColumn={orderedVisibleColumns.includes('actions')}
        actionsHeaderLabel={t('common.actions', { defaultValue: 'Missing translation' })}
        renderActionsCell={(row) => (
          <div className="flex min-w-[220px] flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/production-transfer/detail/${row.id}`)}>
              {t('productionTransfer.list.openDetail', { defaultValue: 'Missing translation' })}
            </Button>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => navigate(`/production-transfer/create?editId=${row.id}`)}
                disabled={!canUpdateTransfer || Boolean(row.isCompleted)}
              >
                {t('productionTransfer.list.editTransfer', { defaultValue: 'Missing translation' })}
              </Button>
              {!canUpdateTransfer || row.isCompleted ? (
                <FieldHelpTooltip
                  text={!canUpdateTransfer
                    ? t('productionTransfer.list.editDisabledPermission')
                    : t('productionTransfer.list.editDisabledHelp', {
                      defaultValue: 'Missing translation',
                    })}
                />
              ) : null}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/production-transfer/create?cloneId=${row.id}`)} disabled={!canCreateTransfer}>
              {t('productionTransfer.list.cloneTransfer', { defaultValue: 'Missing translation' })}
            </Button>
              {canDeleteTransfer && row.canDelete ? (
                <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setItemToDelete(row)}
              >
                {t('common.delete')}
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
          exportFileName: 'production-transfer-list',
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
            value: pagedGrid.searchInput,
            onValueChange: pagedGrid.searchConfig.onValueChange,
            onSearchChange: pagedGrid.searchConfig.onSearchChange,
            placeholder: t('productionTransfer.list.searchPlaceholder', { defaultValue: 'Missing translation' }),
          },
          leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
        }}
      />

      <Dialog open={Boolean(itemToDelete)} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('productionTransfer.list.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('productionTransfer.list.deleteDescription', {
                documentNo: itemToDelete?.documentNo ?? '',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemToDelete(null)} disabled={deleteMutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!itemToDelete) return;
                deleteMutation.mutate(itemToDelete.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('common.processing') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
