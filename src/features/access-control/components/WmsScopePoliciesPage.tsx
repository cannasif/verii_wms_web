import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  OpsActionButton,
  OpsListPageShell,
  PagedDataGrid,
  type PagedDataGridColumn,
  DeleteConfirmDialog,
} from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { MasterDataOpsFlagChip, masterDataOpsGridColumn } from '@/features/shared';
import { usePermissionAccess } from '../hooks/usePermissionAccess';
import { useWmsScopePoliciesQuery } from '../hooks/useWmsScopePoliciesQuery';
import { useCreateWmsScopePolicyMutation } from '../hooks/useCreateWmsScopePolicyMutation';
import { useUpdateWmsScopePolicyMutation } from '../hooks/useUpdateWmsScopePolicyMutation';
import { useDeleteWmsScopePolicyMutation } from '../hooks/useDeleteWmsScopePolicyMutation';
import { WmsScopePolicyForm } from './WmsScopePolicyForm';
import type { WmsScopePolicyDto } from '../types/access-control.types';
import type { CreateWmsScopePolicySchema } from '../schemas/wms-scope-policy-schema';
import {
  ACCESS_CONTROL_OPS_DEFAULT_WIDTHS,
  ACCESS_CONTROL_OPS_PAGE_CLASS,
  AccessControlOpsEyebrow,
  AccessControlOpsStatGrid,
} from './access-control-ops-ui';

type PolicyColumnKey = 'code' | 'name' | 'entityType' | 'scopeType' | 'includeSelf' | 'isActive' | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'code', type: 'string', labelKey: 'wmsScopePolicies.table.code' },
  { value: 'name', type: 'string', labelKey: 'wmsScopePolicies.table.name' },
  { value: 'entityType', type: 'string', labelKey: 'wmsScopePolicies.table.entityType' },
  { value: 'scopeType', type: 'string', labelKey: 'wmsScopePolicies.table.scopeType' },
  { value: 'isActive', type: 'boolean', labelKey: 'wmsScopePolicies.table.isActive' },
];

const scopeTypeLabels: Record<string, string> = {
  unrestricted: 'Tam Erişim',
  branch: 'Şube Bazlı',
  warehouse: 'Depo Bazlı',
  'assigned-only': 'Sadece Atanan',
};

function mapSortBy(value: PolicyColumnKey): string {
  switch (value) {
    case 'code':
      return 'Code';
    case 'name':
      return 'Name';
    case 'entityType':
      return 'EntityType';
    case 'scopeType':
      return 'ScopeType';
    default:
      return 'UpdatedDate';
  }
}

