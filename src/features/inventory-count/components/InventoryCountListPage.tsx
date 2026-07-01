import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { DeleteConfirmDialog, OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { inventoryCountApi } from '../api/inventory-count-api';
import type { InventoryCountHeader } from '../types/inventory-count';
import {
  getInventoryCountModeLabel,
  getInventoryCountStatusLabel,
  getInventoryCountTypeLabel,
  InventoryCountOpsBadge,
  inventoryCountStatusTone,
} from './inventory-count-ops-ui';

type InventoryCountColumnKey =
  | 'documentNo'
  | 'documentDate'
  | 'countType'
  | 'scopeMode'
  | 'countMode'
  | 'status'
  | 'lineCount'
  | 'differenceLineCount'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'common.documentNo' },
  { value: 'countType', type: 'string', labelKey: 'inventoryCount.fields.countType' },
  { value: 'scopeMode', type: 'string', labelKey: 'inventoryCount.fields.scopeMode' },
  { value: 'status', type: 'string', labelKey: 'common.status' },
  { value: 'warehouseCode', type: 'string', labelKey: 'inventoryCount.fields.warehouse' },
  { value: 'stockCode', type: 'string', labelKey: 'inventoryCount.fields.stock' },
];

function mapSortBy(value: InventoryCountColumnKey): string {
  switch (value) {
    case 'documentNo':
      return 'DocumentNo';
    case 'documentDate':
      return 'DocumentDate';
    case 'countType':
      return 'CountType';
    case 'scopeMode':
      return 'ScopeMode';
    case 'countMode':
      return 'CountMode';
    case 'status':
      return 'Status';
    case 'lineCount':
      return 'LineCount';
    case 'differenceLineCount':
      return 'DifferenceLineCount';
    default:
      return 'Id';
  }
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR');
}

function canEditInventoryCount(row: InventoryCountHeader): boolean {
  return (row.status || 'Draft') === 'Draft' && (row.lineCount ?? 0) === 0;
}

