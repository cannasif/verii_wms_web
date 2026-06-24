import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PackageCheck, Plus, Save, Trash2 } from 'lucide-react';
import { OpsFormPageShell } from '@/components/shared';
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
import { DefinitionExcelActions } from '@/features/definition-excel';
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
  const { t } = useTranslation(['package', 'common']);
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
  const materialDimensionFieldKeys = useMemo(
    () => [
      { key: 'standardLength', label: t('package.settings.fields.standardLength') },
      { key: 'standardWidth', label: t('package.settings.fields.standardWidth') },
      { key: 'standardHeight', label: t('package.settings.fields.standardHeight') },
      { key: 'maxVolume', label: t('package.settings.fields.maxVolume') },
      { key: 'maxGrossWeight', label: t('package.settings.fields.maxGrossWeight') },
      { key: 'maxProductQuantity', label: t('package.settings.fields.maxProductQuantity') },
    ] as const,
    [t],
  );
  const materialTypeLabel = (type: string): string => {
    const key = `package.settings.materialTypeOptions.${type.toLowerCase()}`;
    const translated = t(key);
    return translated === key ? type : translated;
  };
  const mixedFlagRows = useMemo(
    () => [
      { key: 'allowMixedStock', label: t('package.settings.fields.allowMixedStock') },
      { key: 'allowMixedYapKod', label: t('package.settings.fields.allowMixedYapKod') },
      { key: 'allowMixedSerial', label: t('package.settings.fields.allowMixedSerial') },
    ] as const,
    [t],
  );

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
      toast.success(t('package.settings.materialSaved'));
      setMaterialForm(emptyMaterial);
      setEditingMaterialId(null);
      await refreshDefinitions();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (id: number) => packageApi.deletePackagingMaterial(id),
    onSuccess: async () => {
      toast.success(t('package.settings.materialDeleted'));
      await refreshDefinitions();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const saveSpecificationMutation = useMutation({
    mutationFn: () => editingSpecId
      ? packageApi.updatePackagingSpecification(editingSpecId, specForm)
      : packageApi.createPackagingSpecification(specForm),
    onSuccess: async () => {
      toast.success(t('package.settings.specSaved'));
      setSpecForm(emptySpecification);
      setEditingSpecId(null);
      await refreshDefinitions();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.error')),
  });

  const deleteSpecificationMutation = useMutation({
    mutationFn: (id: number) => packageApi.deletePackagingSpecification(id),
    onSuccess: async () => {
      toast.success(t('package.settings.specDeleted'));
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
    <OpsFormPageShell
      eyebrow={
        <>
          <span>{t('package.create.breadcrumb.parent')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('package.create.breadcrumb.module')}</span>
        </>
      }
      title={t('package.settings.title')}
      description={t('package.settings.subtitle')}
      actions={<PackageCheck className="size-5 opacity-80" aria-hidden />}
    >
      {!permission.canMutate ? <PermissionNotice /> : null}
      <div className="wms-ops-form space-y-6">
      <Card className="overflow-hidden border-slate-200/80">
        <CardHeader className="bg-gradient-to-r from-slate-950 to-slate-700 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <PackageCheck className="size-7" />
                <CardTitle>{t('package.settings.title')}</CardTitle>
              </div>
              <CardDescription className="text-slate-200">
                {t('package.settings.description')}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <DefinitionExcelActions
                definitionKey="package-packaging-material"
                fileNamePrefix="ambalaj-malzemeleri"
                onImportCompleted={refreshDefinitions}
              />
              <DefinitionExcelActions
                definitionKey="package-packaging-specification"
                fileNamePrefix="paketleme-spesifikasyonlari"
                onImportCompleted={refreshDefinitions}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="materials">
            <TabsList>
              <TabsTrigger value="materials">{t('package.settings.materials')}</TabsTrigger>
              <TabsTrigger value="specs">{t('package.settings.specs')}</TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>{editingMaterialId ? t('common.edit') : t('common.create')}</CardTitle>
                  <CardDescription>{t('package.settings.materialFormHelp')}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>{t('package.settings.materialCode')}</Label>
                      <Input value={materialForm.materialCode} disabled={!canWrite} onChange={(event) => setMaterialForm((prev) => ({ ...prev, materialCode: event.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>{t('package.settings.materialType')}</Label>
                      <Select value={materialForm.materialType} disabled={!canWrite} onValueChange={(value) => setMaterialForm((prev) => ({ ...prev, materialType: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Box', 'Pallet', 'Bag', 'Custom'].map((type) => <SelectItem key={type} value={type}>{materialTypeLabel(type)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>{t('package.settings.materialName')}</Label>
                    <Input value={materialForm.materialName} disabled={!canWrite} onChange={(event) => setMaterialForm((prev) => ({ ...prev, materialName: event.target.value }))} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {materialDimensionFieldKeys.slice(0, 3).map((field) => (
                      <div key={field.key} className="space-y-1">
                        <Label>{field.label}</Label>
                        <Input
                          type="number"
                          value={materialForm[field.key] ?? ''}
                          disabled={!canWrite}
                          onChange={(event) => setMaterialForm((prev) => ({ ...prev, [field.key]: toNumberOrNull(event.target.value) }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {materialDimensionFieldKeys.slice(3).map((field) => (
                      <div key={field.key} className="space-y-1">
                        <Label>{field.label}</Label>
                        <Input
                          type="number"
                          value={materialForm[field.key] ?? ''}
                          disabled={!canWrite}
                          onChange={(event) => setMaterialForm((prev) => ({ ...prev, [field.key]: toNumberOrNull(event.target.value) }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label>{t('common.active')}</Label>
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
                <CardHeader><CardTitle>{t('package.settings.materialList')}</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>{t('package.settings.columns.code')}</TableHead><TableHead>{t('package.settings.columns.type')}</TableHead><TableHead>{t('package.settings.columns.capacity')}</TableHead><TableHead>{t('package.settings.columns.status')}</TableHead><TableHead className="text-right">{t('common.actions')}</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {materials.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell><div className="font-medium">{item.materialCode}</div><div className="text-xs text-muted-foreground">{item.materialName}</div></TableCell>
                          <TableCell><Badge variant="outline">{materialTypeLabel(item.materialType)}</Badge></TableCell>
                          <TableCell className="text-xs">
                            {t('package.settings.materialCapacitySummary', {
                              maxGrossWeight: item.maxGrossWeight ?? '-',
                              maxProductQuantity: item.maxProductQuantity ?? '-',
                            })}
                          </TableCell>
                          <TableCell>{item.isActive ? <Badge>{t('common.active')}</Badge> : <Badge variant="secondary">{t('common.passive')}</Badge>}</TableCell>
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
                  <CardDescription>{t('package.settings.specFormHelp')}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>{t('package.settings.stockId')}</Label>
                      <Input type="number" value={specForm.stockId || ''} disabled={!canWrite} onChange={(event) => setSpecForm((prev) => ({ ...prev, stockId: Number(event.target.value) }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>{t('package.settings.customerId')}</Label>
                      <Input type="number" value={specForm.customerId ?? ''} disabled={!canWrite} onChange={(event) => setSpecForm((prev) => ({ ...prev, customerId: toNumberOrNull(event.target.value) }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>{t('package.settings.boxMaterial')}</Label>
                      <Select value={specForm.boxPackagingMaterialId ? String(specForm.boxPackagingMaterialId) : ''} disabled={!canWrite} onValueChange={(value) => setSpecForm((prev) => ({ ...prev, boxPackagingMaterialId: Number(value) }))}>
                        <SelectTrigger><SelectValue placeholder={t('package.settings.materialTypeOptions.box')} /></SelectTrigger>
                        <SelectContent>{boxMaterials.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.materialCode} - {item.materialName}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>{t('package.settings.palletMaterial')}</Label>
                      <Select value={specForm.palletPackagingMaterialId ? String(specForm.palletPackagingMaterialId) : 'none'} disabled={!canWrite} onValueChange={(value) => setSpecForm((prev) => ({ ...prev, palletPackagingMaterialId: value === 'none' ? null : Number(value) }))}>
                        <SelectTrigger><SelectValue placeholder={t('package.settings.palletPlaceholder')} /></SelectTrigger>
                        <SelectContent><SelectItem value="none">{t('package.settings.noPallet')}</SelectItem>{palletMaterials.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.materialCode} - {item.materialName}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label>{t('package.settings.unitsPerPackage')}</Label><Input type="number" value={specForm.unitsPerPackage} disabled={!canWrite} onChange={(event) => setSpecForm((prev) => ({ ...prev, unitsPerPackage: Number(event.target.value) }))} /></div>
                    <div className="space-y-1"><Label>{t('package.settings.packagesPerPallet')}</Label><Input type="number" value={specForm.packagesPerPallet ?? ''} disabled={!canWrite} onChange={(event) => setSpecForm((prev) => ({ ...prev, packagesPerPallet: toNumberOrNull(event.target.value) }))} /></div>
                    <div className="space-y-1"><Label>{t('package.settings.priority')}</Label><Input type="number" value={specForm.priority ?? 0} disabled={!canWrite} onChange={(event) => setSpecForm((prev) => ({ ...prev, priority: Number(event.target.value) }))} /></div>
                  </div>
                  {mixedFlagRows.map((field) => (
                    <div key={field.key} className="flex items-center justify-between rounded-lg border p-3">
                      <Label>{field.label}</Label>
                      <Switch checked={Boolean(specForm[field.key])} disabled={!canWrite} onCheckedChange={(checked) => setSpecForm((prev) => ({ ...prev, [field.key]: checked }))} />
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
                <CardHeader><CardTitle>{t('package.settings.specList')}</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>{t('package.settings.columns.stock')}</TableHead><TableHead>{t('package.settings.columns.customer')}</TableHead><TableHead>{t('package.settings.columns.carton')}</TableHead><TableHead>{t('package.settings.columns.mixed')}</TableHead><TableHead className="text-right">{t('common.actions')}</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {specifications.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell><div className="font-medium">{item.stockCode ?? `#${item.stockId}`}</div><div className="text-xs text-muted-foreground">{item.stockName ?? '-'}</div></TableCell>
                          <TableCell>{item.customerCode ?? t('package.settings.allCustomers')}</TableCell>
                          <TableCell className="text-xs">
                            {t('package.settings.specMaterialSummary', {
                              boxMaterialCode: item.boxMaterialCode,
                              unitsPerPackage: item.unitsPerPackage,
                              pallet: item.packagesPerPallet ?? '-',
                            })}
                          </TableCell>
                          <TableCell className="text-xs">
                            {t('package.settings.specMixedSummary', {
                              stock: item.allowMixedStock ? t('common.yes') : t('common.no'),
                              yap: item.allowMixedYapKod ? t('common.yes') : t('common.no'),
                              serial: item.allowMixedSerial ? t('common.yes') : t('common.no'),
                            })}
                          </TableCell>
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
    </OpsFormPageShell>
  );
}
