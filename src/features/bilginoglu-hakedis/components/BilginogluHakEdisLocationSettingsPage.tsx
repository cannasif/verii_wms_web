import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Edit3, Loader2, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { OpsListPageShell, OpsServiceEyebrow, PagedDataGrid, type PagedDataGridColumn, PagedLookupDialog } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { WarehouseLookup } from '@/features/shared/api/lookup-types';
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
        <Button type="button" variant="secondary" className="rounded-2xl" onClick={openCreateDialog} disabled={!permission.canCreate}>
          <Plus className="mr-2 size-4" />
          {t('locationSettings.actions.new')}
        </Button>
      }
    >
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? t('locationSettings.form.editTitle') : t('locationSettings.form.createTitle')}</DialogTitle>
            <DialogDescription>{t('locationSettings.hero.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {t('locationSettings.form.completedWarehouse')}
                <RequiredMark />
              </Label>
              <PagedLookupDialog<WarehouseLookup>
                open={warehouseLookupOpen}
                onOpenChange={setWarehouseLookupOpen}
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
              <Label>
                {t('locationSettings.form.completedShelf')}
                <RequiredMark />
              </Label>
              <Select
                value={form.shelfId ? String(form.shelfId) : ''}
                onValueChange={(value) => {
                  const shelf = shelfOptions.find((item) => String(item.id) === value);
                  setForm((prev) => ({ ...prev, shelfId: shelf?.id, shelfCode: shelf?.code ?? '' }));
                }}
                disabled={!form.warehouseId || shelvesQuery.isLoading}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder={shelvesQuery.isLoading ? t('loading') : t('locationSettings.form.selectShelf')} />
                </SelectTrigger>
                <SelectContent>
                  {shelfOptions.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.code} · {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('locationSettings.form.completedShelfDescription')}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 p-3 text-sm font-medium">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-300"
                  checked={form.isDefault}
                  onChange={(event) => setForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
                />
                {t('locationSettings.form.isDefault')}
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 p-3 text-sm font-medium">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-300"
                  checked={form.isActive}
                  onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                {t('locationSettings.form.isActive')}
              </label>
            </div>

            <div className="space-y-2">
              <Label>{t('locationSettings.form.description')}</Label>
              <Textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={3} />
            </div>

            <Button className="w-full rounded-2xl" type="button" disabled={!canSave || !form.warehouseId || !form.shelfCode || saveMutation.isPending} onClick={submit}>
              {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {t('locationSettings.actions.save')}
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>{t('locationSettings.table.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<BilginogluHakEdisCompletedLocationSetting, LocationColumnKey>
            pageKey={pageKey}
            columns={columns}
            rows={pageRows}
            rowKey={(row) => row.id}
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
                      {row.isDefault ? <Badge className="rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-100">{t('locationSettings.badges.default')}</Badge> : null}
                      <Badge className={`rounded-xl ${row.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-100'}`}>
                        {row.isActive ? t('locationSettings.badges.active') : t('locationSettings.badges.passive')}
                      </Badge>
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
            actionsCellClassName="text-right"
            renderActionsCell={(row) => (
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => edit(row)} disabled={!permission.canUpdate}>
                  <Edit3 className="size-4" />
                </Button>
                <Button type="button" variant="destructive" size="sm" className="rounded-xl" onClick={() => deleteMutation.mutate(row.id)} disabled={!permission.canDelete || deleteMutation.isPending}>
                  <Trash2 className="size-4" />
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
        </CardContent>
      </Card>
    </OpsListPageShell>
  );
}

function RequiredMark(): ReactElement {
  return <span className="ml-1 text-destructive" aria-hidden="true">*</span>;
}
