import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Edit3, Loader2, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsListPageShell, OpsServiceEyebrow, OpsTextarea, OpsToggleField, PagedDataGrid, type PagedDataGridColumn, PagedLookupDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  HAK_EDIS_SETTINGS_COLUMN_WIDTHS,
  HakEdisFlagChip,
  HakEdisOpsDialogContent,
} from './bilginoglu-hakedis-ops-ui';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { WarehouseLookup } from '@/features/shared/api/lookup-types';
import { ShelfLookupCombobox } from '@/features/shelf-management';
import { shelfManagementApi } from '@/features/shelf-management/api/shelf-management.api';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { useUIStore } from '@/stores/ui-store';
import type { BilginogluHakEdisCompletedLocationSetting } from '../types/bilginoglu-hakedis.types';
import {
  useBilginogluHakEdisCompletedLocationSettingDeleteMutation,
  useBilginogluHakEdisCompletedLocationSettingMutation,
  useBilginogluHakEdisCompletedLocationSettingsQuery,
} from '../hooks/useBilginogluHakEdisQueries';

interface FormState {
  id?: number;
  warehouseId?: number;
  warehouseCode?: number;
  warehouseLabel: string;
  shelfCode: string;
  shelfId?: number;
  isDefault: boolean;
  isActive: boolean;
  description: string;
}

type LocationColumnKey = 'branch' | 'warehouse' | 'shelf' | 'status' | 'description';

const emptyForm: FormState = {
  warehouseLabel: '',
  shelfCode: '',
  isDefault: true,
  isActive: true,
  description: '',
};

