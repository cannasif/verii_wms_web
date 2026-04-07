import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { useDeleteParameter } from '../hooks/useDeleteParameter';
import { useParametersPaged } from '../hooks/useParameters';
import { PARAMETER_TYPES, type Parameter, type ParameterType } from '../types/parameter';

type ParameterColumnKey =
  | 'id'
  | 'allowLessQuantityBasedOnOrder'
  | 'allowMoreQuantityBasedOnOrder'
  | 'requireApprovalBeforeErp'
  | 'requireAllOrderItemsCollected'
  | 'createdDate'
  | 'updatedDate'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'allowLessQuantityBasedOnOrder', type: 'boolean', labelKey: 'parameters.list.allowLessQuantity' },
  { value: 'allowMoreQuantityBasedOnOrder', type: 'boolean', labelKey: 'parameters.list.allowMoreQuantity' },
  { value: 'requireApprovalBeforeErp', type: 'boolean', labelKey: 'parameters.list.requireApproval' },
  { value: 'requireAllOrderItemsCollected', type: 'boolean', labelKey: 'parameters.list.requireAllOrderItemsCollected' },
];

function mapSortBy(value: ParameterColumnKey): string {
  switch (value) {
    case 'createdDate':
      return 'CreatedDate';
    case 'updatedDate':
      return 'UpdatedDate';
    case 'id':
    default:
      return 'Id';
  }
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

export function ParameterListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { type } = useParams<{ type: ParameterType }>();
  const parameterType = type as ParameterType;
  const parameterConfig = PARAMETER_TYPES[parameterType];
  const pageKey = `parameters-${type ?? 'unknown'}-list`;
  const { setPageTitle } = useUIStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<Parameter | null>(null);

  const pagedGrid = usePagedDataGrid<ParameterColumnKey>({
    pageKey,
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<ParameterColumnKey>[]>(() => [
    { key: 'id', label: t('parameters.list.id') },
    { key: 'allowLessQuantityBasedOnOrder', label: t('parameters.list.allowLessQuantity'), sortable: false },
    { key: 'allowMoreQuantityBasedOnOrder', label: t('parameters.list.allowMoreQuantity'), sortable: false },
    { key: 'requireApprovalBeforeErp', label: t('parameters.list.requireApproval'), sortable: false },
    { key: 'requireAllOrderItemsCollected', label: t('parameters.list.requireAllOrderItemsCollected'), sortable: false },
    { key: 'createdDate', label: t('parameters.list.createdDate') },
    { key: 'updatedDate', label: t('parameters.list.updatedDate') },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
  });

  const { data, isLoading, error } = useParametersPaged(parameterType, pagedGrid.queryParams);
  const deleteMutation = useDeleteParameter(parameterType);

  useEffect(() => {
    if (parameterConfig) {
      setPageTitle(t(`parameters.${parameterType}.title`, parameterConfig.name));
    }
    return () => setPageTitle(null);
  }, [parameterConfig, parameterType, setPageTitle, t]);

  const exportColumns = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({
      key,
      label: columns.find((column) => column.key === key)?.label ?? key,
    })),
    [columns, orderedVisibleColumns],
  );
  const exportRows = useMemo<Record<string, unknown>[]>(() => (
    (data?.data ?? []).map((item) => ({
      id: item.id,
      allowLessQuantityBasedOnOrder: item.allowLessQuantityBasedOnOrder ? t('common.yes') : t('common.no'),
      allowMoreQuantityBasedOnOrder: item.allowMoreQuantityBasedOnOrder ? t('common.yes') : t('common.no'),
      requireApprovalBeforeErp: item.requireApprovalBeforeErp ? t('common.yes') : t('common.no'),
      requireAllOrderItemsCollected: item.requireAllOrderItemsCollected ? t('common.yes') : t('common.no'),
      createdDate: formatDateTime(item.createdDate),
      updatedDate: formatDateTime(item.updatedDate),
    }))
  ), [data?.data, t]);

  const handleDelete = async (): Promise<void> => {
    if (!selectedParameter) return;
    try {
      await deleteMutation.mutateAsync(selectedParameter.id);
      toast.success(t('parameters.delete.success'));
      setDeleteDialogOpen(false);
      setSelectedParameter(null);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : t('parameters.delete.error'));
    }
  };

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });
  const visibleColumnKeys = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions') as ParameterColumnKey[], [orderedVisibleColumns]);
  const renderSortIcon = (columnKey: ParameterColumnKey): ReactElement | null => columnKey !== pagedGrid.sortBy ? null : pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;

  return (
    <div className="space-y-6 crm-page">
      <div className="crm-toolbar flex flex-col gap-5 pt-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 transition-colors dark:text-white">
            {t(`parameters.${parameterType}.title`, parameterConfig?.name)}
          </h1>
        </div>
        <Button onClick={() => navigate(`/parameters/${parameterType}/create`)}>
          <Plus size={18} className="mr-2" />
          {t('parameters.list.addNew')}
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/3">
        <PagedDataGrid<Parameter, ParameterColumnKey>
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case 'id': return item.id;
              case 'allowLessQuantityBasedOnOrder': return <Badge variant={item.allowLessQuantityBasedOnOrder ? 'default' : 'secondary'}>{item.allowLessQuantityBasedOnOrder ? t('common.yes') : t('common.no')}</Badge>;
              case 'allowMoreQuantityBasedOnOrder': return <Badge variant={item.allowMoreQuantityBasedOnOrder ? 'default' : 'secondary'}>{item.allowMoreQuantityBasedOnOrder ? t('common.yes') : t('common.no')}</Badge>;
              case 'requireApprovalBeforeErp': return <Badge variant={item.requireApprovalBeforeErp ? 'default' : 'secondary'}>{item.requireApprovalBeforeErp ? t('common.yes') : t('common.no')}</Badge>;
              case 'requireAllOrderItemsCollected': return <Badge variant={item.requireAllOrderItemsCollected ? 'default' : 'secondary'}>{item.requireAllOrderItemsCollected ? t('common.yes') : t('common.no')}</Badge>;
              case 'createdDate': return formatDateTime(item.createdDate);
              case 'updatedDate': return formatDateTime(item.updatedDate);
              default: return null;
            }
          }}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (
              columnKey === 'allowLessQuantityBasedOnOrder' ||
              columnKey === 'allowMoreQuantityBasedOnOrder' ||
              columnKey === 'requireApprovalBeforeErp' ||
              columnKey === 'requireAllOrderItemsCollected' ||
              columnKey === 'actions'
            ) {
              return;
            }
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={error instanceof Error ? error.message : t('parameters.list.error')}
          emptyText={t('common.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions')}
          actionsHeaderLabel={t('common.actions')}
          renderActionsCell={(item) => (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/parameters/${parameterType}/edit/${item.id}`)}>
                {t('common.edit')}
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => {
                setSelectedParameter(item);
                setDeleteDialogOpen(true);
              }}>
                {t('common.delete')}
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
            defaultFilterColumn: 'allowLessQuantityBasedOnOrder',
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
              placeholder: t('parameters.list.searchPlaceholder'),
            },
            leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
          }}
        />
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('parameters.delete.title')}</DialogTitle>
            <DialogDescription>{t('parameters.delete.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
