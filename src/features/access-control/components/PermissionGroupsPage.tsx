import { type ReactElement, useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { Plus, Search, RefreshCw, X, Settings } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { usePermissionGroupsQuery } from '../hooks/usePermissionGroupsQuery';
import { useCreatePermissionGroupMutation } from '../hooks/useCreatePermissionGroupMutation';
import { useUpdatePermissionGroupMutation } from '../hooks/useUpdatePermissionGroupMutation';
import { useDeletePermissionGroupMutation } from '../hooks/useDeletePermissionGroupMutation';
import { usePermissionAccess } from '../hooks/usePermissionAccess';
import { PermissionGroupForm } from './PermissionGroupForm';
import { GroupPermissionsPanel } from './GroupPermissionsPanel';
import type { PermissionGroupDto } from '../types/access-control.types';
import type { CreatePermissionGroupSchema } from '../schemas/permission-group-schema';
import { ColumnPreferencesPopover, GridExportMenu, type ColumnDef } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import type { GridExportColumn } from '@/lib/grid-export';

const EMPTY_ITEMS: PermissionGroupDto[] = [];

export function PermissionGroupsPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { setPageTitle } = useUIStore();
  const pageKey = 'access-control-permission-groups';
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PermissionGroupDto | null>(null);
  const [permissionsPanelOpen, setPermissionsPanelOpen] = useState(false);
  const [permissionsPanelGroupId, setPermissionsPanelGroupId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 20;
  const columns = useMemo<ColumnDef[]>(
    () => [
      { key: 'name', label: t('permissionGroups.table.name') },
      { key: 'isSystemAdmin', label: t('permissionGroups.table.isSystemAdmin') },
      { key: 'isActive', label: t('permissionGroups.table.isActive') },
      { key: 'permissionCount', label: t('permissionGroups.table.permissionCount') },
      { key: 'actions', label: t('common.actions') },
    ],
    [t]
  );
  const {
    userId,
    columnOrder,
    visibleColumns,
    orderedVisibleColumns,
    setColumnOrder,
    setVisibleColumns,
  } = useColumnPreferences({ pageKey, columns });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PermissionGroupDto | null>(null);
  const mainScrollTopRef = useRef(0);

  const { data, isLoading } = usePermissionGroupsQuery({
    pageNumber,
    pageSize,
    sortBy: 'updatedDate',
    sortDirection: 'desc',
  });

  const createMutation = useCreatePermissionGroupMutation();
  const updateMutation = useUpdatePermissionGroupMutation();
  const deleteMutation = useDeletePermissionGroupMutation();
  const permissionAccess = usePermissionAccess();
  const canCreate = permissionAccess.can('access-control.permission-groups.create');
  const canUpdate = permissionAccess.can('access-control.permission-groups.update');

  const items = data?.data ?? EMPTY_ITEMS;
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        (item.description && item.description.toLowerCase().includes(lower))
    );
  }, [items, searchTerm]);

  const exportColumns = useMemo<GridExportColumn[]>(
    () =>
      orderedVisibleColumns
        .filter((key) => key !== 'actions')
        .map((key) => ({
          key,
          label: columns.find((column) => column.key === key)?.label ?? key,
        })),
    [columns, orderedVisibleColumns]
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    return filteredItems.map((item) => ({
      name: item.name,
      isSystemAdmin: item.isSystemAdmin ? t('common.yes') : t('common.no'),
      isActive: item.isActive ? t('common.yes') : t('common.no'),
      permissionCount: item.permissionDefinitionIds?.length ?? item.permissionCodes?.length ?? 0,
    }));
  }, [filteredItems, t]);

  useEffect(() => {
    setPageTitle(t('permissionGroups.title'));
    return () => setPageTitle(null);
  }, [t, setPageTitle]);

  const handleRefresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['permissions', 'groups'] });
  };

  const handleAddClick = (): void => {
    const main = document.querySelector('main');
    if (main) mainScrollTopRef.current = main.scrollTop;
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleEditClick = (item: PermissionGroupDto): void => {
    if (item.isSystemAdmin) return;
    const main = document.querySelector('main');
    if (main) mainScrollTopRef.current = main.scrollTop;
    setEditingItem(item);
    setFormOpen(true);
  };

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

  const handlePermissionsClick = (item: PermissionGroupDto): void => {
    if (item.isSystemAdmin) return;
    setPermissionsPanelGroupId(item.id);
    setPermissionsPanelOpen(true);
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

  const handleDeleteClick = (item: PermissionGroupDto): void => {
    if (item.isSystemAdmin) return;
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (itemToDelete) {
      await deleteMutation.mutateAsync(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb items={[{ label: t('sidebar.accessControl') }, { label: t('sidebar.permissionGroups'), isActive: true }]} />
      <div className="crm-toolbar flex flex-col gap-5 pt-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
            {t('permissionGroups.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors">
            {t('permissionGroups.description')}
          </p>
        </div>
        {canCreate ? (
          <Button onClick={handleAddClick}>
            <Plus size={18} className="mr-2" />
            {t('permissionGroups.add')}
          </Button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/3 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"
            >
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <GridExportMenu
            fileName={pageKey}
            columns={exportColumns}
            rows={exportRows}
          />
          <ColumnPreferencesPopover
            pageKey={pageKey}
            userId={userId}
            columns={columns}
            visibleColumns={visibleColumns}
            columnOrder={columnOrder}
            onVisibleColumnsChange={setVisibleColumns}
            onColumnOrderChange={setColumnOrder}
          />
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 p-1 shadow-sm dark:border-white/10 dark:bg-white/3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 min-h-[300px]">
            <div className="animate-pulse text-slate-500">{t('common.loading')}</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center py-20 min-h-[300px]">
            <p className="text-slate-500 dark:text-slate-400">{t('common.noData')}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {orderedVisibleColumns.map((key) => {
                    if (key === 'actions') return <TableHead key={key} className="text-right">{t('common.actions')}</TableHead>;
                    if (key === 'name') return <TableHead key={key}>{t('permissionGroups.table.name')}</TableHead>;
                    if (key === 'isSystemAdmin') return <TableHead key={key}>{t('permissionGroups.table.isSystemAdmin')}</TableHead>;
                    if (key === 'isActive') return <TableHead key={key}>{t('permissionGroups.table.isActive')}</TableHead>;
                    if (key === 'permissionCount') return <TableHead key={key}>{t('permissionGroups.table.permissionCount')}</TableHead>;
                    return null;
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    {orderedVisibleColumns.map((key) => {
                      if (key === 'name') return <TableCell key={key} className="font-medium">{item.name}</TableCell>;
                      if (key === 'isSystemAdmin') {
                        return (
                          <TableCell key={key}>
                            <Badge variant={item.isSystemAdmin ? 'default' : 'secondary'}>
                              {item.isSystemAdmin ? t('common.yes') : t('common.no')}
                            </Badge>
                          </TableCell>
                        );
                      }
                      if (key === 'isActive') {
                        return (
                          <TableCell key={key}>
                            <Badge variant={item.isActive ? 'default' : 'secondary'}>
                              {item.isActive ? t('common.yes') : t('common.no')}
                            </Badge>
                          </TableCell>
                        );
                      }
                      if (key === 'permissionCount') {
                        return <TableCell key={key}>{(item.permissionDefinitionIds?.length ?? item.permissionCodes?.length ?? 0)}</TableCell>;
                      }
                      if (key === 'actions') {
                        return (
                          <TableCell key={key} className="text-right">
                            {canUpdate ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePermissionsClick(item)}
                                  title={item.isSystemAdmin ? t('permissionGroups.systemAdminLocked') : t('permissionGroups.managePermissions')}
                                  disabled={item.isSystemAdmin}
                                >
                                  <Settings size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditClick(item)}
                                  disabled={item.isSystemAdmin}
                                  title={item.isSystemAdmin ? t('permissionGroups.systemAdminLocked') : undefined}
                                >
                                  {t('common.edit')}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => handleDeleteClick(item)}
                                  disabled={item.isSystemAdmin}
                                  title={item.isSystemAdmin ? t('permissionGroups.systemAdminLocked') : undefined}
                                >
                                  {t('common.delete')}
                                </Button>
                              </>
                            ) : null}
                          </TableCell>
                        );
                      }
                      return null;
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-slate-200/80 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                <span className="text-sm text-slate-500">
                  {t('permissionGroups.table.showing', {
                    from: (pageNumber - 1) * pageSize + 1,
                    to: Math.min(pageNumber * pageSize, totalCount),
                    total: totalCount,
                  })}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1}>
                    {t('common.previous')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))} disabled={pageNumber >= totalPages}>
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <PermissionGroupForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        item={editingItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <GroupPermissionsPanel groupId={permissionsPanelGroupId} open={permissionsPanelOpen} onOpenChange={setPermissionsPanelOpen} />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('permissionGroups.delete.confirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('permissionGroups.delete.confirmMessage', {
                name: itemToDelete?.name ?? '',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? t('common.processing') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
