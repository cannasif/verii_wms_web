import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PackageCheck, Plus, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { packageApi } from '../api/package-api';
import { PACKAGE_QUERY_KEYS } from '../utils/query-keys';
import type {
  CreatePackagingMaterialDto,
  CreatePackagingSpecificationDto,
  PackagingMaterialDto,
  PackagingSpecificationDto,
} from '../types/package';

const emptyMaterial: CreatePackagingMaterialDto = {
  materialCode: '',
  materialName: '',
  materialType: 'Box',
  standardLength: null,
  standardWidth: null,
  standardHeight: null,
  standardVolume: null,
  standardTareWeight: null,
  maxLength: null,
  maxWidth: null,
  maxHeight: null,
  maxVolume: null,
  maxGrossWeight: null,
  maxProductQuantity: null,
  isActive: true,
  description: '',
};

const emptySpecification: CreatePackagingSpecificationDto = {
  stockId: 0,
  customerId: null,
  boxPackagingMaterialId: 0,
  palletPackagingMaterialId: null,
  unitsPerPackage: 1,
  packagesPerPallet: null,
  allowMixedStock: true,
  allowMixedYapKod: true,
  allowMixedSerial: true,
  isActive: true,
  priority: 0,
  notes: '',
};

const toNumberOrNull = (value: string): number | null => {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function PackagingSettingsPage(): ReactElement {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permission = useCrudPermission('wms.package');
  const canWrite = permission.canCreate || permission.canUpdate;
  const [materialForm, setMaterialForm] = useState<CreatePackagingMaterialDto>(emptyMaterial);
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [specForm, setSpecForm] = useState<CreatePackagingSpecificationDto>(emptySpecification);
  const [editingSpecId, setEditingSpecId] = useState<number | null>(null);

  const materialsQuery = useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.MATERIALS, 'settings'],
    queryFn: () => packageApi.getPackagingMaterialsPaged({ pageSize: 200, sortBy: 'MaterialType', sortDirection: 'asc' }),
  });

  const specificationsQuery = useQuery({
    queryKey: [PACKAGE_QUERY_KEYS.SPECIFICATIONS, 'settings'],
    queryFn: () => packageApi.getPackagingSpecificationsPaged({ pageSize: 200, sortBy: 'Priority', sortDirection: 'desc' }),
  });

  const materials = materialsQuery.data?.data ?? [];
  const specifications = specificationsQuery.data?.data ?? [];
  const boxMaterials = useMemo(() => materials.filter((item) => item.isActive && item.materialType.toLowerCase() === 'box'), [materials]);
  const palletMaterials = useMemo(() => materials.filter((item) => item.isActive && item.materialType.toLowerCase() === 'pallet'), [materials]);

  const refreshDefinitions = async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.MATERIALS] }),
      queryClient.invalidateQueries({ queryKey: [PACKAGE_QUERY_KEYS.SPECIFICATIONS] }),
    ]);
  };

  const saveMaterialMutation = useMutation({
    mutationFn: () => editingMaterialId
      ? packageApi.updatePackagingMaterial(editingMaterialId, materialForm)
      : packageApi.createPackagingMaterial(materialForm),
    onSuccess: async () => {
      toast.success(t('package.settings.materialSaved', { defaultValue: 'Ambalaj malzemesi kaydedildi' }));
      setMaterialForm(emptyMaterial);
      setEditingMaterialId(null);
      await refreshDefinitions();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (id: number) => packageApi.deletePackagingMaterial(id),
    onSuccess: async () => {
      toast.success(t('package.settings.materialDeleted', { defaultValue: 'Ambalaj malzemesi silindi' }));
      await refreshDefinitions();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const saveSpecificationMutation = useMutation({
    mutationFn: () => editingSpecId
      ? packageApi.updatePackagingSpecification(editingSpecId, specForm)
      : packageApi.createPackagingSpecification(specForm),
    onSuccess: async () => {
      toast.success(t('package.settings.specSaved', { defaultValue: 'Paketleme kuralı kaydedildi' }));
      setSpecForm(emptySpecification);
      setEditingSpecId(null);
      await refreshDefinitions();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const deleteSpecificationMutation = useMutation({
    mutationFn: (id: number) => packageApi.deletePackagingSpecification(id),
    onSuccess: async () => {
      toast.success(t('package.settings.specDeleted', { defaultValue: 'Paketleme kuralı silindi' }));
      await refreshDefinitions();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const startEditMaterial = (material: PackagingMaterialDto): void => {
    setEditingMaterialId(material.id);
    setMaterialForm({ ...material });
  };

  const startEditSpecification = (spec: PackagingSpecificationDto): void => {
    setEditingSpecId(spec.id);
    setSpecForm({
      stockId: spec.stockId,
      customerId: spec.customerId ?? null,
      customerCode: spec.customerCode ?? null,
      boxPackagingMaterialId: spec.boxPackagingMaterialId,
      palletPackagingMaterialId: spec.palletPackagingMaterialId ?? null,
      unitsPerPackage: spec.unitsPerPackage,
      packagesPerPallet: spec.packagesPerPallet ?? null,
      allowMixedStock: spec.allowMixedStock,
      allowMixedYapKod: spec.allowMixedYapKod,
      allowMixedSerial: spec.allowMixedSerial,
      isActive: spec.isActive,
      priority: spec.priority,
      notes: spec.notes ?? '',
    });
  };

  return (
    <div className="crm-page space-y-6">
      {!permission.canMutate ? <PermissionNotice /> : null}
      <Card className="overflow-hidden border-slate-200/80">
        <CardHeader className="bg-gradient-to-r from-slate-950 to-slate-700 text-white">
          <div className="flex items-center gap-3">
            <PackageCheck className="size-7" />
            <div>
              <CardTitle>{t('package.settings.title', { defaultValue: 'Paketleme Tanımları' })}</CardTitle>
              <CardDescription className="text-slate-200">
                {t('package.settings.description', { defaultValue: 'Ambalaj, koli/palet kapasitesi ve müşteri-stok bazlı cartonization kurallarını yönetin.' })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="materials">
            <TabsList>
              <TabsTrigger value="materials">{t('package.settings.materials', { defaultValue: 'Ambalaj Malzemeleri' })}</TabsTrigger>
              <TabsTrigger value="specs">{t('package.settings.specs', { defaultValue: 'Paketleme Kuralları' })}</TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>{editingMaterialId ? t('common.edit') : t('common.create')}</CardTitle>
                  <CardDescription>{t('package.settings.materialFormHelp', { defaultValue: 'Koli/palet boyut, dara ve maksimum kapasite bilgilerini girin.' })}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>{t('package.settings.materialCode', { defaultValue: 'Kod' })}</Label>
                      <Input value={materialForm.materialCode} disabled={!canWrite} onChange={(event) => setMaterialForm((prev) => ({ ...prev, materialCode: event.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>{t('package.settings.materialType', { defaultValue: 'Tip' })}</Label>
                      <Select value={materialForm.materialType} disabled={!canWrite} onValueChange={(value) => setMaterialForm((prev) => ({ ...prev, materialType: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Box', 'Pallet', 'Bag', 'Custom'].map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>{t('package.settings.materialName', { defaultValue: 'Ad' })}</Label>
                    <Input value={materialForm.materialName} disabled={!canWrite} onChange={(event) => setMaterialForm((prev) => ({ ...prev, materialName: event.target.value }))} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(['standardLength', 'standardWidth', 'standardHeight'] as const).map((key) => (
                      <div key={key} className="space-y-1">
                        <Label>{key.replace('standard', '')}</Label>
                        <Input type="number" value={materialForm[key] ?? ''} disabled={!canWrite} onChange={(event) => setMaterialForm((prev) => ({ ...prev, [key]: toNumberOrNull(event.target.value) }))} />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(['maxVolume', 'maxGrossWeight', 'maxProductQuantity'] as const).map((key) => (
                      <div key={key} className="space-y-1">
                        <Label>{key.replace('max', 'Max ')}</Label>
                        <Input type="number" value={materialForm[key] ?? ''} disabled={!canWrite} onChange={(event) => setMaterialForm((prev) => ({ ...prev, [key]: toNumberOrNull(event.target.value) }))} />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label>{t('common.active', { defaultValue: 'Aktif' })}</Label>
                    <Switch checked={materialForm.isActive ?? true} disabled={!canWrite} onCheckedChange={(checked) => setMaterialForm((prev) => ({ ...prev, isActive: checked }))} />
                  </div>
                  <div className="flex gap-2">
                    <Button disabled={!canWrite || saveMaterialMutation.isPending} onClick={() => saveMaterialMutation.mutate()}>
                      <Save className="mr-2 size-4" />{t('common.save')}
                    </Button>
                    <Button variant="outline" onClick={() => { setMaterialForm(emptyMaterial); setEditingMaterialId(null); }}>{t('common.cancel')}</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>{t('package.settings.materialList', { defaultValue: 'Malzeme Listesi' })}</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Kod</TableHead><TableHead>Tip</TableHead><TableHead>Kapasite</TableHead><TableHead>Durum</TableHead><TableHead className="text-right">{t('common.actions')}</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {materials.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell><div className="font-medium">{item.materialCode}</div><div className="text-xs text-muted-foreground">{item.materialName}</div></TableCell>
                          <TableCell><Badge variant="outline">{item.materialType}</Badge></TableCell>
                          <TableCell className="text-xs">Max kg: {item.maxGrossWeight ?? '-'} / Max qty: {item.maxProductQuantity ?? '-'}</TableCell>
                          <TableCell>{item.isActive ? <Badge>{t('common.active', { defaultValue: 'Aktif' })}</Badge> : <Badge variant="secondary">{t('common.passive', { defaultValue: 'Pasif' })}</Badge>}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" disabled={!canWrite} onClick={() => startEditMaterial(item)}>{t('common.edit')}</Button>
                            <Button size="sm" variant="ghost" disabled={!permission.canDelete} onClick={() => deleteMaterialMutation.mutate(item.id)}><Trash2 className="size-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specs" className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>{editingSpecId ? t('common.edit') : t('common.create')}</CardTitle>
                  <CardDescription>{t('package.settings.specFormHelp', { defaultValue: 'Stok ve müşteri bazlı koli/palet öneri kuralı.' })}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>StockId</Label><Input type="number" value={specForm.stockId || ''} disabled={!canWrite} onChange={(event) => setSpecForm((prev) => ({ ...prev, stockId: Number(event.target.value) }))} /></div>
                    <div className="space-y-1"><Label>CustomerId</Label><Input type="number" value={specForm.customerId ?? ''} disabled={!canWrite} onChange={(event) => setSpecForm((prev) => ({ ...prev, customerId: toNumberOrNull(event.target.value) }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>{t('package.settings.boxMaterial', { defaultValue: 'Koli Malzemesi' })}</Label>
                      <Select value={specForm.boxPackagingMaterialId ? String(specForm.boxPackagingMaterialId) : ''} disabled={!canWrite} onValueChange={(value) => setSpecForm((prev) => ({ ...prev, boxPackagingMaterialId: Number(value) }))}>
                        <SelectTrigger><SelectValue placeholder="Box" /></SelectTrigger>
                        <SelectContent>{boxMaterials.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.materialCode} - {item.materialName}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>{t('package.settings.palletMaterial', { defaultValue: 'Palet Malzemesi' })}</Label>
                      <Select value={specForm.palletPackagingMaterialId ? String(specForm.palletPackagingMaterialId) : 'none'} disabled={!canWrite} onValueChange={(value) => setSpecForm((prev) => ({ ...prev, palletPackagingMaterialId: value === 'none' ? null : Number(value) }))}>
                        <SelectTrigger><SelectValue placeholder="Pallet" /></SelectTrigger>
                        <SelectContent><SelectItem value="none">-</SelectItem>{palletMaterials.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.materialCode} - {item.materialName}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label>{t('package.settings.unitsPerPackage', { defaultValue: 'Koli İçi' })}</Label><Input type="number" value={specForm.unitsPerPackage} disabled={!canWrite} onChange={(event) => setSpecForm((prev) => ({ ...prev, unitsPerPackage: Number(event.target.value) }))} /></div>
                    <div className="space-y-1"><Label>{t('package.settings.packagesPerPallet', { defaultValue: 'Palet Koli' })}</Label><Input type="number" value={specForm.packagesPerPallet ?? ''} disabled={!canWrite} onChange={(event) => setSpecForm((prev) => ({ ...prev, packagesPerPallet: toNumberOrNull(event.target.value) }))} /></div>
                    <div className="space-y-1"><Label>{t('package.settings.priority', { defaultValue: 'Öncelik' })}</Label><Input type="number" value={specForm.priority ?? 0} disabled={!canWrite} onChange={(event) => setSpecForm((prev) => ({ ...prev, priority: Number(event.target.value) }))} /></div>
                  </div>
                  {(['allowMixedStock', 'allowMixedYapKod', 'allowMixedSerial'] as const).map((key) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                      <Label>{key}</Label>
                      <Switch checked={Boolean(specForm[key])} disabled={!canWrite} onCheckedChange={(checked) => setSpecForm((prev) => ({ ...prev, [key]: checked }))} />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button disabled={!canWrite || saveSpecificationMutation.isPending} onClick={() => saveSpecificationMutation.mutate()}>
                      <Plus className="mr-2 size-4" />{t('common.save')}
                    </Button>
                    <Button variant="outline" onClick={() => { setSpecForm(emptySpecification); setEditingSpecId(null); }}>{t('common.cancel')}</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>{t('package.settings.specList', { defaultValue: 'Kural Listesi' })}</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Stok</TableHead><TableHead>Müşteri</TableHead><TableHead>Koli/Palet</TableHead><TableHead>Mixed</TableHead><TableHead className="text-right">{t('common.actions')}</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {specifications.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell><div className="font-medium">{item.stockCode ?? `#${item.stockId}`}</div><div className="text-xs text-muted-foreground">{item.stockName ?? '-'}</div></TableCell>
                          <TableCell>{item.customerCode ?? t('package.settings.allCustomers', { defaultValue: 'Tüm müşteriler' })}</TableCell>
                          <TableCell className="text-xs">{item.boxMaterialCode} / {item.unitsPerPackage} adet, Palet: {item.packagesPerPallet ?? '-'}</TableCell>
                          <TableCell className="text-xs">Stock {item.allowMixedStock ? 'Y' : 'N'} / Yap {item.allowMixedYapKod ? 'Y' : 'N'} / Serial {item.allowMixedSerial ? 'Y' : 'N'}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" disabled={!canWrite} onClick={() => startEditSpecification(item)}>{t('common.edit')}</Button>
                            <Button size="sm" variant="ghost" disabled={!permission.canDelete} onClick={() => deleteSpecificationMutation.mutate(item.id)}><Trash2 className="size-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
