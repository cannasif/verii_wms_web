import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Barcode,
  CheckCircle2,
  Package2,
  Pencil,
  Plus,
  ScanSearch,
  Settings2,
  Trash2,
  Truck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { OpsActionButton, OpsFormPageShell } from '@/components/shared';
import {
  MasterDataOpsDialogContent,
  MasterDataOpsErpEyebrow,
  MasterDataOpsStatGrid,
} from '@/features/shared';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { useUIStore } from '@/stores/ui-store';
import { barcodeApi } from '@/features/shared/api/barcode-api';
import type { BarcodeDefinition, BarcodeMatchCandidate, ResolvedBarcode, SaveBarcodeDefinitionRequest } from '@/features/shared/api/barcode-types';
import { BarcodeResolutionError } from '@/features/shared/api/barcode-types';

type BarcodeDefinitionFormState = SaveBarcodeDefinitionRequest;

interface ModuleOption {
  value: string;
  label: string;
  category: string;
}

interface PatternPreset {
  value: string;
  label: string;
  requiredSegments: string;
  segmentPattern: string;
  hintText: string;
}

const MODULE_DEFS = [
  { value: 'goods-receipt', moduleKey: 'goodsReceipt', categoryKey: 'inbound' },
  { value: 'transfer', moduleKey: 'transfer', categoryKey: 'warehouseMovement' },
  { value: 'warehouse-inbound', moduleKey: 'warehouseInbound', categoryKey: 'warehouseMovement' },
  { value: 'warehouse-outbound', moduleKey: 'warehouseOutbound', categoryKey: 'warehouseMovement' },
  { value: 'shipment', moduleKey: 'shipment', categoryKey: 'outbound' },
  { value: 'subcontracting-issue', moduleKey: 'subcontractingIssue', categoryKey: 'subcontracting' },
  { value: 'subcontracting-receipt', moduleKey: 'subcontractingReceipt', categoryKey: 'subcontracting' },
  { value: 'package', moduleKey: 'package', categoryKey: 'package' },
  { value: 'production-transfer', moduleKey: 'productionTransfer', categoryKey: 'production' },
] as const;

const PRESET_DEFS = [
  { value: 'stock-only', presetKey: 'stockOnly', requiredSegments: 'StockCode', segmentPattern: 'StockCode' },
  { value: 'stock-yapkod', presetKey: 'stockYapkod', requiredSegments: 'StockCode,YapKod', segmentPattern: 'StockCode///YapKod' },
  {
    value: 'stock-yapkod-serial',
    presetKey: 'stockYapkodSerial',
    requiredSegments: 'StockCode,YapKod,SerialNumber',
    segmentPattern: 'StockCode///YapKod///SerialNumber',
  },
  { value: 'stock-lot', presetKey: 'stockLot', requiredSegments: 'StockCode,LotNo', segmentPattern: 'StockCode///LotNo' },
  { value: 'package-no', presetKey: 'packageNo', requiredSegments: 'PackageNo', segmentPattern: 'PackageNo' },
] as const;

const emptyFormState: BarcodeDefinitionFormState = {
  moduleKey: 'goods-receipt',
  displayName: '',
  definitionType: 'pattern',
  segmentPattern: 'StockCode',
  requiredSegments: 'StockCode',
  isActive: true,
  allowMirrorLookup: true,
  hintText: '',
};

function getModuleLabel(moduleKey: string, moduleOptions: ModuleOption[]): string {
  return moduleOptions.find((item) => item.value === moduleKey)?.label ?? moduleKey;
}

function getModuleCategory(moduleKey: string, t: (key: string) => string, moduleOptions: ModuleOption[]): string {
  return moduleOptions.find((item) => item.value === moduleKey)?.category ?? t('barcodeManagement.categories.other');
}

function formatCandidate(candidate: BarcodeMatchCandidate): string {
  const stock = candidate.stockCode ?? '?';
  const name = candidate.stockName ? ` - ${candidate.stockName}` : '';
  const yap = candidate.yapKod ? ` (${candidate.yapKod})` : '';
  return `${stock}${name}${yap}`;
}

function getReasonTone(reasonCode?: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (reasonCode) {
    case 1:
    case 2:
      return 'default';
    case 7:
      return 'secondary';
    default:
      return 'outline';
  }
}

function renderDetailRow(label: string, value?: string | number | null): ReactElement {
  return (
    <div>
      <span className="font-medium">{label}:</span> {value || '-'}
    </div>
  );
}

