import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, RefreshCw, Settings, Trash2 } from 'lucide-react';
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
import { usePermissionGroupsQuery } from '../hooks/usePermissionGroupsQuery';
import { useCreatePermissionGroupMutation } from '../hooks/useCreatePermissionGroupMutation';
import { useUpdatePermissionGroupMutation } from '../hooks/useUpdatePermissionGroupMutation';
import { useDeletePermissionGroupMutation } from '../hooks/useDeletePermissionGroupMutation';
import { usePermissionAccess } from '../hooks/usePermissionAccess';
import { PermissionGroupForm } from './PermissionGroupForm';
import { GroupPermissionsPanel } from './GroupPermissionsPanel';
import type { PermissionGroupDto } from '../types/access-control.types';
import type { CreatePermissionGroupSchema } from '../schemas/permission-group-schema';
import {
  ACCESS_CONTROL_OPS_DEFAULT_WIDTHS,
  ACCESS_CONTROL_OPS_PAGE_CLASS,
  AccessControlOpsEyebrow,
  AccessControlOpsStatGrid,
} from './access-control-ops-ui';

type PermissionGroupColumnKey = 'name' | 'isSystemAdmin' | 'isActive' | 'permissionCount' | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'name', type: 'string', labelKey: 'permissionGroups.table.name' },
  { value: 'description', type: 'string', labelKey: 'permissionGroups.form.description.label' },
  { value: 'isSystemAdmin', type: 'boolean', labelKey: 'permissionGroups.table.isSystemAdmin' },
  { value: 'isActive', type: 'boolean', labelKey: 'permissionGroups.table.isActive' },
];

function mapSortBy(value: PermissionGroupColumnKey): string {
  switch (value) {
    case 'name':
      return 'Name';
    case 'permissionCount':
      return 'Id';
    default:
      return 'UpdatedDate';
  }
}

