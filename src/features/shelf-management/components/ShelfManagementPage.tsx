import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, RefreshCcw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useUIStore } from '@/stores/ui-store';
import { lookupApi } from '@/services/lookup-api';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import type { ShelfUpsertRequest } from '../types/shelf-management.types';
import { shelfManagementApi } from '../api/shelf-management.api';

const EMPTY_FORM: ShelfUpsertRequest = {
  warehouseId: 0,
  parentShelfId: null,
  code: '',
  name: '',
  locationType: 'Cell',
  barcodeEntryMode: 'Auto',
  barcode: '',
  capacity: null,
  levelNo: null,
  isActive: true,
  description: '',
};

function sanitizeBarcodeCandidate(code: string): string {
  const normalizedCode = code.trim().toUpperCase();
  return normalizedCode.replace(/[^A-Z0-9_-]/g, '');
}

export function ShelfManagementPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.print-management');
  const [form, setForm] = useState<ShelfUpsertRequest>(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [warehousePickerOpen, setWarehousePickerOpen] = useState(false);

  useEffect(() => {
    setPageTitle(t('sidebar.erpShelves', { defaultValue: 'Raf / Hucre Tanimlari' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const warehousesQuery = useQuery({
    queryKey: ['shelf-management-warehouses'],
    queryFn: ({ signal }) => lookupApi.getWarehouses(undefined, { signal }),
  });

  const shelvesQuery = useQuery({
    queryKey: ['shelf-management-list', search],
    queryFn: ({ signal }) => shelfManagementApi.getPaged({ pageNumber: 1, pageSize: 200, search }, { signal }),
  });

  const allShelves = useMemo(() => shelvesQuery.data?.data?.data ?? [], [shelvesQuery.data?.data?.data]);
  const filteredParents = useMemo(() => allShelves.filter((item) => item.id !== selectedId && item.warehouseId === form.warehouseId), [allShelves, form.warehouseId, selectedId]);
  const barcodePreview = useMemo(() => form.barcodeEntryMode === 'Auto' ? sanitizeBarcodeCandidate(form.code) : (form.barcode ?? ''), [form.barcode, form.barcodeEntryMode, form.code]);

  const formReadOnly = selectedId ? !permission.canUpdate : !permission.canCreate;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (selectedId) {
        return await shelfManagementApi.update(selectedId, form);
      }
      return await shelfManagementApi.create(form);
    },
    onSuccess: (response) => {
      toast.success(response.message || (selectedId ? 'Raf kaydi guncellendi' : 'Raf kaydi olusturuldu'));
      void shelvesQuery.refetch();
      setSelectedId(null);
      setForm(EMPTY_FORM);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Raf kaydi kaydedilemedi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await shelfManagementApi.remove(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Raf kaydi silindi');
      void shelvesQuery.refetch();
      if (selectedId) {
        setSelectedId(null);
        setForm(EMPTY_FORM);
      }
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Raf kaydi silinemedi');
    },
  });

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.erp', { defaultValue: 'ERP' }) },
          { label: t('sidebar.erpShelves', { defaultValue: 'Raf / Hucre Tanimlari' }), isActive: true },
        ]}
      />

      <section className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92))] p-6 shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.88))]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Shelf</Badge>
              <Badge variant="secondary">Warehouse Master</Badge>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {t('sidebar.erpShelves', { defaultValue: 'Raf / Hucre Tanimlari' })}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Depo bazli zone, rack, shelf ve cell kayitlarini yonetin. Barcode girisi manuel veya otomatik olabilir.
            </p>
          </div>
          <Button variant="outline" onClick={() => void shelvesQuery.refetch()}>
            <RefreshCcw className="mr-2 size-4" />
            {t('common.refresh')}
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
        <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
          <CardHeader>
            <CardTitle>{selectedId ? 'Raf Kaydini Duzenle' : 'Yeni Raf Kaydi'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <fieldset disabled={formReadOnly} className={formReadOnly ? 'pointer-events-none opacity-75' : undefined}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Depo</Label>
                  <PagedLookupDialog
                    open={warehousePickerOpen}
                    onOpenChange={setWarehousePickerOpen}
                    value={
                      warehousesQuery.data?.find((item) => item.id === form.warehouseId)
                        ? `${warehousesQuery.data.find((item) => item.id === form.warehouseId)?.depoKodu} · ${warehousesQuery.data.find((item) => item.id === form.warehouseId)?.depoIsmi}`
                        : ''
                    }
                    placeholder="Depo secin"
                    title="Depo Sec"
                    description="Depo kayitlari server-side arama ve 20li sayfalama ile listelenir."
                    queryKey={['shelf-management', 'warehouse-picker']}
                    fetchPage={({ pageNumber, pageSize, search, signal }) =>
                      lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                    }
                    getKey={(item) => String(item.id)}
                    getLabel={(item) => `${item.depoKodu} · ${item.depoIsmi}`}
                    onSelect={(item) =>
                      setForm((current) => ({ ...current, warehouseId: item.id, parentShelfId: null }))
                    }
                    disabled={formReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ust Raf</Label>
                  <Select value={form.parentShelfId ? String(form.parentShelfId) : '__none__'} onValueChange={(value) => setForm((current) => ({ ...current, parentShelfId: value === '__none__' ? null : Number(value) }))}>
                    <SelectTrigger><SelectValue placeholder="Opsiyonel ust raf" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Yok</SelectItem>
                      {filteredParents.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>{item.code} · {item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Ad</Label>
                  <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 mt-4">
                <div className="space-y-2">
                  <Label>Tip</Label>
                  <Select value={form.locationType} onValueChange={(value) => setForm((current) => ({ ...current, locationType: value as ShelfUpsertRequest['locationType'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Zone">Zone</SelectItem>
                      <SelectItem value="Rack">Rack</SelectItem>
                      <SelectItem value="Shelf">Shelf</SelectItem>
                      <SelectItem value="Cell">Cell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Seviye No</Label>
                  <Input type="number" value={form.levelNo ?? ''} onChange={(event) => setForm((current) => ({ ...current, levelNo: event.target.value ? Number(event.target.value) : null }))} />
                </div>
                <div className="space-y-2">
                  <Label>Kapasite</Label>
                  <Input type="number" value={form.capacity ?? ''} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value ? Number(event.target.value) : null }))} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label>Barkod Giris Tipi</Label>
                  <Select value={form.barcodeEntryMode} onValueChange={(value) => setForm((current) => ({ ...current, barcodeEntryMode: value as ShelfUpsertRequest['barcodeEntryMode'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Auto">Auto</SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Barkod</Label>
                  <Input
                    value={form.barcodeEntryMode === 'Auto' ? barcodePreview : (form.barcode ?? '')}
                    onChange={(event) => setForm((current) => ({ ...current, barcode: event.target.value }))}
                    disabled={form.barcodeEntryMode === 'Auto'}
                    placeholder={form.barcodeEntryMode === 'Auto' ? 'Code uzerinden otomatik olusur' : 'Elle barkod girin'}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-sm dark:border-white/10 dark:bg-slate-900/30 mt-4">
                <div className="font-medium text-slate-900 dark:text-white">Barcode Preview</div>
                <div className="mt-1 font-mono text-sky-700 dark:text-sky-300">{barcodePreview || '-'}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Auto modda barcode code uzerinden uretilir. Manual modda global unique barkod beklenir.
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label>{t('common.description')}</Label>
                <Textarea value={form.description ?? ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 px-3 py-2 mt-4 dark:border-white/10">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">Aktif Kayit</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Pasif raf secim listelerinde cikmaz.</div>
                </div>
                <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
              </div>
            </fieldset>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => saveMutation.mutate()} disabled={formReadOnly || saveMutation.isPending}>
                <Save className="mr-2 size-4" />
                {selectedId ? 'Guncelle' : 'Kaydet'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedId(null);
                  setForm(EMPTY_FORM);
                }}
              >
                <Plus className="mr-2 size-4" />
                Yeni Kayit
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Raf Listesi</CardTitle>
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Code, ad veya barkod ara" className="max-w-xs" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Depo</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Barkod</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Aksiyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allShelves.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.warehouseCode} · {item.warehouseName}</TableCell>
                    <TableCell className="font-mono">{item.code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      {item.parentShelfCode ? <div className="text-xs text-slate-500">Ust: {item.parentShelfCode}</div> : null}
                    </TableCell>
                    <TableCell>{item.locationType}</TableCell>
                    <TableCell className="font-mono">{item.barcode || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>{item.isActive ? 'Aktif' : 'Pasif'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!permission.canUpdate}
                          onClick={() => {
                            setSelectedId(item.id);
                            setForm({
                              warehouseId: item.warehouseId,
                              parentShelfId: item.parentShelfId ?? null,
                              code: item.code,
                              name: item.name,
                              locationType: item.locationType,
                              barcodeEntryMode: item.barcodeEntryMode,
                              barcode: item.barcode ?? '',
                              capacity: item.capacity ?? null,
                              levelNo: item.levelNo ?? null,
                              isActive: item.isActive,
                              description: item.description ?? '',
                            });
                          }}
                        >
                          Duzenle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!permission.canDelete || deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