export function BarcodeDefinitionsPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const permission = useCrudPermission('wms.barcode-management');
  const [selectedModuleKey, setSelectedModuleKey] = useState<string>('goods-receipt');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [resolveResult, setResolveResult] = useState<ResolvedBarcode | null>(null);
  const [resolveMessage, setResolveMessage] = useState<string | null>(null);
  const [resolveCandidates, setResolveCandidates] = useState<BarcodeMatchCandidate[]>([]);
  const [formState, setFormState] = useState<BarcodeDefinitionFormState>(emptyFormState);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<BarcodeDefinition | null>(null);

  const definitionsQuery = useQuery({
    queryKey: ['barcode-definitions'],
    queryFn: ({ signal }) => barcodeApi.getDefinitions({ signal }),
  });

  const definitions = definitionsQuery.data?.data ?? [];

  const moduleOptions = useMemo<ModuleOption[]>(
    () =>
      MODULE_DEFS.map((item) => ({
        value: item.value,
        label: t(`barcodeManagement.modules.${item.moduleKey}`),
        category: t(`barcodeManagement.categories.${item.categoryKey}`),
      })),
    [t],
  );

  const patternPresets = useMemo<PatternPreset[]>(
    () =>
      PRESET_DEFS.map((item) => ({
        value: item.value,
        requiredSegments: item.requiredSegments,
        segmentPattern: item.segmentPattern,
        label: t(`barcodeManagement.presets.${item.presetKey}.label`),
        hintText: t(`barcodeManagement.presets.${item.presetKey}.hint`),
      })),
    [t],
  );

  const getDisplayNameForModule = useCallback(
    (moduleKey: string): string =>
      t('barcodeManagement.displayNameSuffix', { module: getModuleLabel(moduleKey, moduleOptions) }),
    [moduleOptions, t],
  );

  useEffect(() => {
    setPageTitle(t('barcodeManagement.title', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    if (definitions.length === 0) {
      return;
    }

    setSelectedModuleKey((current) => {
      if (definitions.some((definition) => definition.moduleKey === current)) {
        return current;
      }
      return definitions[0].moduleKey;
    });
  }, [definitions]);

  const selectedDefinition = useMemo(
    () => definitions.find((definition) => definition.moduleKey === selectedModuleKey) ?? null,
    [definitions, selectedModuleKey],
  );

  const selectedPreset = useMemo(
    () => patternPresets.find((item) => item.segmentPattern === formState.segmentPattern && item.requiredSegments === formState.requiredSegments)?.value ?? '',
    [formState.requiredSegments, formState.segmentPattern, patternPresets],
  );

  const saveMutation = useMutation({
    mutationFn: async (payload: { id?: number; body: SaveBarcodeDefinitionRequest }) => {
      if (payload.id) {
        return await barcodeApi.updateDefinition(payload.id, payload.body);
      }
      return await barcodeApi.createDefinition(payload.body);
    },
    onSuccess: (response) => {
      toast.success(response.message || t('common.saveSuccess', { defaultValue: 'Missing translation' }));
      setDialogOpen(false);
      setEditingDefinition(null);
      setFormState(emptyFormState);
      void queryClient.invalidateQueries({ queryKey: ['barcode-definitions'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await barcodeApi.deleteDefinition(id),
    onSuccess: (response) => {
      toast.success(response.message || t('common.deleteSuccess', { defaultValue: 'Missing translation' }));
      void queryClient.invalidateQueries({ queryKey: ['barcode-definitions'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async () => await barcodeApi.resolve(selectedModuleKey, barcodeInput.trim()),
    onSuccess: (response) => {
      setResolveResult(response.data ?? null);
      setResolveMessage(response.message ?? null);
      setResolveCandidates(response.data?.candidates ?? []);
    },
    onError: (error: unknown) => {
      setResolveResult(null);
      if (error instanceof BarcodeResolutionError) {
        setResolveMessage(error.message);
        setResolveCandidates(error.candidates);
        return;
      }

      setResolveMessage(error instanceof Error ? error.message : t('common.error'));
      setResolveCandidates([]);
    },
  });

  const handleResolve = (): void => {
    if (!selectedModuleKey || !barcodeInput.trim()) {
      return;
    }

    setResolveResult(null);
    setResolveMessage(null);
    setResolveCandidates([]);
    resolveMutation.mutate();
  };

  const openCreateDialog = (): void => {
    setEditingDefinition(null);
    setFormState({
      ...emptyFormState,
      moduleKey: selectedModuleKey,
      displayName: getDisplayNameForModule(selectedModuleKey),
      hintText: patternPresets[0]?.hintText ?? '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (definition: BarcodeDefinition): void => {
    setEditingDefinition(definition);
    setFormState({
      moduleKey: definition.moduleKey,
      displayName: definition.displayName,
      definitionType: definition.definitionType,
      segmentPattern: definition.segmentPattern,
      requiredSegments: definition.requiredSegments,
      isActive: definition.isActive,
      allowMirrorLookup: definition.allowMirrorLookup,
      hintText: definition.hintText,
    });
    setDialogOpen(true);
  };

  const handlePatternPresetChange = (value: string): void => {
    const preset = patternPresets.find((item) => item.value === value);
    if (!preset) {
      return;
    }

    setFormState((current) => ({
      ...current,
      definitionType: 'pattern',
      requiredSegments: preset.requiredSegments,
      segmentPattern: preset.segmentPattern,
      hintText: preset.hintText,
    }));
  };

  const handleModuleChange = (value: string): void => {
    setFormState((current) => ({
      ...current,
      moduleKey: value,
      displayName: editingDefinition ? current.displayName : getDisplayNameForModule(value),
    }));
  };

  const handleSaveDefinition = (): void => {
    if (!permission.canCreate && !permission.canUpdate) {
      toast.error(t('barcodeManagement.noSavePermission'));
      return;
    }

    saveMutation.mutate({
      id: editingDefinition?.id ?? undefined,
      body: {
        ...formState,
        moduleKey: formState.moduleKey.trim(),
        displayName: formState.displayName.trim(),
        definitionType: 'pattern',
        segmentPattern: formState.segmentPattern.trim(),
        requiredSegments: formState.requiredSegments.trim(),
        hintText: formState.hintText.trim(),
      },
    });
  };

  const handleDialogOpenChange = (nextOpen: boolean): void => {
    setDialogOpen(nextOpen);
    if (!nextOpen) {
      setEditingDefinition(null);
      setFormState(emptyFormState);
    }
  };

  return (
    <OpsFormPageShell
      eyebrow={<MasterDataOpsErpEyebrow page={t('sidebar.erpBarcodeDefinitions', { defaultValue: 'Missing translation' })} />}
      title={t('barcodeManagement.title', { defaultValue: 'Missing translation' })}
      description={t('barcodeManagement.heroSubtitle')}
    >
      <div className="wms-ops-form wms-ops-erp-skin space-y-6">
      <MasterDataOpsStatGrid
        className="mb-6 md:grid-cols-3"
        items={[
          { label: t('barcodeManagement.totalDefinitions'), value: definitions.length },
          { label: t('barcodeManagement.activeDefinitions'), value: definitions.filter((item) => item.isActive).length },
          { label: t('barcodeManagement.mirrorLookupCard'), value: definitions.filter((item) => item.allowMirrorLookup).length },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/4">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600 dark:text-sky-300">
                  <Settings2 className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{t('barcodeManagement.listTitle')}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t('barcodeManagement.listDescription')}
                  </p>
                </div>
              </div>
              <OpsActionButton type="button" variant="primary" onClick={openCreateDialog} disabled={!permission.canCreate}>
                <Plus className="size-3.5" aria-hidden />
                {t('barcodeManagement.addButton')}
              </OpsActionButton>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {definitionsQuery.isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                {t('paged.loadingDescription', { defaultValue: 'Missing translation' })}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {definitions.map((definition) => {
                  const isSelected = definition.moduleKey === selectedModuleKey;
                  return (
                    <button
                      key={definition.moduleKey}
                      type="button"
                      onClick={() => setSelectedModuleKey(definition.moduleKey)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? 'border-sky-400 bg-sky-50/80 dark:border-sky-400/70 dark:bg-sky-500/10'
                          : 'border-slate-200/80 bg-white/70 hover:border-slate-300 dark:border-white/10 dark:bg-white/2'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 dark:text-white">{definition.displayName}</p>
                            <Badge variant="outline">{getModuleCategory(definition.moduleKey, t, moduleOptions)}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{getModuleLabel(definition.moduleKey, moduleOptions)}</p>
                        </div>
                        <Badge variant={definition.isActive ? 'default' : 'outline'}>
                          {definition.isActive ? t('common.active', { defaultValue: 'Missing translation' }) : t('common.passive', { defaultValue: 'Missing translation' })}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Barcode className="size-4" />
                          <span className="font-medium">{t('barcodeManagement.structureLabel')}:</span>
                          <span className="font-mono text-xs">{definition.segmentPattern || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Package2 className="size-4" />
                          <span>
                            {t('barcodeManagement.requiredFieldsLabel', {
                              value: definition.requiredSegments || t('barcodeManagement.requiredFieldsNone'),
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Truck className="size-4" />
                          <span>
                            {definition.allowMirrorLookup
                              ? t('barcodeManagement.erpFallbackOn')
                              : t('barcodeManagement.erpFallbackOff')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <CheckCircle2 className="size-4" />
                          <span>{definition.hintText || t('barcodeManagement.noHintDefined')}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!permission.canUpdate && !(permission.canCreate && !definition.id)}
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditDialog(definition);
                            }}
                          >
                            <Pencil className="mr-2 size-3.5" />
                            {definition.id ? t('common.edit') : t('barcodeManagement.createOverride')}
                          </Button>
                          {definition.id ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={deleteMutation.isPending || !permission.canDelete}
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteMutation.mutate(definition.id as number);
                              }}
                            >
                              <Trash2 className="mr-2 size-3.5" />
                              {t('barcodeManagement.delete')}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/4">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-300">
                  <Settings2 className="size-5" />
                </div>
                <div>
                  <CardTitle>{t('barcodeManagement.summaryTitle')}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t('barcodeManagement.summaryDescription')}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/3">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('barcodeManagement.operationLabel')}</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-white">
                  {selectedDefinition ? getModuleLabel(selectedDefinition.moduleKey, moduleOptions) : '-'}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/3">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('barcodeManagement.barcodeStructure')}</div>
                <div className="mt-1 font-mono text-xs text-slate-900 dark:text-white">{selectedDefinition?.segmentPattern || '-'}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/3">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('barcodeManagement.requiredSegments')}</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-white">{selectedDefinition?.requiredSegments || '-'}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/3">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('barcodeManagement.userHint')}</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-white">{selectedDefinition?.hintText || '-'}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/4">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-300">
                  <ScanSearch className="size-5" />
                </div>
                <div>
                  <CardTitle>{t('barcodeManagement.testSectionTitle')}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t('barcodeManagement.testSectionDescription')}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('barcodeManagement.operationLabel')}</Label>
                <Select value={selectedModuleKey} onValueChange={setSelectedModuleKey}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('barcodeManagement.selectOperation')} />
                  </SelectTrigger>
                  <SelectContent>
                    {moduleOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('barcodeManagement.barcodeInput')}</Label>
                <Input
                  value={barcodeInput}
                  onChange={(event) => setBarcodeInput(event.target.value)}
                  placeholder={selectedDefinition?.hintText || t('barcodeManagement.testBarcodePlaceholder')}
                />
              </div>

              <Button onClick={handleResolve} disabled={!selectedModuleKey || !barcodeInput.trim() || resolveMutation.isPending} className="w-full">
                {resolveMutation.isPending ? t('common.loading', { defaultValue: 'Missing translation' }) : t('barcodeManagement.resolveButton')}
              </Button>

              {resolveMessage ? (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-white/3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900 dark:text-white">{resolveMessage}</p>
                    <Badge variant={getReasonTone(resolveResult?.reasonCode)}>{resolveResult?.source || 'error'}</Badge>
                  </div>

                  {resolveResult ? (
                    <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                      {renderDetailRow(
                        t('barcodeManagement.resolveDetail.stock'),
                        `${resolveResult.stockCode || '-'}${resolveResult.stockName ? ` - ${resolveResult.stockName}` : ''}`,
                      )}
                      {renderDetailRow(
                        t('barcodeManagement.resolveDetail.yapKod'),
                        `${resolveResult.yapKod || '-'}${resolveResult.yapAcik ? ` - ${resolveResult.yapAcik}` : ''}`,
                      )}
                      {renderDetailRow(t('barcodeManagement.resolveDetail.serial'), resolveResult.serialNumber)}
                      {renderDetailRow(t('barcodeManagement.resolveDetail.quantity'), resolveResult.quantity)}
                      {renderDetailRow(t('barcodeManagement.resolveDetail.pattern'), resolveResult.segmentPattern)}
                    </div>
                  ) : null}

                  {resolveCandidates.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t('barcodeManagement.candidatesTitle')}
                      </p>
                      <div className="flex flex-col gap-2">
                        {resolveCandidates.map((candidate, index) => (
                          <div
                            key={`${candidate.stockCode ?? 'candidate'}-${candidate.yapKod ?? 'none'}-${index}`}
                            className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/2"
                          >
                            {formatCandidate(candidate)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <MasterDataOpsDialogContent size="xl">
          <DialogHeader className="wms-ops-detail-dialog__header border-b px-5 py-4">
            <DialogTitle className="wms-ops-pt-terminal__title">
              {editingDefinition
                ? editingDefinition.id
                  ? t('barcodeManagement.dialogEditTitle')
                  : t('barcodeManagement.dialogOverrideTitle')
                : t('barcodeManagement.dialogCreateTitle')}
            </DialogTitle>
            <DialogDescription className="wms-ops-pt-terminal__meta">{t('barcodeManagement.dialogSimpleDescription')}</DialogDescription>
          </DialogHeader>

          <div className="wms-ops-form max-h-[min(68dvh,720px)] overflow-y-auto px-5 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('barcodeManagement.operationLabel')}</Label>
              <Select value={formState.moduleKey} onValueChange={handleModuleChange} disabled={Boolean(editingDefinition)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('barcodeManagement.selectOperation')} />
                </SelectTrigger>
                <SelectContent>
                  {moduleOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('barcodeManagement.displayName')}</Label>
              <Input
                value={formState.displayName}
                onChange={(event) => setFormState((current) => ({ ...current, displayName: event.target.value }))}
                disabled={!permission.canCreate && !permission.canUpdate}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t('barcodeManagement.presetLabel')}</Label>
              <Select value={selectedPreset || undefined} onValueChange={handlePatternPresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('barcodeManagement.selectPresetPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {patternPresets.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t('barcodeManagement.barcodeOrderLabel')}</Label>
              <Input
                value={formState.segmentPattern}
                onChange={(event) => setFormState((current) => ({ ...current, segmentPattern: event.target.value }))}
                placeholder="StockCode///YapKod///SerialNumber"
                disabled={!permission.canCreate && !permission.canUpdate}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t('barcodeManagement.requiredSegments')}</Label>
              <Input
                value={formState.requiredSegments}
                onChange={(event) => setFormState((current) => ({ ...current, requiredSegments: event.target.value }))}
                placeholder="StockCode,YapKod,SerialNumber"
                disabled={!permission.canCreate && !permission.canUpdate}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t('barcodeManagement.hintLabel')}</Label>
              <Textarea
                value={formState.hintText}
                onChange={(event) => setFormState((current) => ({ ...current, hintText: event.target.value }))}
                placeholder={patternPresets[0]?.hintText ?? ''}
                className="min-h-[88px]"
                disabled={!permission.canCreate && !permission.canUpdate}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 px-4 py-3 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('common.active')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('barcodeManagement.activeHelp')}</p>
              </div>
              <Switch
                checked={formState.isActive}
                onCheckedChange={(checked) => setFormState((current) => ({ ...current, isActive: checked }))}
                disabled={!permission.canCreate && !permission.canUpdate}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 px-4 py-3 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('barcodeManagement.erpFallbackLabel')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('barcodeManagement.erpFallbackHelp')}</p>
              </div>
              <Switch
                checked={formState.allowMirrorLookup}
                onCheckedChange={(checked) => setFormState((current) => ({ ...current, allowMirrorLookup: checked }))}
                disabled={!permission.canCreate && !permission.canUpdate}
              />
            </div>
          </div>
          </div>

          <DialogFooter className="wms-ops-actions border-t px-5 py-4">
            <OpsActionButton type="button" variant="secondary" onClick={() => handleDialogOpenChange(false)}>
              {t('common.cancel', { defaultValue: 'Missing translation' })}
            </OpsActionButton>
            <OpsActionButton type="button" variant="primary" onClick={handleSaveDefinition} disabled={saveMutation.isPending || (!permission.canCreate && !permission.canUpdate)}>
              {saveMutation.isPending ? t('common.loading', { defaultValue: 'Missing translation' }) : t('common.save', { defaultValue: 'Missing translation' })}
            </OpsActionButton>
          </DialogFooter>
        </MasterDataOpsDialogContent>
      </Dialog>
    </OpsFormPageShell>
  );
}
