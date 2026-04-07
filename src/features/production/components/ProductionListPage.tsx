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
import { productionApi } from '../api/production-api';
import type { ProductionHeaderListItem } from '../types/production';

type ProductionColumnKey =
  | 'documentNo'
  | 'documentDate'
  | 'mainStockCode'
  | 'mainYapKod'
  | 'executionMode'
  | 'plannedQuantity'
  | 'completedQuantity'
  | 'status'
  | 'projectCode'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'common.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'common.documentDate' },
  { value: 'mainStockCode', type: 'string', labelKey: 'production.create.mainStockCode' },
  { value: 'mainYapKod', type: 'string', labelKey: 'production.create.mainYapKod' },
  { value: 'executionMode', type: 'string', labelKey: 'production.create.executionMode' },
  { value: 'plannedQuantity', type: 'number', labelKey: 'production.create.plannedQuantity' },
  { value: 'completedQuantity', type: 'number', labelKey: 'production.list.completedQuantity' },
  { value: 'status', type: 'string', labelKey: 'common.status' },
  { value: 'projectCode', type: 'string', labelKey: 'common.projectCode' },
];

function mapSortBy(value: ProductionColumnKey): string {
  switch (value) {
    case 'documentNo':
      return 'DocumentNo';
    case 'documentDate':
      return 'DocumentDate';
    case 'mainStockCode':
      return 'MainStockCode';
    case 'mainYapKod':
      return 'MainYapKod';
    case 'executionMode':
      return 'ExecutionMode';
    case 'plannedQuantity':
      return 'PlannedQuantity';
    case 'completedQuantity':
      return 'CompletedQuantity';
    case 'status':
      return 'Status';
    case 'projectCode':
      return 'ProjectCode';
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

function getProcessLabel(status?: string | null): string {
  switch (status) {
    case 'Completed':
      return 'Detayi Gor';
    case 'Paused':
      return 'Devam Ettir';
    case 'InProgress':
      return 'Surece Don';
    default:
      return 'Sureci Baslat';
  }
}

export function ProductionListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permissionAccess = usePermissionAccess();
  const canUpdateProduction = permissionAccess.can('wms.production.update');
  const canDeleteProduction = permissionAccess.can('wms.production.delete');
  const canCreateTransfer = permissionAccess.can('wms.production-transfer.create');
  const pageKey = 'production-list';
  const [itemToDelete, setItemToDelete] = useState<ProductionHeaderListItem | null>(null);

  const pagedGrid = usePagedDataGrid<ProductionColumnKey>({
    pageKey,
    defaultSortBy: 'documentDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('production.list.title', { defaultValue: 'Uretim Planlari' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ProductionColumnKey>[]>(() => [
    { key: 'documentNo', label: t('common.documentNo') },
    { key: 'documentDate', label: t('common.documentDate', { defaultValue: 'Belge Tarihi' }) },
    { key: 'mainStockCode', label: t('production.create.mainStockCode', { defaultValue: 'Ana Stok' }) },
    { key: 'mainYapKod', label: t('production.create.mainYapKod', { defaultValue: 'Ana YapKod' }) },
    { key: 'executionMode', label: t('production.create.executionMode', { defaultValue: 'Mod' }) },
    { key: 'plannedQuantity', label: t('production.create.plannedQuantity', { defaultValue: 'Planlanan' }) },
    { key: 'completedQuantity', label: t('production.list.completedQuantity', { defaultValue: 'Gerceklesen' }) },
    { key: 'status', label: t('common.status', { defaultValue: 'Durum' }) },
    { key: 'projectCode', label: t('common.projectCode', { defaultValue: 'Proje' }) },
    { key: 'actions', label: t('common.actions', { defaultValue: 'Islem' }), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'documentNo',
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['production-headers-paged', pagedGrid.queryParams],
    queryFn: () => productionApi.getHeadersPaged(pagedGrid.queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productionApi.softDeleteProductionPlan(id),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('production.list.deleteError'));
      }
      toast.success(t('production.list.deleteSuccess'));
      setItemToDelete(null);
      await refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('production.list.deleteError'));
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
      mainStockCode: item.mainStockCode || '-',
      mainYapKod: item.mainYapKod || '-',
      executionMode: item.executionMode || '-',
      plannedQuantity: item.plannedQuantity ?? 0,
      completedQuantity: item.completedQuantity ?? 0,
      status: item.status || '-',
      projectCode: item.projectCode || '-',
    }));
  }, [data?.data]);

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as ProductionColumnKey[],
    [orderedVisibleColumns],
  );

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const renderSortIcon = (columnKey: ProductionColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="crm-page space-y-6">
      <PagedDataGrid<ProductionHeaderListItem, ProductionColumnKey>
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
            case 'mainStockCode':
              return row.mainStockCode || '-';
            case 'mainYapKod':
              return row.mainYapKod || '-';
            case 'executionMode':
              return row.executionMode || '-';
            case 'plannedQuantity':
              return row.plannedQuantity ?? 0;
            case 'completedQuantity':
              return row.completedQuantity ?? 0;
            case 'status':
              return <Badge variant="secondary">{row.status || 'Draft'}</Badge>;
            case 'projectCode':
              return row.projectCode || '-';
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
        errorText={error instanceof Error ? error.message : t('production.list.error', { defaultValue: 'Uretim planlari yuklenemedi' })}
        emptyText={t('production.list.noData', { defaultValue: 'Uretim plani bulunamadi' })}
        showActionsColumn={orderedVisibleColumns.includes('actions')}
        actionsHeaderLabel={t('common.actions', { defaultValue: 'Islem' })}
        renderActionsCell={(row) => (
          <div className="flex min-w-[220px] flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => navigate(`/production/create?editId=${row.id}`)}
                disabled={!canUpdateProduction || row.status !== 'Draft'}
              >
                {t('production.list.editPlan', { defaultValue: 'Duzenle' })}
              </Button>
              {!canUpdateProduction || row.status !== 'Draft' ? (
                <FieldHelpTooltip
                  text={!canUpdateProduction
                    ? t('production.list.editDisabledPermission')
                    : t('production.list.editDisabledHelp', {
                      defaultValue: 'Sadece draft ve henüz islem gormemis planlar duzenlenebilir. Islem gormus planlar sahadaki hareketi bozmamak icin kilitlenir.',
                    })}
                />
              ) : null}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/production/detail/${row.id}`)}>
              {t('production.list.openDetail', { defaultValue: 'Detay' })}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/production/process/${row.id}`)}>
              {t('production.list.openProcess', { defaultValue: getProcessLabel(row.status) })}
            </Button>
            {row.documentNo && canCreateTransfer ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/production-transfer/create?productionDocumentNo=${encodeURIComponent(row.documentNo)}`)}
              >
                {t('production.list.openTransfer', { defaultValue: 'Transfer Ac' })}
              </Button>
            ) : null}
              {canDeleteProduction && row.canDelete ? (
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
          exportFileName: 'production-list',
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
            placeholder: t('production.list.searchPlaceholder', { defaultValue: 'Belge no, ana stok veya proje ara' }),
          },
          leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
        }}
      />

      <Dialog open={Boolean(itemToDelete)} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('production.list.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('production.list.deleteDescription', {
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
