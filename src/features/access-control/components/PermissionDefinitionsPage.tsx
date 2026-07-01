import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  OpsActionButton,
  OpsListPageShell,
  PagedDataGrid,
  type PagedDataGridColumn,
  DeleteConfirmDialog,
} from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { MasterDataOpsFlagChip, masterDataOpsGridColumn } from '@/features/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { usePermissionDefinitionsQuery } from '../hooks/usePermissionDefinitionsQuery';
import { useAllPermissionDefinitionCodesQuery } from '../hooks/useAllPermissionDefinitionCodesQuery';
import { useSyncPermissionDefinitionsMutation } from '../hooks/useSyncPermissionDefinitionsMutation';
import { useCreatePermissionDefinitionMutation } from '../hooks/useCreatePermissionDefinitionMutation';
import { useUpdatePermissionDefinitionMutation } from '../hooks/useUpdatePermissionDefinitionMutation';
import { useDeletePermissionDefinitionMutation } from '../hooks/useDeletePermissionDefinitionMutation';
import { usePermissionAccess } from '../hooks/usePermissionAccess';
import { PermissionDefinitionForm } from './PermissionDefinitionForm';
import type { PermissionDefinitionDto } from '../types/access-control.types';
import type { CreatePermissionDefinitionSchema } from '../schemas/permission-definition-schema';
import { isPermissionCodeAvailableOnMobile, PERMISSION_CODE_CATALOG, resolvePermissionDisplayLabel } from '../utils/permission-config';
import {
  ACCESS_CONTROL_OPS_DEFAULT_WIDTHS,
  ACCESS_CONTROL_OPS_PAGE_CLASS,
  AccessControlOpsEyebrow,
  AccessControlOpsStatGrid,
} from './access-control-ops-ui';

type PermissionDefinitionColumnKey = 'code' | 'name' | 'platforms' | 'isActive' | 'updatedDate' | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'code', type: 'string', labelKey: 'permissionDefinitions.table.code' },
  { value: 'name', type: 'string', labelKey: 'permissionDefinitions.table.name' },
  { value: 'description', type: 'string', labelKey: 'permissionDefinitions.form.description.label' },
  { value: 'availableOnWeb', type: 'boolean', labelKey: 'permissionDefinitions.form.availableOnWeb' },
  { value: 'availableOnMobile', type: 'boolean', labelKey: 'permissionDefinitions.form.availableOnMobile' },
  { value: 'isActive', type: 'boolean', labelKey: 'permissionDefinitions.table.isActive' },
];

function mapSortBy(value: PermissionDefinitionColumnKey): string {
  switch (value) {
    case 'code':
      return 'Code';
    case 'name':
      return 'Name';
    case 'updatedDate':
    default:
      return 'UpdatedDate';
  }
}

