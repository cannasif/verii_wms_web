import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Edit3, Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OpsListPageShell, OpsServiceEyebrow, PagedDataGrid, type PagedDataGridColumn, PagedLookupDialog } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { WarehouseLookup } from '@/features/shared/api/lookup-types';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { useUIStore } from '@/stores/ui-store';
import type { BilginogluHakEdisOperationSetting, BilginogluHakEdisOperationType } from '../types/bilginoglu-hakedis.types';
import {
  useBilginogluHakEdisOperationSettingDeleteMutation,
  useBilginogluHakEdisOperationSettingMutation,
  useBilginogluHakEdisOperationSettingsQuery,
} from '../hooks/useBilginogluHakEdisQueries';

interface WarehouseSelection {
  id?: number;
  code?: number;
  label: string;
}

interface FormState {
  id?: number;
  operationCode: string;
  operationDescription: string;
  operationType: BilginogluHakEdisOperationType;
  mainWarehouse: WarehouseSelection;
  intermediateWarehouse: WarehouseSelection;
  finalWarehouse: WarehouseSelection;
  isActive: boolean;
}

const emptyWarehouse: WarehouseSelection = { label: '' };
const emptyForm: FormState = {
  operationCode: '',
  operationDescription: '',
  operationType: 'DAT',
  mainWarehouse: emptyWarehouse,
  intermediateWarehouse: emptyWarehouse,
  finalWarehouse: emptyWarehouse,
  isActive: true,
};

const operationTypes: BilginogluHakEdisOperationType[] = ['DAT', 'SEVK', 'AMBAR_CIKIS'];
type OperationColumnKey = 'branch' | 'operation' | 'type' | 'warehouseChain' | 'status';

function requiresWarehouseChain(type: BilginogluHakEdisOperationType): boolean {
  return type === 'DAT' || type === 'SEVK';
}

