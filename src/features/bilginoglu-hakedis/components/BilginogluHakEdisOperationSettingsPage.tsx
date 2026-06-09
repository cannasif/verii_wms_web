import { type ReactElement, useEffect, useState } from 'react';
import { Edit3, Loader2, Plus, Route, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { WarehouseLookup } from '@/features/shared/api/lookup-types';
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
  branchCode: string;
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
  branchCode: '0',
  operationCode: '',
  operationDescription: '',
  operationType: 'DAT',
  mainWarehouse: emptyWarehouse,
  intermediateWarehouse: emptyWarehouse,
  finalWarehouse: emptyWarehouse,
  isActive: true,
};

const operationTypes: BilginogluHakEdisOperationType[] = ['DAT', 'SEVK', 'AMBAR_CIKIS'];

function requiresWarehouseChain(type: BilginogluHakEdisOperationType): boolean {
  return type === 'DAT' || type === 'SEVK';
}

export function BilginogluHakEdisOperationSettingsPage(): ReactElement {
  const { t } = useTranslation(['bilginoglu-hakedis', 'common']);
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.service-allocation');
  const [form, setForm] = useState<FormState>(emptyForm);
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

  const resetForm = () => setForm(emptyForm);

  const edit = (item: BilginogluHakEdisOperationSetting) => {
    setForm({
      id: item.id,
      branchCode: item.branchCode || '0',
      operationCode: item.operationCode,
      operationDescription: item.operationDescription,
      operationType: item.operationType,
      mainWarehouse: toWarehouseSelection(item.mainWarehouseId, item.mainWarehouseCode, item.mainWarehouseName),
      intermediateWarehouse: toWarehouseSelection(item.intermediateWarehouseId, item.intermediateWarehouseCode, item.intermediateWarehouseName),
      finalWarehouse: toWarehouseSelection(item.finalWarehouseId, item.finalWarehouseCode, item.finalWarehouseName),
      isActive: item.isActive,
    });
  };

  const submit = () => {
    if (!isWarehouseChainValid) return;
    saveMutation.mutate({
      id: form.id,
      input: {
        branchCode: form.branchCode.trim() || '0',
        operationCode: form.operationCode.trim(),
        operationDescription: form.operationDescription.trim(),
        operationType: form.operationType,
        mainWarehouseId: showWarehouseChain ? form.mainWarehouse.id : null,
        intermediateWarehouseId: showWarehouseChain ? form.intermediateWarehouse.id : null,
        finalWarehouseId: showWarehouseChain ? form.finalWarehouse.id : null,
        isActive: form.isActive,
      },
    }, {
      onSuccess: resetForm,
    });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: t('breadcrumb.operations') }, { label: t('breadcrumb.serviceOperations') }, { label: t('operationSettings.title') }]} />

      <section className="overflow-hidden rounded-[2rem] border border-cyan-200 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
              <Route className="size-4" />
              {t('operationSettings.hero.eyebrow')}
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">{t('operationSettings.title')}</h1>
            <p className="text-sm leading-6 text-slate-200 md:text-base">{t('operationSettings.hero.description')}</p>
          </div>
          <Button type="button" variant="secondary" className="rounded-2xl" onClick={resetForm}>
            <Plus className="mr-2 size-4" />
            {t('operationSettings.actions.new')}
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(380px,460px)_1fr]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>{form.id ? t('operationSettings.form.editTitle') : t('operationSettings.form.createTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('operationSettings.form.branchCode')}</Label>
                <Input value={form.branchCode} onChange={(event) => setForm((prev) => ({ ...prev, branchCode: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('operationSettings.form.operationType')}</Label>
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
              <Label>{t('operationSettings.form.operationCode')}</Label>
              <Input value={form.operationCode} onChange={(event) => setForm((prev) => ({ ...prev, operationCode: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>{t('operationSettings.form.operationDescription')}</Label>
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
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t('operationSettings.table.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {settingsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                {t('loading')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('operationSettings.table.branch')}</TableHead>
                      <TableHead>{t('operationSettings.table.operation')}</TableHead>
                      <TableHead>{t('operationSettings.table.type')}</TableHead>
                      <TableHead>{t('operationSettings.table.warehouseChain')}</TableHead>
                      <TableHead>{t('operationSettings.table.status')}</TableHead>
                      <TableHead className="text-right">{t('operationSettings.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{item.branchCode}</TableCell>
                        <TableCell>
                          <div className="font-semibold">{item.operationCode}</div>
                          <div className="text-xs text-muted-foreground">{item.operationDescription}</div>
                        </TableCell>
                        <TableCell>{t(`operationSettings.operationTypes.${item.operationType}`)}</TableCell>
                        <TableCell className="min-w-[260px]">
                          {requiresWarehouseChain(item.operationType) ? (
                            <div className="space-y-1 text-xs">
                              <WarehouseLine label={t('operationSettings.form.mainWarehouse')} code={item.mainWarehouseCode} name={item.mainWarehouseName} />
                              <WarehouseLine label={t('operationSettings.form.intermediateWarehouse')} code={item.intermediateWarehouseCode} name={item.intermediateWarehouseName} />
                              <WarehouseLine label={t('operationSettings.form.finalWarehouse')} code={item.finalWarehouseCode} name={item.finalWarehouseName} />
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={`rounded-xl ${item.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-100'}`}>
                            {item.isActive ? t('operationSettings.badges.active') : t('operationSettings.badges.passive')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => edit(item)} disabled={!permission.canUpdate}>
                              <Edit3 className="size-4" />
                            </Button>
                            <Button type="button" variant="destructive" size="sm" className="rounded-xl" onClick={() => deleteMutation.mutate(item.id)} disabled={!permission.canDelete || deleteMutation.isPending}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {settings.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">{t('operationSettings.table.empty')}</div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
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
      <Label>{title}</Label>
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

function toWarehouseSelection(id?: number | null, code?: number | null, name?: string | null): WarehouseSelection {
  return id ? { id, code: code ?? undefined, label: `${code ?? '-'} · ${name ?? '-'}` } : emptyWarehouse;
}