export function BilginogluHakEdisLocationSettingsPage(): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.service-allocation');
  const pageKey = 'bilginoglu-hakedis-location-settings';
  const [warehouseLookupOpen, setWarehouseLookupOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const pagedGrid = usePagedDataGrid<LocationColumnKey>({
    pageKey,
    defaultSortBy: 'warehouse',
    defaultSortDirection: 'asc',
    defaultPageSize: 10,
    defaultPageNumber: 1,
    pageNumberBase: 1,
  });
  const settingsQuery = useBilginogluHakEdisCompletedLocationSettingsQuery();
  const saveMutation = useBilginogluHakEdisCompletedLocationSettingMutation();
  const deleteMutation = useBilginogluHakEdisCompletedLocationSettingDeleteMutation();
  const shelvesQuery = useQuery({
    queryKey: ['bilginoglu-hakedis', 'completed-location', 'shelves', form.warehouseId],
    queryFn: ({ signal }) => shelfManagementApi.getLookup(form.warehouseId!, false, { signal }),
    enabled: Boolean(form.warehouseId),
  });

  useEffect(() => {
    setPageTitle(t('locationSettings.title'));
  }, [setPageTitle, t]);

  const settings = settingsQuery.data ?? [];
  const shelfOptions = useMemo(() => shelvesQuery.data?.data ?? [], [shelvesQuery.data?.data]);
  const columns = useMemo<PagedDataGridColumn<LocationColumnKey>[]>(() => [
    { key: 'branch', label: t('locationSettings.table.branch') },
    { key: 'warehouse', label: t('locationSettings.table.warehouse') },
    { key: 'shelf', label: t('locationSettings.table.shelf') },
    { key: 'status', label: t('locationSettings.table.status'), sortable: false },
    { key: 'description', label: t('locationSettings.table.description') },
  ], [t]);
  const filteredSettings = useMemo(() => {
    const search = pagedGrid.searchTerm.trim().toLocaleLowerCase('tr-TR');
    if (!search) return settings;

    return settings.filter((item) => [
      item.branchCode,
      item.warehouseCode,
      item.warehouseName,
      item.shelfCode,
      item.shelfName,
      item.description,
    ].some((value) => String(value ?? '').toLocaleLowerCase('tr-TR').includes(search)));
  }, [pagedGrid.searchTerm, settings]);
  const sortedSettings = useMemo(() => {
    const rows = [...filteredSettings];
    const direction = pagedGrid.sortDirection === 'asc' ? 1 : -1;
    const read = (item: BilginogluHakEdisCompletedLocationSetting): string => {
      switch (pagedGrid.sortBy) {
        case 'branch':
          return item.branchCode ?? '';
        case 'shelf':
          return `${item.shelfCode ?? ''} ${item.shelfName ?? ''}`;
        case 'description':
          return item.description ?? '';
        case 'warehouse':
        default:
          return `${item.warehouseCode ?? ''} ${item.warehouseName ?? ''}`;
      }
    };

    return rows.sort((a, b) => read(a).localeCompare(read(b), 'tr') * direction);
  }, [filteredSettings, pagedGrid.sortBy, pagedGrid.sortDirection]);
  const totalPages = Math.max(1, Math.ceil(sortedSettings.length / pagedGrid.pageSize));
  const safePageNumber = Math.min(pagedGrid.pageNumber, totalPages);
  const pageRows = sortedSettings.slice((safePageNumber - 1) * pagedGrid.pageSize, safePageNumber * pagedGrid.pageSize);
  const rangeFrom = sortedSettings.length === 0 ? 0 : (safePageNumber - 1) * pagedGrid.pageSize + 1;
  const rangeTo = Math.min(safePageNumber * pagedGrid.pageSize, sortedSettings.length);

  const canSave = permission.canCreate || permission.canUpdate;
  const resolvedShelfId = form.shelfId;

  const resetForm = () => setForm(emptyForm);
  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const edit = (item: BilginogluHakEdisCompletedLocationSetting) => {
    setForm({
      id: item.id,
      warehouseId: item.warehouseId,
      warehouseCode: item.warehouseCode ?? undefined,
      warehouseLabel: `${item.warehouseCode ?? '-'} · ${item.warehouseName ?? '-'}`,
      shelfCode: item.shelfCode ?? '',
      shelfId: item.shelfId,
      isDefault: item.isDefault,
      isActive: item.isActive,
      description: item.description ?? '',
    });
    setDialogOpen(true);
  };

  const submit = () => {
    if (!form.warehouseId || !resolvedShelfId) return;
    saveMutation.mutate({
      id: form.id,
      input: {
        warehouseId: form.warehouseId,
        shelfId: resolvedShelfId,
        isDefault: form.isDefault,
        isActive: form.isActive,
        description: form.description.trim() || null,
      },
    }, {
      onSuccess: () => {
        resetForm();
        setDialogOpen(false);
      },
    });
  };

  return (
    <OpsListPageShell
      eyebrow={<OpsServiceEyebrow module={t('breadcrumb.module')} />}
      title={t('locationSettings.title')}
      description={t('locationSettings.hero.description')}
      actions={
        <OpsActionButton type="button" variant="primary" onClick={openCreateDialog} disabled={!permission.canCreate}>
          <Plus className="size-4" />
          {t('locationSettings.actions.new')}
        </OpsActionButton>
      }
    >
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <HakEdisOpsDialogContent className="max-w-2xl">
          <div className="border-b px-4 py-4 sm:px-6">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle>{form.id ? t('locationSettings.form.editTitle') : t('locationSettings.form.createTitle')}</DialogTitle>
              <DialogDescription>{t('locationSettings.hero.description')}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 p-4 sm:p-6 wms-ops-form">
            <div className="space-y-2">
              <Label className="wms-ops-prelabel-form-label">
                {t('locationSettings.form.completedWarehouse')}
                <RequiredMark />
              </Label>
              <PagedLookupDialog<WarehouseLookup>
                open={warehouseLookupOpen}
                onOpenChange={setWarehouseLookupOpen}
                variant="ops"
                title={t('locationSettings.form.completedWarehouse')}
                description={t('locationSettings.form.completedWarehouseDescription')}
                value={form.warehouseLabel}
                placeholder={t('locationSettings.form.selectWarehouse')}
                searchPlaceholder={t('table.search')}
                queryKey={['bilginoglu-hakedis', 'completed-location', 'warehouse']}
                fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })}
                getKey={(item) => String(item.id)}
                getLabel={(item) => `${item.depoKodu} · ${item.depoIsmi}`}
                onSelect={(item) => {
                  setForm((prev) => ({
                    ...prev,
                    warehouseId: item.id,
                    warehouseCode: item.depoKodu,
                    warehouseLabel: `${item.depoKodu} · ${item.depoIsmi}`,
                    shelfCode: '',
                    shelfId: undefined,
                  }));
                  setWarehouseLookupOpen(false);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="wms-ops-prelabel-form-label">
                {t('locationSettings.form.completedShelf')}
                <RequiredMark />
              </Label>
              <ShelfLookupCombobox
                variant="ops"
                warehouseCode={form.warehouseCode}
                value={form.shelfCode}
                onValueChange={(code) => {
                  const shelf = shelfOptions.find((item) => item.code === code);
                  setForm((prev) => ({ ...prev, shelfCode: code, shelfId: shelf?.id }));
                }}
                placeholder={t('locationSettings.form.selectShelf')}
                searchPlaceholder={t('table.search')}
                emptyText={t('locationSettings.table.empty')}
                disabled={!form.warehouseId}
              />
              <p className="wms-ops-prelabel-panel__hint">{t('locationSettings.form.completedShelfDescription')}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <OpsToggleField
                checked={form.isDefault}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isDefault: checked }))}
                title={t('locationSettings.form.isDefault')}
              />
              <OpsToggleField
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
                title={t('locationSettings.form.isActive')}
              />
            </div>

            <div className="space-y-2">
              <Label className="wms-ops-prelabel-form-label">{t('locationSettings.form.description')}</Label>
              <OpsTextarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2 px-4 pb-4 sm:px-6 sm:pb-6">
            <OpsActionButton type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </OpsActionButton>
            <OpsActionButton
              type="button"
              variant="primary"
              disabled={!canSave || !form.warehouseId || !form.shelfCode || saveMutation.isPending}
              onClick={submit}
            >
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('locationSettings.actions.save')}
            </OpsActionButton>
          </DialogFooter>
        </HakEdisOpsDialogContent>
      </Dialog>

      <PagedDataGrid<BilginogluHakEdisCompletedLocationSetting, LocationColumnKey>
            variant="ops"
            pageKey={pageKey}
            columns={columns}
            rows={pageRows}
            rowKey={(row) => row.id}
            defaultColumnWidths={HAK_EDIS_SETTINGS_COLUMN_WIDTHS}
            iconOnlyActions
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'branch':
                  return <span className="font-semibold">{row.branchCode}</span>;
                case 'warehouse':
                  return (
                    <div>
                      <div className="font-medium">{row.warehouseCode ?? '-'}</div>
                      <div className="text-xs text-muted-foreground">{row.warehouseName ?? '-'}</div>
                    </div>
                  );
                case 'shelf':
                  return (
                    <div>
                      <div className="font-medium">{row.shelfCode ?? '-'}</div>
                      <div className="text-xs text-muted-foreground">{row.shelfName ?? '-'}</div>
                    </div>
                  );
                case 'status':
                  return (
                    <div className="flex flex-wrap gap-2">
                      {row.isDefault ? <HakEdisFlagChip tone="warn">{t('locationSettings.badges.default')}</HakEdisFlagChip> : null}
                      <HakEdisFlagChip tone={row.isActive ? 'success' : 'default'}>
                        {row.isActive ? t('locationSettings.badges.active') : t('locationSettings.badges.passive')}
                      </HakEdisFlagChip>
                    </div>
                  );
                case 'description':
                  return row.description ?? '-';
                default:
                  return null;
              }
            }}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            isLoading={settingsQuery.isLoading}
            isError={settingsQuery.isError}
            errorText={t('locationSettings.messages.saveFailed')}
            emptyText={t('locationSettings.table.empty')}
            pageSize={pagedGrid.pageSize}
            pageSizeOptions={pagedGrid.pageSizeOptions}
            onPageSizeChange={pagedGrid.handlePageSizeChange}
            pageNumber={safePageNumber}
            totalPages={totalPages}
            hasPreviousPage={safePageNumber > 1}
            hasNextPage={safePageNumber < totalPages}
            onPreviousPage={pagedGrid.goToPreviousPage}
            onNextPage={pagedGrid.goToNextPage}
            previousLabel={t('common.previous')}
            nextLabel={t('common.next')}
            paginationInfoText={t('common.paginationInfo', { current: rangeFrom, total: rangeTo, totalCount: sortedSettings.length })}
            showActionsColumn
            actionsHeaderLabel={t('locationSettings.table.actions')}
            actionsCellClassName="wms-ops-table-actions-col"
            renderActionsCell={(row) => (
              <div className="wms-ops-row-actions">
                <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn" onClick={() => edit(row)} disabled={!permission.canUpdate} aria-label={t('common.edit')}>
                  <Edit3 className="size-3" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger" onClick={() => deleteMutation.mutate(row.id)} disabled={!permission.canDelete || deleteMutation.isPending} aria-label={t('common.delete')}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            )}
            search={{
              ...pagedGrid.searchConfig,
              placeholder: t('table.search'),
            }}
            refresh={{
              onRefresh: () => settingsQuery.refetch(),
              isLoading: settingsQuery.isFetching,
              label: t('common.refresh'),
            }}
            exportFileName="bilginoglu-hakedis-location-settings"
            exportColumns={columns.map((column) => ({ key: column.key, label: column.label }))}
            exportRows={sortedSettings.map((row) => ({
              branch: row.branchCode,
              warehouse: `${row.warehouseCode ?? '-'} · ${row.warehouseName ?? '-'}`,
              shelf: `${row.shelfCode ?? '-'} · ${row.shelfName ?? '-'}`,
              status: row.isActive ? t('locationSettings.badges.active') : t('locationSettings.badges.passive'),
              description: row.description ?? '-',
            }))}
          />
    </OpsListPageShell>
  );
}

function RequiredMark(): ReactElement {
  return <span className="ml-1 text-destructive" aria-hidden="true">*</span>;
}