export function InventoryCountListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.inventory-count');
  const pageKey = 'inventory-count-list';
  const [itemToDelete, setItemToDelete] = useState<InventoryCountHeader | null>(null);

  const pagedGrid = usePagedDataGrid<InventoryCountColumnKey>({
    pageKey,
    defaultSortBy: 'documentDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('inventoryCount.list.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<InventoryCountColumnKey>[]>(() => [
    { key: 'documentNo', label: t('common.documentNo') },
    { key: 'documentDate', label: t('common.documentDate') },
    { key: 'countType', label: t('inventoryCount.fields.countType') },
    { key: 'scopeMode', label: t('inventoryCount.fields.scopeMode') },
    { key: 'countMode', label: t('inventoryCount.fields.countMode') },
    { key: 'status', label: t('common.status') },
    { key: 'lineCount', label: t('inventoryCount.fields.lineCount') },
    { key: 'differenceLineCount', label: t('inventoryCount.fields.differenceLineCount') },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['inventory-count-list', pagedGrid.queryParams],
    queryFn: () => inventoryCountApi.getHeadersPaged(pagedGrid.queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => inventoryCountApi.softDeleteHeader(id),
    onSuccess: async () => {
      toast.success(t('common.deleteSuccess', { defaultValue: 'Kayıt silindi.' }));
      setItemToDelete(null);
      await refetch();
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || t('common.deleteError', { defaultValue: 'Kayıt silinemedi.' }));
    },
  });

  const exportColumns = useMemo(
    () => columns.filter((column) => column.key !== 'actions').map(({ key, label }) => ({ key, label })),
    [columns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => (
    (data?.data ?? []).map((row) => ({
      documentNo: row.documentNo || '-',
      documentDate: formatDate(row.documentDate),
      countType: getInventoryCountTypeLabel(t, row.countType),
      scopeMode: row.scopeMode || '-',
      countMode: getInventoryCountModeLabel(t, row.countMode),
      status: getInventoryCountStatusLabel(t, row.status),
      lineCount: row.lineCount ?? 0,
      differenceLineCount: row.differenceLineCount ?? 0,
    }))
  ), [data?.data, t]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
  });

  return (
    <OpsListPageShell
      className="wms-ops-erp-skin wms-ops-inventory-count-page"
      eyebrow={t('sidebar.inventoryCount')}
      title={t('inventoryCount.list.title')}
      description={t('inventoryCount.list.searchPlaceholder')}
    >
      {!permission.canMutate ? <PermissionNotice message={t('common.accessDeniedMessage')} /> : null}

      <PagedDataGrid<InventoryCountHeader, InventoryCountColumnKey>
        variant="ops"
        pageKey={pageKey}
        idColumnKey="documentNo"
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'documentNo':
              return <span className="font-medium tabular-nums">{row.documentNo || '-'}</span>;
            case 'documentDate':
              return formatDate(row.documentDate);
            case 'countType':
              return getInventoryCountTypeLabel(t, row.countType);
            case 'scopeMode':
              return row.scopeMode || '-';
            case 'countMode':
              return getInventoryCountModeLabel(t, row.countMode);
            case 'status':
              return (
                <InventoryCountOpsBadge tone={inventoryCountStatusTone(row.status)}>
                  {getInventoryCountStatusLabel(t, row.status)}
                </InventoryCountOpsBadge>
              );
            case 'lineCount':
              return row.lineCount ?? 0;
            case 'differenceLineCount':
              return row.differenceLineCount ?? 0;
            default:
              return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={(columnKey) => {
          if (columnKey !== 'actions') pagedGrid.handleSort(columnKey);
        }}
        isLoading={isLoading || isFetching}
        isError={Boolean(error)}
        errorText={error instanceof Error ? error.message : t('inventoryCount.list.error')}
        emptyText={t('inventoryCount.list.noData')}
        showActionsColumn={permission.canUpdate || permission.canDelete}
        actionsHeaderLabel={t('common.actions')}
        iconOnlyActions
        actionsCellClassName="wms-ops-table-actions-col"
        renderActionsCell={(row) => (
          <div className="wms-ops-row-actions">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn"
              onClick={() => navigate('/inventory-count/edit/' + String(row.id))}
              disabled={!permission.canUpdate || !canEditInventoryCount(row)}
              aria-label={t('inventoryCount.actions.edit')}
              title={t('inventoryCount.actions.edit')}
            >
              <Pencil className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn"
              onClick={() => navigate('/inventory-count/process?headerId=' + String(row.id))}
              disabled={!permission.canUpdate}
              aria-label={t('inventoryCount.actions.process')}
              title={t('inventoryCount.actions.process')}
            >
              <ClipboardCheck className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
              onClick={() => setItemToDelete(row)}
              disabled={!permission.canDelete || deleteMutation.isPending}
              aria-label={t('common.delete')}
              title={t('common.delete')}
            >
              <Trash2 className="size-3" />
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
        search={{
          value: pagedGrid.searchInput,
          onValueChange: pagedGrid.searchConfig.onValueChange,
          onSearchChange: pagedGrid.searchConfig.onSearchChange,
          placeholder: t('inventoryCount.list.searchPlaceholder'),
        }}
        filterColumns={advancedFilterColumns}
        defaultFilterColumn="documentNo"
        draftFilterRows={pagedGrid.draftFilterRows}
        onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
        filterLogic={pagedGrid.filterLogic}
        onFilterLogicChange={pagedGrid.setFilterLogic}
        onApplyFilters={pagedGrid.applyAdvancedFilters}
        onClearFilters={pagedGrid.clearAdvancedFilters}
        appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
        leftSlot={<VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="icon" variant="ghost" className="wms-ops-voice-btn" />}
        refresh={{
          onRefresh: () => {
            void refetch();
          },
          isLoading: isFetching,
          label: t('common.refresh'),
        }}
        exportFileName="inventory-count-list"
        exportColumns={exportColumns}
        exportRows={exportRows}
        minTableWidthClassName="min-w-[56rem]"
      />

      <DeleteConfirmDialog
        open={itemToDelete != null}
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null);
        }}
        itemLabel={itemToDelete?.documentNo || (itemToDelete ? `#${itemToDelete.id}` : undefined)}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
        }}
      />
    </OpsListPageShell>
  );
}