export function BilginogluHakEdisOperationSettingsPage(): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.service-allocation');
  const pageKey = 'bilginoglu-hakedis-operation-settings';
  const [form, setForm] = useState<FormState>(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pagedGrid = usePagedDataGrid<OperationColumnKey>({
    pageKey,
    defaultSortBy: 'operation',
    defaultSortDirection: 'asc',
    defaultPageSize: 10,
    defaultPageNumber: 1,
    pageNumberBase: 1,
  });
  const settingsQuery = useBilginogluHakEdisOperationSettingsQuery();
  const saveMutation = useBilginogluHakEdisOperationSettingMutation();
  const deleteMutation = useBilginogluHakEdisOperationSettingDeleteMutation();

  useEffect(() => {
    setPageTitle(t('operationSettings.title'));
  }, [setPageTitle, t]);

  const settings = settingsQuery.data ?? [];
  const showWarehouseChain = requiresWarehouseChain(form.operationType);
  const canSave = permission.canCreate || permission.canUpdate;
  const isWarehouseChainValid = !showWarehouseChain || (form.mainWarehouse.id && form.intermediateWarehouse.id && form.finalWarehouse.id);
  const columns = useMemo<PagedDataGridColumn<OperationColumnKey>[]>(() => [
    { key: 'branch', label: t('operationSettings.table.branch') },
    { key: 'operation', label: t('operationSettings.table.operation') },
    { key: 'type', label: t('operationSettings.table.type') },
    { key: 'warehouseChain', label: t('operationSettings.table.warehouseChain'), sortable: false },
    { key: 'status', label: t('operationSettings.table.status'), sortable: false },
  ], [t]);
  const filteredSettings = useMemo(() => settings.filter((item) => {
    const search = pagedGrid.searchTerm.trim().toLocaleLowerCase('tr-TR');
    if (!search) return true;

    return [
      item.branchCode,
      item.operationCode,
      item.operationDescription,
      item.operationType,
      item.mainWarehouseCode,
      item.mainWarehouseName,
      item.intermediateWarehouseCode,
      item.intermediateWarehouseName,
      item.finalWarehouseCode,
      item.finalWarehouseName,
    ].some((value) => String(value ?? '').toLocaleLowerCase('tr-TR').includes(search));
  }), [pagedGrid.searchTerm, settings]);
  const sortedSettings = useMemo(() => [...filteredSettings].sort((a, b) => {
    const direction = pagedGrid.sortDirection === 'asc' ? 1 : -1;
    const read = (item: BilginogluHakEdisOperationSetting): string => {
      switch (pagedGrid.sortBy) {
        case 'branch':
          return item.branchCode ?? '';
        case 'type':
          return item.operationType ?? '';
        case 'operation':
        default:
          return `${item.operationCode ?? ''} ${item.operationDescription ?? ''}`;
      }
    };

    return read(a).localeCompare(read(b), 'tr') * direction;
  }), [filteredSettings, pagedGrid.sortBy, pagedGrid.sortDirection]);
  const totalPages = Math.max(1, Math.ceil(sortedSettings.length / pagedGrid.pageSize));
  const safePageNumber = Math.min(pagedGrid.pageNumber, totalPages);
  const pageRows = sortedSettings.slice((safePageNumber - 1) * pagedGrid.pageSize, safePageNumber * pagedGrid.pageSize);
  const rangeFrom = sortedSettings.length === 0 ? 0 : (safePageNumber - 1) * pagedGrid.pageSize + 1;
  const rangeTo = Math.min(safePageNumber * pagedGrid.pageSize, sortedSettings.length);

  const resetForm = () => setForm(emptyForm);
  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const edit = (item: BilginogluHakEdisOperationSetting) => {
    setForm({
      id: item.id,
      operationCode: item.operationCode,
      operationDescription: item.operationDescription,
      operationType: item.operationType,
      mainWarehouse: toWarehouseSelection(item.mainWarehouseId, item.mainWarehouseCode, item.mainWarehouseName),
      intermediateWarehouse: toWarehouseSelection(item.intermediateWarehouseId, item.intermediateWarehouseCode, item.intermediateWarehouseName),
      finalWarehouse: toWarehouseSelection(item.finalWarehouseId, item.finalWarehouseCode, item.finalWarehouseName),
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const submit = () => {
    if (!isWarehouseChainValid) return;
    saveMutation.mutate({
      id: form.id,
      input: {
        operationCode: form.operationCode.trim(),
        operationDescription: form.operationDescription.trim(),
        operationType: form.operationType,
        mainWarehouseId: showWarehouseChain ? form.mainWarehouse.id : null,
        intermediateWarehouseId: showWarehouseChain ? form.intermediateWarehouse.id : null,
        finalWarehouseId: showWarehouseChain ? form.finalWarehouse.id : null,
        isActive: form.isActive,
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
      title={t('operationSettings.title')}
      description={t('operationSettings.hero.description')}
      actions={
        <Button type="button" variant="secondary" className="rounded-2xl" onClick={openCreateDialog} disabled={!permission.canCreate}>
          <Plus className="mr-2 size-4" />
          {t('operationSettings.actions.new')}
        </Button>
      }
    >
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? t('operationSettings.form.editTitle') : t('operationSettings.form.createTitle')}</DialogTitle>
            <DialogDescription>{t('operationSettings.hero.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  {t('operationSettings.form.operationType')}
                  <RequiredMark />
                </Label>
                <Select
                  value={form.operationType}
                  onValueChange={(value) => setForm((prev) => ({
                    ...prev,
                    operationType: value as BilginogluHakEdisOperationType,
                    mainWarehouse: requiresWarehouseChain(value as BilginogluHakEdisOperationType) ? prev.mainWarehouse : emptyWarehouse,
                    intermediateWarehouse: requiresWarehouseChain(value as BilginogluHakEdisOperationType) ? prev.intermediateWarehouse : emptyWarehouse,
                    finalWarehouse: requiresWarehouseChain(value as BilginogluHakEdisOperationType) ? prev.finalWarehouse : emptyWarehouse,
                  }))}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operationTypes.map((type) => (
                      <SelectItem key={type} value={type}>{t(`operationSettings.operationTypes.${type}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {t('operationSettings.form.operationCode')}
                <RequiredMark />
              </Label>
              <Input value={form.operationCode} onChange={(event) => setForm((prev) => ({ ...prev, operationCode: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>
                {t('operationSettings.form.operationDescription')}
                <RequiredMark />
              </Label>
              <Input value={form.operationDescription} onChange={(event) => setForm((prev) => ({ ...prev, operationDescription: event.target.value }))} />
            </div>

            {showWarehouseChain ? (
              <div className="space-y-3 rounded-3xl border border-cyan-100 bg-cyan-50/60 p-4">
                <p className="text-sm font-semibold text-cyan-900">{t('operationSettings.form.warehouseChainTitle')}</p>
                <WarehousePicker
                  title={t('operationSettings.form.mainWarehouse')}
                  value={form.mainWarehouse}
                  onSelect={(warehouse) => setForm((prev) => ({ ...prev, mainWarehouse: warehouse }))}
                  queryKeySuffix="main"
                />
                <WarehousePicker
                  title={t('operationSettings.form.intermediateWarehouse')}
                  value={form.intermediateWarehouse}
                  onSelect={(warehouse) => setForm((prev) => ({ ...prev, intermediateWarehouse: warehouse }))}
                  queryKeySuffix="intermediate"
                />
                <WarehousePicker
                  title={t('operationSettings.form.finalWarehouse')}
                  value={form.finalWarehouse}
                  onSelect={(warehouse) => setForm((prev) => ({ ...prev, finalWarehouse: warehouse }))}
                  queryKeySuffix="final"
                />
              </div>
            ) : null}

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 p-3 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4 rounded border-slate-300"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              {t('operationSettings.form.isActive')}
            </label>

            <Button
              className="w-full rounded-2xl"
              type="button"
              disabled={!canSave || !form.operationCode.trim() || !form.operationDescription.trim() || !isWarehouseChainValid || saveMutation.isPending}
              onClick={submit}
            >
              {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {t('operationSettings.actions.save')}
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
          <CardTitle>{t('operationSettings.table.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<BilginogluHakEdisOperationSetting, OperationColumnKey>
            pageKey={pageKey}
            columns={columns}
            rows={pageRows}
            rowKey={(row) => row.id}
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'branch':
                  return <span className="font-semibold">{row.branchCode}</span>;
                case 'operation':
                  return (
                    <div>
                      <div className="font-semibold">{row.operationCode}</div>
                      <div className="text-xs text-muted-foreground">{row.operationDescription}</div>
                    </div>
                  );
                case 'type':
                  return t(`operationSettings.operationTypes.${row.operationType}`);
                case 'warehouseChain':
                  return requiresWarehouseChain(row.operationType) ? (
                    <div className="space-y-1 text-xs">
                      <WarehouseLine label={t('operationSettings.form.mainWarehouse')} code={row.mainWarehouseCode} name={row.mainWarehouseName} />
                      <WarehouseLine label={t('operationSettings.form.intermediateWarehouse')} code={row.intermediateWarehouseCode} name={row.intermediateWarehouseName} />
                      <WarehouseLine label={t('operationSettings.form.finalWarehouse')} code={row.finalWarehouseCode} name={row.finalWarehouseName} />
                    </div>
                  ) : '-';
                case 'status':
                  return (
                    <Badge className={`rounded-xl ${row.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-100'}`}>
                      {row.isActive ? t('operationSettings.badges.active') : t('operationSettings.badges.passive')}
                    </Badge>
                  );
                default:
                  return null;
              }
            }}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            isLoading={settingsQuery.isLoading}
            isError={settingsQuery.isError}
            errorText={t('operationSettings.messages.saveFailed')}
            emptyText={t('operationSettings.table.empty')}
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
            actionsHeaderLabel={t('operationSettings.table.actions')}
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
            exportFileName="bilginoglu-hakedis-operation-settings"
            exportColumns={columns.map((column) => ({ key: column.key, label: column.label }))}
            exportRows={sortedSettings.map((row) => ({
              branch: row.branchCode,
              operation: `${row.operationCode} - ${row.operationDescription}`,
              type: t(`operationSettings.operationTypes.${row.operationType}`),
              warehouseChain: requiresWarehouseChain(row.operationType)
                ? `${row.mainWarehouseCode ?? '-'}>${row.intermediateWarehouseCode ?? '-'}>${row.finalWarehouseCode ?? '-'}`
                : '-',
              status: row.isActive ? t('operationSettings.badges.active') : t('operationSettings.badges.passive'),
            }))}
          />
        </CardContent>
      </Card>
    </OpsListPageShell>
  );
}

function WarehousePicker({
  title,
  value,
  onSelect,
  queryKeySuffix,
}: {
  title: string;
  value: WarehouseSelection;
  onSelect: (warehouse: WarehouseSelection) => void;
  queryKeySuffix: string;
}): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label>
        {title}
        <RequiredMark />
      </Label>
      <PagedLookupDialog<WarehouseLookup>
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={t('operationSettings.form.warehouseSelectDescription')}
        value={value.label}
        placeholder={t('operationSettings.form.selectWarehouse')}
        searchPlaceholder={t('table.search')}
        queryKey={['bilginoglu-hakedis', 'operation-setting', queryKeySuffix, 'warehouse']}
        fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })}
        getKey={(item) => String(item.id)}
        getLabel={(item) => `${item.depoKodu} · ${item.depoIsmi}`}
        onSelect={(item) => {
          onSelect({ id: item.id, code: item.depoKodu, label: `${item.depoKodu} · ${item.depoIsmi}` });
          setOpen(false);
        }}
      />
    </div>
  );
}

function WarehouseLine({ label, code, name }: { label: string; code?: number | null; name?: string | null }): ReactElement {
  return (
    <div>
      <span className="font-semibold">{label}:</span> {code ?? '-'} · {name ?? '-'}
    </div>
  );
}

function RequiredMark(): ReactElement {
  return <span className="ml-1 text-destructive" aria-hidden="true">*</span>;
}

function toWarehouseSelection(id?: number | null, code?: number | null, name?: string | null): WarehouseSelection {
  return id ? { id, code: code ?? undefined, label: `${code ?? '-'} · ${name ?? '-'}` } : emptyWarehouse;
}
