import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Edit3, Loader2, MapPinned, Plus, Search, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { WarehouseLookup } from '@/features/shared/api/lookup-types';
import { shelfManagementApi } from '@/features/shelf-management/api/shelf-management.api';
import { useUIStore } from '@/stores/ui-store';
import type { BilginogluHakEdisCompletedLocationSetting } from '../types/bilginoglu-hakedis.types';
import {
  useBilginogluHakEdisCompletedLocationSettingDeleteMutation,
  useBilginogluHakEdisCompletedLocationSettingMutation,
  useBilginogluHakEdisCompletedLocationSettingsQuery,
} from '../hooks/useBilginogluHakEdisQueries';

interface FormState {
  id?: number;
  branchCode: string;
  warehouseId?: number;
  warehouseCode?: number;
  warehouseLabel: string;
  shelfCode: string;
  shelfId?: number;
  isDefault: boolean;
  isActive: boolean;
  description: string;
}

const emptyForm: FormState = {
  branchCode: '0',
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
  const [warehouseLookupOpen, setWarehouseLookupOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
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

  const canSave = permission.canCreate || permission.canUpdate;
  const resolvedShelfId = form.shelfId;

  const resetForm = () => setForm(emptyForm);

  const edit = (item: BilginogluHakEdisCompletedLocationSetting) => {
    setForm({
      id: item.id,
      branchCode: item.branchCode || '0',
      warehouseId: item.warehouseId,
      warehouseCode: item.warehouseCode ?? undefined,
      warehouseLabel: `${item.warehouseCode ?? '-'} · ${item.warehouseName ?? '-'}`,
      shelfCode: item.shelfCode ?? '',
      shelfId: item.shelfId,
      isDefault: item.isDefault,
      isActive: item.isActive,
      description: item.description ?? '',
    });
  };

  const submit = () => {
    if (!form.warehouseId || !resolvedShelfId) return;
    saveMutation.mutate({
      id: form.id,
      input: {
        branchCode: form.branchCode.trim() || '0',
        warehouseId: form.warehouseId,
        shelfId: resolvedShelfId,
        isDefault: form.isDefault,
        isActive: form.isActive,
        description: form.description.trim() || null,
      },
    }, {
      onSuccess: resetForm,
    });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: t('breadcrumb.operations') }, { label: t('breadcrumb.serviceOperations') }, { label: t('locationSettings.title') }]} />

      <section className="overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-slate-950 via-stone-900 to-amber-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-100">
              <MapPinned className="size-4" />
              {t('locationSettings.hero.eyebrow')}
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">{t('locationSettings.title')}</h1>
            <p className="text-sm leading-6 text-stone-200 md:text-base">{t('locationSettings.hero.description')}</p>
          </div>
          <Button type="button" variant="secondary" className="rounded-2xl" onClick={resetForm}>
            <Plus className="mr-2 size-4" />
            {t('locationSettings.actions.new')}
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(360px,440px)_1fr]">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>{form.id ? t('locationSettings.form.editTitle') : t('locationSettings.form.createTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('locationSettings.form.branchCode')}</Label>
              <Input value={form.branchCode} onChange={(event) => setForm((prev) => ({ ...prev, branchCode: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>{t('locationSettings.form.completedWarehouse')}</Label>
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
              <Label>{t('locationSettings.form.completedShelf')}</Label>
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
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t('locationSettings.table.title')}</CardTitle>
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
                      <TableHead>{t('locationSettings.table.branch')}</TableHead>
                      <TableHead>{t('locationSettings.table.warehouse')}</TableHead>
                      <TableHead>{t('locationSettings.table.shelf')}</TableHead>
                      <TableHead>{t('locationSettings.table.status')}</TableHead>
                      <TableHead>{t('locationSettings.table.description')}</TableHead>
                      <TableHead className="text-right">{t('locationSettings.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{item.branchCode}</TableCell>
                        <TableCell>
                          <div className="font-medium">{item.warehouseCode ?? '-'}</div>
                          <div className="text-xs text-muted-foreground">{item.warehouseName ?? '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.shelfCode ?? '-'}</div>
                          <div className="text-xs text-muted-foreground">{item.shelfName ?? '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {item.isDefault ? <Badge className="rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-100">{t('locationSettings.badges.default')}</Badge> : null}
                            <Badge className={`rounded-xl ${item.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-100'}`}>
                              {item.isActive ? t('locationSettings.badges.active') : t('locationSettings.badges.passive')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{item.description ?? '-'}</TableCell>
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
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                    <Search className="size-6" />
                    {t('locationSettings.table.empty')}
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