export function WmsScopePoliciesPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const pageKey = 'access-control-wms-scope-policies';
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WmsScopePolicyDto | null>(null);
  const [deleteItem, setDeleteItem] = useState<WmsScopePolicyDto | null>(null);

  const pagedGrid = usePagedDataGrid<PolicyColumnKey>({
    pageKey,
    defaultSortBy: 'name',
    defaultSortDirection: 'asc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<PolicyColumnKey>[]>(() => [
    masterDataOpsGridColumn('code', t('wmsScopePolicies.table.code')),
    masterDataOpsGridColumn('name', t('wmsScopePolicies.table.name')),
    masterDataOpsGridColumn('entityType', t('wmsScopePolicies.table.entityType')),
    masterDataOpsGridColumn('scopeType', t('wmsScopePolicies.table.scopeType')),
    masterDataOpsGridColumn('includeSelf', t('wmsScopePolicies.table.includeSelf'), false),
    masterDataOpsGridColumn('isActive', t('wmsScopePolicies.table.isActive'), false),
    masterDataOpsGridColumn('actions', t('common.actions'), false),
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    defaultWidths: ACCESS_CONTROL_OPS_DEFAULT_WIDTHS,
  });

  const { data, isLoading, error } = useWmsScopePoliciesQuery(pagedGrid.queryParams);
  const createMutation = useCreateWmsScopePolicyMutation();
  const updateMutation = useUpdateWmsScopePolicyMutation();
  const deleteMutation = useDeleteWmsScopePolicyMutation();
  const permissionAccess = usePermissionAccess();
  const canCreate = permissionAccess.can('access-control.wms-scope-policies.create');
  const canUpdate = permissionAccess.can('access-control.wms-scope-policies.update');
  const canDelete = permissionAccess.can('access-control.wms-scope-policies.delete');

  useEffect(() => {
    setPageTitle(t('wmsScopePolicies.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const totalCount = data?.totalCount ?? data?.data?.length ?? 0;
  const activeCount = useMemo(() => (data?.data ?? []).filter((item) => item.isActive).length, [data?.data]);
  const entityTypeCount = useMemo(() => new Set((data?.data ?? []).map((item) => item.entityType)).size, [data?.data]);

  const exportColumns = useMemo(
    () => orderedVisibleColumns
      .filter((key) => key !== 'actions')
      .map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => (
    (data?.data ?? []).map((item) => ({
      code: item.code,
      name: item.name,
      entityType: item.entityType,
      scopeType: scopeTypeLabels[item.scopeType] ?? item.scopeType,
      includeSelf: item.includeSelf ? t('common.yes') : t('common.no'),
      isActive: item.isActive ? t('common.yes') : t('common.no'),
    }))
  ), [data?.data, t]);

  const handleRefresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['access-control', 'wms-scope-policies'] });
  };

  const handleSubmit = async (formData: CreateWmsScopePolicySchema): Promise<void> => {
    const dto = {
      ...formData,
      description: formData.description ?? undefined,
    };
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    setFormOpen(false);
    setEditingItem(null);
  };

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as PolicyColumnKey[],
    [orderedVisibleColumns],
  );

  const renderSortIcon = (columnKey: PolicyColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const usedCodes = useMemo(() => (data?.data ?? []).map((item) => item.code), [data?.data]);

  return (
    <OpsListPageShell
      className={ACCESS_CONTROL_OPS_PAGE_CLASS}
      eyebrow={<AccessControlOpsEyebrow page={t('sidebar.wmsScopePolicies')} />}
      title={t('wmsScopePolicies.title')}
      description={t('wmsScopePolicies.description')}
      actions={canCreate ? (
        <OpsActionButton type="button" variant="primary" onClick={() => { setEditingItem(null); setFormOpen(true); }}>
          <Plus size={16} />
          {t('wmsScopePolicies.add')}
        </OpsActionButton>
      ) : null}
    >
      <AccessControlOpsStatGrid
        className="mb-6 md:grid-cols-3"
        items={[
          { label: t('wmsScopePolicies.stats.total'), value: totalCount },
          { label: t('wmsScopePolicies.stats.active'), value: activeCount },
          { label: t('wmsScopePolicies.stats.entities'), value: entityTypeCount },
        ]}
      />

      <section className="wms-ops-receiving-area border">
        <div className="wms-ops-list wms-ops-form p-4 sm:p-5">
      <PagedDataGrid<WmsScopePolicyDto, PolicyColumnKey>
        variant="ops"
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(item, columnKey) => {
          switch (columnKey) {
            case 'code':
              return <span className="font-mono text-xs">{item.code}</span>;
            case 'name':
              return <span className="font-semibold">{item.name}</span>;
            case 'entityType':
              return <Badge variant="secondary">{item.entityType}</Badge>;
            case 'scopeType':
              return <Badge variant="outline">{scopeTypeLabels[item.scopeType] ?? item.scopeType}</Badge>;
            case 'includeSelf':
              return item.includeSelf ? t('common.yes') : t('common.no');
            case 'isActive':
              return <MasterDataOpsFlagChip tone={item.isActive ? 'success' : 'warn'}>{item.isActive ? t('common.yes') : t('common.no')}</MasterDataOpsFlagChip>;
            default:
              return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={pagedGrid.handleSort}
        renderSortIcon={renderSortIcon}
        isLoading={isLoading}
        isError={!!error}
        errorText={error instanceof Error ? error.message : undefined}
        emptyText={t('common.noData')}
        showActionsColumn={canUpdate || canDelete}
        actionsHeaderLabel={t('common.actions')}
        iconOnlyActions
        actionsCellClassName="wms-ops-table-actions-col"
        renderActionsCell={(item) => (
          canUpdate || canDelete ? (
            <div className="wms-ops-row-actions">
              {canUpdate ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn"
                  onClick={() => { setEditingItem(item); setFormOpen(true); }}
                  aria-label={t('common.edit')}
                >
                  <Pencil className="size-3" />
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
                  onClick={() => setDeleteItem(item)}
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="size-3" />
                </Button>
              ) : null}
            </div>
          ) : null
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
          variant: 'ops',
          pageKey,
          userId,
          columns: columns.map(({ key, label }) => ({ key, label })),
          lockedKeys: ['code', 'actions'],
          visibleColumns,
          columnOrder,
          onVisibleColumnsChange: setVisibleColumns,
          onColumnOrderChange: setColumnOrder,
          exportFileName: pageKey,
          exportColumns,
          exportRows,
          filterColumns: advancedFilterColumns,
          defaultFilterColumn: 'code',
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
            placeholder: t('common.search'),
          },
          refresh: {
            onRefresh: handleRefresh,
            isLoading,
            label: t('common.refresh', { defaultValue: 'Yenile' }),
          },
          leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="icon" variant="ghost" className="wms-ops-voice-btn" />,
        }}
      />
        </div>
      </section>

      <WmsScopePolicyForm
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditingItem(null);
        }}
        item={editingItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
        usedCodes={usedCodes}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteItem)}
        title={t('wmsScopePolicies.delete.confirmTitle')}
        description={t('wmsScopePolicies.delete.confirmMessage', { name: deleteItem?.name ?? deleteItem?.code ?? '' })}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null);
        }}
        onConfirm={() => void (async () => {
          if (!deleteItem) return;
          await deleteMutation.mutateAsync(deleteItem.id);
          setDeleteItem(null);
        })()}
      />
    </OpsListPageShell>
  );
}