export function PermissionGroupsPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { setPageTitle } = useUIStore();
  const pageKey = 'access-control-permission-groups';
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PermissionGroupDto | null>(null);
  const [permissionsPanelOpen, setPermissionsPanelOpen] = useState(false);
  const [permissionsPanelGroupId, setPermissionsPanelGroupId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PermissionGroupDto | null>(null);
  const mainScrollTopRef = useRef(0);

  const pagedGrid = usePagedDataGrid<PermissionGroupColumnKey>({
    pageKey,
    defaultSortBy: 'name',
    defaultSortDirection: 'asc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<PermissionGroupColumnKey>[]>(
    () => [
      masterDataOpsGridColumn('name', t('permissionGroups.table.name')),
      masterDataOpsGridColumn('isSystemAdmin', t('permissionGroups.table.isSystemAdmin'), false),
      masterDataOpsGridColumn('isActive', t('permissionGroups.table.isActive'), false),
      masterDataOpsGridColumn('permissionCount', t('permissionGroups.table.permissionCount'), false),
      masterDataOpsGridColumn('actions', t('common.actions'), false),
    ],
    [t],
  );

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    defaultWidths: ACCESS_CONTROL_OPS_DEFAULT_WIDTHS,
  });

  const { data, isLoading, error } = usePermissionGroupsQuery(pagedGrid.queryParams);
  const createMutation = useCreatePermissionGroupMutation();
  const updateMutation = useUpdatePermissionGroupMutation();
  const deleteMutation = useDeletePermissionGroupMutation();
  const permissionAccess = usePermissionAccess();
  const canCreate = permissionAccess.can('access-control.permission-groups.create');
  const canUpdate = permissionAccess.can('access-control.permission-groups.update');
  const canDelete = permissionAccess.can('access-control.permission-groups.delete');
  const totalCount = data?.totalCount ?? data?.data?.length ?? 0;
  const activeCount = useMemo(() => (data?.data ?? []).filter((item) => item.isActive).length, [data?.data]);
  const systemAdminCount = useMemo(() => (data?.data ?? []).filter((item) => item.isSystemAdmin).length, [data?.data]);

  useEffect(() => {
    setPageTitle(t('permissionGroups.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    if (!formOpen) return;
    const main = document.querySelector('main');
    if (!main) return;
    const saved = mainScrollTopRef.current;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        main.scrollTop = saved;
      });
    });
    return () => cancelAnimationFrame(id);
  }, [formOpen]);

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
      name: item.name,
      isSystemAdmin: item.isSystemAdmin ? t('common.yes') : t('common.no'),
      isActive: item.isActive ? t('common.yes') : t('common.no'),
      permissionCount: item.permissionDefinitionIds?.length ?? item.permissionCodes?.length ?? 0,
    }));
  }, [data?.data, t]);

  const handleRefresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['permissions', 'groups'] });
  };

  const handleFormSubmit = async (formData: CreatePermissionGroupSchema): Promise<void> => {
    if (editingItem?.isSystemAdmin) return;
    if (editingItem) {
      const updateDto = {
        name: formData.name,
        description: formData.description ?? undefined,
        isSystemAdmin: editingItem.isSystemAdmin,
        isActive: formData.isActive,
      };
      await updateMutation.mutateAsync({ id: editingItem.id, dto: updateDto });
    } else {
      const createDto = { ...formData, isSystemAdmin: false, description: formData.description ?? undefined };
      await createMutation.mutateAsync(createDto);
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
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as PermissionGroupColumnKey[],
    [orderedVisibleColumns],
  );

  const renderSortIcon = (columnKey: PermissionGroupColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <OpsListPageShell
      className={ACCESS_CONTROL_OPS_PAGE_CLASS}
      eyebrow={<AccessControlOpsEyebrow page={t('sidebar.permissionGroups')} />}
      title={t('permissionGroups.title')}
      description={t('permissionGroups.description')}
      actions={canCreate ? (
        <OpsActionButton
          type="button"
          variant="primary"
          onClick={() => {
            const main = document.querySelector('main');
            if (main) mainScrollTopRef.current = main.scrollTop;
            setEditingItem(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} />
          {t('permissionGroups.add')}
        </OpsActionButton>
      ) : null}
    >
      <AccessControlOpsStatGrid
        className="mb-6 md:grid-cols-3"
        items={[
          { label: t('permissionGroups.title'), value: totalCount },
          { label: t('permissionGroups.table.isActive'), value: activeCount },
          { label: t('permissionGroups.table.isSystemAdmin'), value: systemAdminCount },
        ]}
      />

      <section className="wms-ops-receiving-area border">
        <div className="wms-ops-list wms-ops-form p-4 sm:p-5">
        <PagedDataGrid<PermissionGroupDto, PermissionGroupColumnKey>
          variant="ops"
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case 'name':
                return <span className="font-medium">{item.name}</span>;
              case 'isSystemAdmin':
                return <MasterDataOpsFlagChip tone={item.isSystemAdmin ? 'info' : 'default'}>{item.isSystemAdmin ? t('common.yes') : t('common.no')}</MasterDataOpsFlagChip>;
              case 'isActive':
                return <MasterDataOpsFlagChip tone={item.isActive ? 'success' : 'warn'}>{item.isActive ? t('common.yes') : t('common.no')}</MasterDataOpsFlagChip>;
              case 'permissionCount':
                return item.permissionDefinitionIds?.length ?? item.permissionCodes?.length ?? 0;
              case 'actions':
              default:
                return null;
            }
          }}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'isSystemAdmin' || columnKey === 'isActive' || columnKey === 'permissionCount' || columnKey === 'actions') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('common.errors.loadFailed', { defaultValue: 'Missing translation' })}
          emptyText={t('common.noData')}
          showActionsColumn={canUpdate || canDelete}
          actionsHeaderLabel={t('common.actions')}
          iconOnlyActions
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(item) => (
            canUpdate || canDelete ? (
              <div className="wms-ops-row-actions">
                {canUpdate ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (item.isSystemAdmin) return;
                        setPermissionsPanelGroupId(item.id);
                        setPermissionsPanelOpen(true);
                      }}
                      title={item.isSystemAdmin ? t('permissionGroups.systemAdminLocked') : t('permissionGroups.managePermissions')}
                      disabled={item.isSystemAdmin}
                      className="wms-ops-grid-icon-btn"
                      aria-label={t('permissionGroups.managePermissions')}
                    >
                      <Settings className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (item.isSystemAdmin) return;
                        const main = document.querySelector('main');
                        if (main) mainScrollTopRef.current = main.scrollTop;
                        setEditingItem(item);
                        setFormOpen(true);
                      }}
                      disabled={item.isSystemAdmin}
                      title={item.isSystemAdmin ? t('permissionGroups.systemAdminLocked') : undefined}
                      className="wms-ops-grid-icon-btn"
                      aria-label={t('common.edit')}
                    >
                      <Pencil className="size-3" />
                    </Button>
                  </>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
                    onClick={() => {
                      if (item.isSystemAdmin) return;
                      setItemToDelete(item);
                      setDeleteDialogOpen(true);
                    }}
                    disabled={item.isSystemAdmin}
                    title={item.isSystemAdmin ? t('permissionGroups.systemAdminLocked') : undefined}
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
            lockedKeys: ['name', 'actions'],
            visibleColumns,
            columnOrder,
            onVisibleColumnsChange: setVisibleColumns,
            onColumnOrderChange: setColumnOrder,
            exportFileName: pageKey,
            exportColumns,
            exportRows,
            filterColumns: advancedFilterColumns,
            defaultFilterColumn: 'name',
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

      <PermissionGroupForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        item={editingItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <GroupPermissionsPanel groupId={permissionsPanelGroupId} open={permissionsPanelOpen} onOpenChange={setPermissionsPanelOpen} />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title={t('permissionGroups.delete.confirmTitle')}
        description={t('permissionGroups.delete.confirmMessage', { name: itemToDelete?.name ?? '' })}
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