export function PermissionDefinitionsPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { setPageTitle } = useUIStore();
  const pageKey = 'access-control-permission-definitions';
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PermissionDefinitionDto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PermissionDefinitionDto | null>(null);

  const pagedGrid = usePagedDataGrid<PermissionDefinitionColumnKey>({
    pageKey,
    defaultSortBy: 'updatedDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<PermissionDefinitionColumnKey>[]>(
    () => [
      masterDataOpsGridColumn('code', t('permissionDefinitions.table.code')),
      masterDataOpsGridColumn('name', t('permissionDefinitions.table.name')),
      masterDataOpsGridColumn('platforms', t('permissionDefinitions.table.platforms', { defaultValue: 'Platforms' }), false),
      masterDataOpsGridColumn('isActive', t('permissionDefinitions.table.isActive'), false),
      masterDataOpsGridColumn('updatedDate', t('permissionDefinitions.table.updatedDate')),
      masterDataOpsGridColumn('actions', t('common.actions'), false),
    ],
    [t],
  );

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    defaultWidths: ACCESS_CONTROL_OPS_DEFAULT_WIDTHS,
  });

  const { data, isLoading, error } = usePermissionDefinitionsQuery(pagedGrid.queryParams);
  const createMutation = useCreatePermissionDefinitionMutation();
  const updateMutation = useUpdatePermissionDefinitionMutation();
  const deleteMutation = useDeletePermissionDefinitionMutation();
  const syncMutation = useSyncPermissionDefinitionsMutation();
  const permissionAccess = usePermissionAccess();
  const canCreate = permissionAccess.can('access-control.permission-definitions.create');
  const canUpdate = permissionAccess.can('access-control.permission-definitions.update');
  const canDelete = permissionAccess.can('access-control.permission-definitions.delete');
  const { data: allUsedCodes } = useAllPermissionDefinitionCodesQuery(formOpen);
  const totalCount = data?.totalCount ?? data?.data?.length ?? 0;
  const activeCount = useMemo(() => (data?.data ?? []).filter((item) => item.isActive).length, [data?.data]);

  useEffect(() => {
    setPageTitle(t('permissionDefinitions.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

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
    return (data?.data ?? []).map((item) => {
      const displayName = resolvePermissionDisplayLabel(item.code, item.name, (key, fallback) => t(key, fallback ?? key));
      return {
        code: item.code,
        name: displayName,
        platforms: [item.availableOnWeb ? 'Web' : null, item.availableOnMobile ? 'Mobile' : null].filter(Boolean).join(', '),
        isActive: item.isActive ? t('common.yes') : t('common.no'),
        updatedDate: item.updatedDate ? new Date(item.updatedDate).toLocaleDateString() : '-',
      };
    });
  }, [data?.data, t]);

  const handleRefresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['permissions', 'definitions'] });
  };

  const handleSyncFromRoutes = async (): Promise<void> => {
      const items = PERMISSION_CODE_CATALOG.map((code) => {
      const name = resolvePermissionDisplayLabel(code, null, (key, fallback) => t(key, fallback ?? key));
      return { code, name, isActive: true, availableOnWeb: true, availableOnMobile: isPermissionCodeAvailableOnMobile(code) };
    });

    await syncMutation.mutateAsync({ items });
  };

  const handleFormSubmit = async (formData: CreatePermissionDefinitionSchema): Promise<void> => {
    const dto = {
      ...formData,
      isActive: editingItem?.isActive ?? true,
      description: formData.description ?? undefined,
      availableOnWeb: formData.availableOnWeb,
      availableOnMobile: formData.availableOnMobile,
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
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as PermissionDefinitionColumnKey[],
    [orderedVisibleColumns],
  );

  const renderSortIcon = (columnKey: PermissionDefinitionColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <OpsListPageShell
      className={ACCESS_CONTROL_OPS_PAGE_CLASS}
      eyebrow={<AccessControlOpsEyebrow page={t('sidebar.permissionDefinitions')} />}
      title={t('permissionDefinitions.title')}
      description={t('permissionDefinitions.description')}
      actions={canCreate ? (
        <div className="flex flex-wrap items-center gap-2">
          <OpsActionButton type="button" variant="secondary" onClick={() => void handleSyncFromRoutes()} disabled={isLoading || syncMutation.isPending}>
            <RefreshCw size={16} className={syncMutation.isPending ? 'animate-spin' : undefined} />
            {t('permissionDefinitions.syncFromRoutes')}
          </OpsActionButton>
          <OpsActionButton
            type="button"
            variant="primary"
            onClick={() => {
              setEditingItem(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} />
            {t('permissionDefinitions.add')}
          </OpsActionButton>
        </div>
      ) : null}
    >
      <AccessControlOpsStatGrid
        className="mb-6 md:grid-cols-3"
        items={[
          { label: t('permissionDefinitions.title'), value: totalCount },
          { label: t('permissionDefinitions.table.isActive'), value: activeCount },
          { label: t('permissionDefinitions.syncFromRoutes'), value: PERMISSION_CODE_CATALOG.length },
        ]}
      />

      <section className="wms-ops-receiving-area border">
        <div className="wms-ops-list wms-ops-form p-4 sm:p-5">
        <PagedDataGrid<PermissionDefinitionDto, PermissionDefinitionColumnKey>
          variant="ops"
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case 'code':
                return <span className="wms-ops-code-badge">{item.code}</span>;
              case 'name': {
                const displayName = resolvePermissionDisplayLabel(item.code, item.name, (key, fallback) => t(key, fallback ?? key));
                const showOriginal = Boolean(item.name.trim() && item.name.trim().toLowerCase() !== displayName.trim().toLowerCase());
                return (
                  <div className="flex flex-col">
                    <span>{displayName}</span>
                    {showOriginal ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{item.name}</span>
                    ) : null}
                  </div>
                );
              }
              case 'isActive':
                return <MasterDataOpsFlagChip tone={item.isActive ? 'success' : 'warn'}>{item.isActive ? t('common.yes') : t('common.no')}</MasterDataOpsFlagChip>;
              case 'platforms':
                return (
                  <div className="flex flex-wrap gap-2">
                    {item.availableOnWeb ? <MasterDataOpsFlagChip tone="info">Web</MasterDataOpsFlagChip> : null}
                    {item.availableOnMobile ? <MasterDataOpsFlagChip tone="info">Mobile</MasterDataOpsFlagChip> : null}
                  </div>
                );
              case 'updatedDate':
                return <span className="text-sm text-slate-500">{item.updatedDate ? new Date(item.updatedDate).toLocaleDateString() : '-'}</span>;
              case 'actions':
              default:
                return null;
            }
          }}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'isActive' || columnKey === 'platforms' || columnKey === 'actions') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('common.errors.loadFailed', { defaultValue: t('common.errors.permissionDefinitionListLoadFailed', { defaultValue: 'Missing translation' }) })}
          emptyText={t('common.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions') && (canUpdate || canDelete)}
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
                    onClick={() => {
                      setEditingItem(item);
                      setFormOpen(true);
                    }}
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
                    onClick={() => {
                      setItemToDelete(item);
                      setDeleteDialogOpen(true);
                    }}
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                ) : null}
              </div>
            ) : null
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
            variant: 'ops',
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
            defaultFilterColumn: 'code',
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
              placeholder: t('common.search'),
              className: 'h-9 w-full md:w-64',
            },
            leftSlot: (
              <div className="flex items-center gap-2">
                <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="icon" variant="ghost" className="wms-ops-voice-btn" />
                <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={isLoading}>
                  <RefreshCw size={16} className={isLoading ? 'mr-2 animate-spin' : 'mr-2'} />
                  {t('common.refresh')}
                </Button>
              </div>
            ),
          }}
        />
        </div>
      </section>

      <PermissionDefinitionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        item={editingItem}
        usedCodes={allUsedCodes}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title={t('permissionDefinitions.delete.confirmTitle')}
        description={t('permissionDefinitions.delete.confirmMessage', {
          name: itemToDelete?.name ?? '',
        })}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setItemToDelete(null);
        }}
        onConfirm={() => void (async () => {
          if (!itemToDelete) return;
          await deleteMutation.mutateAsync(itemToDelete.id);
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        })()}
      />
    </OpsListPageShell>
  );
}
