import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PackageCheck, Save, Trash2 } from 'lucide-react';
import {
  OpsActionButton,
  OpsFieldShell,
  OpsFormPageShell,
  OpsInput,
  OpsToggleField,
  OPS_FIELD_CLASS,
  OPS_SELECT_CONTENT_CLASS,
} from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { DefinitionExcelActions } from '@/features/definition-excel';
import { cn } from '@/lib/utils';
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

const preventNumberInputWheel = (event: React.WheelEvent<HTMLInputElement>): void => {
  event.currentTarget.blur();
};

export function PackagingSettingsPage(): ReactElement {
  const { t } = useTranslation(['package', 'common']);
  const queryClient = useQueryClient();
  const permission = useCrudPermission('wms.package');
  const canWrite = permission.canCreate || permission.canUpdate;
  const [activeTab, setActiveTab] = useState<'materials' | 'specs'>('materials');
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
      <div className="wms-ops-form wms-ops-settings space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'materials' | 'specs')}>
          <div className="wms-ops-settings-toolbar flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList
              className={cn(
                'wms-ops-tabs wms-ops-step-tabs w-full max-w-md sm:w-auto',
                activeTab === 'materials' ? 'wms-ops-tabs--order' : 'wms-ops-tabs--stock',
              )}
            >
              <span className="wms-ops-tab-indicator wms-ops-step-tab-indicator" aria-hidden />
              <TabsTrigger value="materials" className="wms-ops-tab">
                {t('package.settings.materials')}
              </TabsTrigger>
              <TabsTrigger value="specs" className="wms-ops-tab">
                {t('package.settings.specs')}
              </TabsTrigger>
            </TabsList>
            {canWrite ? (
              <DefinitionExcelActions
                key={activeTab}
                definitionKey={activeTab === 'materials' ? 'package-packaging-material' : 'package-packaging-specification'}
                fileNamePrefix={activeTab === 'materials' ? 'ambalaj-malzemeleri' : 'paketleme-spesifikasyonlari'}
                variant="ops-toolbar"
                showLastJobSummary={false}
                onImportCompleted={refreshDefinitions}
              />
            ) : null}
          </div>

          <TabsContent value="materials" className="mt-6 grid gap-6 xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
            <div className="wms-ops-order-step wms-ops-settings-form p-4">
              <div>
                <h3 className="wms-ops-station__panel-title">
                  {editingMaterialId ? t('common.edit') : t('common.create')}
                </h3>
                <p className="mt-1 text-xs opacity-70">{t('package.settings.materialFormHelp')}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="wms-ops-settings-field">
                  <span className="wms-ops-station__field-label">{t('package.settings.materialCode')}</span>
                  <OpsInput
                    value={materialForm.materialCode}
                    disabled={!canWrite}
                    onChange={(event) => setMaterialForm((prev) => ({ ...prev, materialCode: event.target.value }))}
                  />
                </div>
                <div className="wms-ops-settings-field">
                  <span className="wms-ops-station__field-label">{t('package.settings.materialType')}</span>
                  <OpsFieldShell>
                    <Select
                      value={materialForm.materialType}
                      disabled={!canWrite}
                      onValueChange={(value) => setMaterialForm((prev) => ({ ...prev, materialType: value }))}
                    >
                      <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                        {['Box', 'Pallet', 'Bag', 'Custom'].map((type) => (
                          <SelectItem key={type} value={type}>
                            {materialTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </OpsFieldShell>
                </div>
              </div>
              <div className="wms-ops-settings-field">
                <span className="wms-ops-station__field-label">{t('package.settings.materialName')}</span>
                <OpsInput
                  value={materialForm.materialName}
                  disabled={!canWrite}
                  onChange={(event) => setMaterialForm((prev) => ({ ...prev, materialName: event.target.value }))}
                />
              </div>
              <div className="wms-ops-settings-metric-grid">
                <p className="wms-ops-settings-section-title wms-ops-settings-metric-grid__section">
                  {t('package.settings.dimensionsSection')}
                </p>
                {materialDimensionFieldKeys.slice(0, 3).map((field) => (
                  <div key={field.key} className="wms-ops-settings-metric-field">
                    <span className="wms-ops-station__field-label">{field.label}</span>
                    <OpsInput
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={materialForm[field.key] ?? ''}
                      disabled={!canWrite}
                      onWheel={preventNumberInputWheel}
                      onChange={(event) => setMaterialForm((prev) => ({ ...prev, [field.key]: toNumberOrNull(event.target.value) }))}
                    />
                  </div>
                ))}
                <p className="wms-ops-settings-section-title wms-ops-settings-metric-grid__section">
                  {t('package.settings.capacitySection')}
                </p>
                {materialDimensionFieldKeys.slice(3).map((field) => (
                  <div key={field.key} className="wms-ops-settings-metric-field">
                    <span className="wms-ops-station__field-label">{field.label}</span>
                    <OpsInput
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={materialForm[field.key] ?? ''}
                      disabled={!canWrite}
                      onWheel={preventNumberInputWheel}
                      onChange={(event) => setMaterialForm((prev) => ({ ...prev, [field.key]: toNumberOrNull(event.target.value) }))}
                    />
                  </div>
                ))}
              </div>
              <OpsToggleField
                checked={materialForm.isActive ?? true}
                disabled={!canWrite}
                onCheckedChange={(checked) => setMaterialForm((prev) => ({ ...prev, isActive: checked }))}
                title={t('common.active')}
                className="wms-ops-settings-toggle"
              />
              <div className="wms-ops-actions flex flex-wrap gap-2 border-t pt-4">
                <OpsActionButton
                  type="button"
                  variant="primary"
                  disabled={!canWrite || saveMaterialMutation.isPending}
                  onClick={() => saveMaterialMutation.mutate()}
                >
                  <Save className="mr-2 size-4" aria-hidden />
                  {t('common.save')}
                </OpsActionButton>
                <OpsActionButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setMaterialForm(emptyMaterial);
                    setEditingMaterialId(null);
                  }}
                >
                  {t('common.cancel')}
                </OpsActionButton>
              </div>
            </div>

            <div className="wms-ops-order-step wms-ops-settings-panel flex min-h-[18rem] flex-col overflow-hidden">
              <div className="border-b px-4 py-3">
                <h3 className="wms-ops-station__panel-title">{t('package.settings.materialList')}</h3>
              </div>
              <div className="wms-ops-transfer-detail__table-wrap flex-1 rounded-none border-0">
                <table className="wms-ops-transfer-detail__table wms-ops-settings-table">
                  <thead>
                    <tr>
                      <th>{t('package.settings.columns.code')}</th>
                      <th>{t('package.settings.columns.type')}</th>
                      <th>{t('package.settings.columns.capacity')}</th>
                      <th>{t('package.settings.columns.status')}</th>
                      <th className="wms-ops-table-actions-col">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="font-medium font-mono text-xs">{item.materialCode}</div>
                          <div className="mt-0.5 text-[0.625rem] opacity-70">{item.materialName}</div>
                        </td>
                        <td>
                          <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">
                            {materialTypeLabel(item.materialType)}
                          </Badge>
                        </td>
                        <td className="text-xs">
                          {t('package.settings.materialCapacitySummary', {
                            maxGrossWeight: item.maxGrossWeight ?? '-',
                            maxProductQuantity: item.maxProductQuantity ?? '-',
                          })}
                        </td>
                        <td>
                          {item.isActive ? (
                            <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--done mx-auto rounded-none text-[0.625rem]">
                              {t('common.active')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="wms-ops-status-badge wms-ops-status-badge--pending mx-auto rounded-none text-[0.625rem]">
                              {t('common.passive')}
                            </Badge>
                          )}
                        </td>
                        <td className="wms-ops-table-actions-col">
                          <div className="wms-ops-row-actions">
                            <OpsActionButton
                              type="button"
                              variant="secondary"
                              className="h-8 px-3 text-xs"
                              disabled={!canWrite}
                              onClick={() => startEditMaterial(item)}
                            >
                              {t('common.edit')}
                            </OpsActionButton>
                            <OpsActionButton
                              type="button"
                              variant="secondary"
                              className="h-8 px-2"
                              disabled={!permission.canDelete}
                              onClick={() => deleteMaterialMutation.mutate(item.id)}
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </OpsActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="specs" className="mt-6 grid gap-6 xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
            <div className="wms-ops-order-step wms-ops-settings-form p-4">
              <div>
                <h3 className="wms-ops-station__panel-title">
                  {editingSpecId ? t('common.edit') : t('common.create')}
                </h3>
                <p className="mt-1 text-xs opacity-70">{t('package.settings.specFormHelp')}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="wms-ops-settings-field">
                  <span className="wms-ops-station__field-label">{t('package.settings.stockId')}</span>
                  <OpsInput
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={specForm.stockId || ''}
                    disabled={!canWrite}
                    onWheel={preventNumberInputWheel}
                    onChange={(event) => setSpecForm((prev) => ({ ...prev, stockId: Number(event.target.value) }))}
                  />
                </div>
                <div className="wms-ops-settings-field">
                  <span className="wms-ops-station__field-label">{t('package.settings.customerId')}</span>
                  <OpsInput
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={specForm.customerId ?? ''}
                    disabled={!canWrite}
                    onWheel={preventNumberInputWheel}
                    onChange={(event) => setSpecForm((prev) => ({ ...prev, customerId: toNumberOrNull(event.target.value) }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="wms-ops-settings-field">
                  <span className="wms-ops-station__field-label">{t('package.settings.boxMaterial')}</span>
                  <OpsFieldShell>
                    <Select
                      value={specForm.boxPackagingMaterialId ? String(specForm.boxPackagingMaterialId) : ''}
                      disabled={!canWrite}
                      onValueChange={(value) => setSpecForm((prev) => ({ ...prev, boxPackagingMaterialId: Number(value) }))}
                    >
                      <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                        <SelectValue placeholder={t('package.settings.materialTypeOptions.box')} />
                      </SelectTrigger>
                      <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                        {boxMaterials.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.materialCode} - {item.materialName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </OpsFieldShell>
                </div>
                <div className="wms-ops-settings-field">
                  <span className="wms-ops-station__field-label">{t('package.settings.palletMaterial')}</span>
                  <OpsFieldShell>
                    <Select
                      value={specForm.palletPackagingMaterialId ? String(specForm.palletPackagingMaterialId) : 'none'}
                      disabled={!canWrite}
                      onValueChange={(value) => setSpecForm((prev) => ({ ...prev, palletPackagingMaterialId: value === 'none' ? null : Number(value) }))}
                    >
                      <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                        <SelectValue placeholder={t('package.settings.palletPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                        <SelectItem value="none">{t('package.settings.noPallet')}</SelectItem>
                        {palletMaterials.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.materialCode} - {item.materialName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </OpsFieldShell>
                </div>
              </div>
              <div className="wms-ops-settings-metric-grid">
                <div className="wms-ops-settings-metric-field">
                  <span className="wms-ops-station__field-label">{t('package.settings.unitsPerPackage')}</span>
                  <OpsInput
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={specForm.unitsPerPackage}
                    disabled={!canWrite}
                    onWheel={preventNumberInputWheel}
                    onChange={(event) => setSpecForm((prev) => ({ ...prev, unitsPerPackage: Number(event.target.value) }))}
                  />
                </div>
                <div className="wms-ops-settings-metric-field">
                  <span className="wms-ops-station__field-label">{t('package.settings.packagesPerPallet')}</span>
                  <OpsInput
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={specForm.packagesPerPallet ?? ''}
                    disabled={!canWrite}
                    onWheel={preventNumberInputWheel}
                    onChange={(event) => setSpecForm((prev) => ({ ...prev, packagesPerPallet: toNumberOrNull(event.target.value) }))}
                  />
                </div>
                <div className="wms-ops-settings-metric-field">
                  <span className="wms-ops-station__field-label">{t('package.settings.priority')}</span>
                  <OpsInput
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={specForm.priority ?? 0}
                    disabled={!canWrite}
                    onWheel={preventNumberInputWheel}
                    onChange={(event) => setSpecForm((prev) => ({ ...prev, priority: Number(event.target.value) }))}
                  />
                </div>
              </div>
              <p className="wms-ops-settings-section-title">{t('package.settings.mixedPolicySection')}</p>
              <div className="space-y-2">
                {mixedFlagRows.map((field) => (
                  <OpsToggleField
                    key={field.key}
                    checked={Boolean(specForm[field.key])}
                    disabled={!canWrite}
                    onCheckedChange={(checked) => setSpecForm((prev) => ({ ...prev, [field.key]: checked }))}
                    title={field.label}
                    className="wms-ops-settings-toggle"
                  />
                ))}
              </div>
              <OpsToggleField
                checked={specForm.isActive ?? true}
                disabled={!canWrite}
                onCheckedChange={(checked) => setSpecForm((prev) => ({ ...prev, isActive: checked }))}
                title={t('common.active')}
                className="wms-ops-settings-toggle"
              />
              <div className="wms-ops-actions flex flex-wrap gap-2 border-t pt-4">
                <OpsActionButton
                  type="button"
                  variant="primary"
                  disabled={!canWrite || saveSpecificationMutation.isPending}
                  onClick={() => saveSpecificationMutation.mutate()}
                >
                  <Save className="mr-2 size-4" aria-hidden />
                  {t('common.save')}
                </OpsActionButton>
                <OpsActionButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSpecForm(emptySpecification);
                    setEditingSpecId(null);
                  }}
                >
                  {t('common.cancel')}
                </OpsActionButton>
              </div>
            </div>

            <div className="wms-ops-order-step wms-ops-settings-panel flex min-h-[18rem] flex-col overflow-hidden">
              <div className="border-b px-4 py-3">
                <h3 className="wms-ops-station__panel-title">{t('package.settings.specList')}</h3>
              </div>
              <div className="wms-ops-transfer-detail__table-wrap flex-1 rounded-none border-0">
                <table className="wms-ops-transfer-detail__table wms-ops-settings-table">
                  <thead>
                    <tr>
                      <th>{t('package.settings.columns.stock')}</th>
                      <th>{t('package.settings.columns.customer')}</th>
                      <th>{t('package.settings.columns.carton')}</th>
                      <th>{t('package.settings.columns.mixed')}</th>
                      <th className="wms-ops-table-actions-col">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specifications.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="font-medium font-mono text-xs">{item.stockCode ?? `#${item.stockId}`}</div>
                          <div className="mt-0.5 text-[0.625rem] opacity-70">{item.stockName ?? '-'}</div>
                        </td>
                        <td>{item.customerCode ?? t('package.settings.allCustomers')}</td>
                        <td className="text-xs">
                          {t('package.settings.specMaterialSummary', {
                            boxMaterialCode: item.boxMaterialCode,
                            unitsPerPackage: item.unitsPerPackage,
                            pallet: item.packagesPerPallet ?? '-',
                          })}
                        </td>
                        <td className="text-xs">
                          {t('package.settings.specMixedSummary', {
                            stock: item.allowMixedStock ? t('common.yes') : t('common.no'),
                            yap: item.allowMixedYapKod ? t('common.yes') : t('common.no'),
                            serial: item.allowMixedSerial ? t('common.yes') : t('common.no'),
                          })}
                        </td>
                        <td className="wms-ops-table-actions-col">
                          <div className="wms-ops-row-actions">
                            <OpsActionButton
                              type="button"
                              variant="secondary"
                              className="h-8 px-3 text-xs"
                              disabled={!canWrite}
                              onClick={() => startEditSpecification(item)}
                            >
                              {t('common.edit')}
                            </OpsActionButton>
                            <OpsActionButton
                              type="button"
                              variant="secondary"
                              className="h-8 px-2"
                              disabled={!permission.canDelete}
                              onClick={() => deleteSpecificationMutation.mutate(item.id)}
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </OpsActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </OpsFormPageShell>
  );
}
