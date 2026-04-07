import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Barcode, CheckCircle2, Database, GitBranch, Pencil, Plus, ScanSearch, SplitSquareVertical, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useUIStore } from '@/stores/ui-store';
import { barcodeApi } from '@/services/barcode-api';
import type { BarcodeDefinition, BarcodeMatchCandidate, ResolvedBarcode, SaveBarcodeDefinitionRequest } from '@/services/barcode-types';
import { BarcodeResolutionError } from '@/services/barcode-types';

type BarcodeDefinitionFormState = SaveBarcodeDefinitionRequest;

const emptyFormState: BarcodeDefinitionFormState = {
  moduleKey: '',
  displayName: '',
  definitionType: 'pattern',
  segmentPattern: '',
  requiredSegments: 'StockCode',
  isActive: true,
  allowMirrorLookup: true,
  hintText: '',
};

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
  const [selectedModuleKey, setSelectedModuleKey] = useState<string>('');
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

  useEffect(() => {
    setPageTitle(t('barcodeManagement.title', { defaultValue: 'Barkod Tanımları' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    if (!selectedModuleKey && definitions.length > 0) {
      setSelectedModuleKey(definitions[0].moduleKey);
    }
  }, [definitions, selectedModuleKey]);

  const selectedDefinition = useMemo(
    () => definitions.find((definition) => definition.moduleKey === selectedModuleKey) ?? null,
    [definitions, selectedModuleKey],
  );

  const saveMutation = useMutation({
    mutationFn: async (payload: { id?: number; body: SaveBarcodeDefinitionRequest }) => {
      if (payload.id) {
        return await barcodeApi.updateDefinition(payload.id, payload.body);
      }
      return await barcodeApi.createDefinition(payload.body);
    },
    onSuccess: (response) => {
      toast.success(response.message || t('common.saveSuccess', { defaultValue: 'Kayıt başarıyla kaydedildi' }));
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
      toast.success(response.message || t('common.deleteSuccess', { defaultValue: 'Kayıt silindi' }));
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
    setFormState(emptyFormState);
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

  const handleSaveDefinition = (): void => {
    saveMutation.mutate({
      id: editingDefinition?.id ?? undefined,
      body: {
        ...formState,
        moduleKey: formState.moduleKey.trim(),
        displayName: formState.displayName.trim(),
        definitionType: formState.definitionType.trim() || 'pattern',
        segmentPattern: formState.segmentPattern.trim(),
        requiredSegments: formState.requiredSegments.trim(),
        hintText: formState.hintText.trim(),
      },
    });
  };

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb items={[{ label: t('sidebar.erp', { defaultValue: 'ERP' }) }, { label: t('sidebar.erpBarcodeDefinitions', { defaultValue: 'Barkod Tanımları' }), isActive: true }]} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600 dark:text-sky-300">
                  <Barcode className="size-5" />
                </div>
                <div>
                  <Badge variant="outline">{t('sidebar.erp', { defaultValue: 'ERP' })}</Badge>
                  <CardTitle className="mt-2 text-2xl">{t('barcodeManagement.title', { defaultValue: 'Barkod Tanımları' })}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t('barcodeManagement.description', { defaultValue: 'Her modül için barkodun nasıl parse edileceğini, hangi alanların zorunlu olduğunu ve mirror lookup davranışını yönetin.' })}
                  </p>
                </div>
              </div>
              <Button onClick={openCreateDialog} className="shrink-0">
                <Plus className="mr-2 size-4" />
                {t('barcodeManagement.addButton', { defaultValue: 'Yeni Tanım' })}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {definitionsQuery.isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                {t('paged.loadingDescription')}
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
                      className={`rounded-2xl border p-4 text-left transition ${isSelected ? 'border-sky-400 bg-sky-50/80 dark:border-sky-400/70 dark:bg-sky-500/10' : 'border-slate-200/80 bg-white/70 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.02]'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{definition.displayName}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{definition.moduleKey}</p>
                        </div>
                        <Badge variant={definition.isActive ? 'default' : 'outline'}>
                          {definition.isActive ? t('common.active', { defaultValue: 'Aktif' }) : t('common.passive', { defaultValue: 'Pasif' })}
                        </Badge>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <SplitSquareVertical className="size-4" />
                          <span className="font-mono text-xs">{definition.segmentPattern || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Database className="size-4" />
                          <span>{definition.source === 'database' ? t('barcodeManagement.sourceDatabase', { defaultValue: 'Veritabanı override' }) : t('barcodeManagement.sourceConfig', { defaultValue: 'Konfigürasyon fallback' })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <GitBranch className="size-4" />
                          <span>{definition.requiredSegments || t('barcodeManagement.noRequiredSegments', { defaultValue: 'Ek zorunlu alan yok' })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <CheckCircle2 className="size-4" />
                          <span>
                            {definition.allowMirrorLookup
                              ? t('barcodeManagement.erpFallbackOn', { defaultValue: 'WMS mirror lookup açık' })
                              : t('barcodeManagement.erpFallbackOff', { defaultValue: 'WMS mirror lookup kapalı' })}
                          </span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditDialog(definition);
                            }}
                          >
                            <Pencil className="mr-2 size-3.5" />
                            {definition.id ? t('common.edit', { defaultValue: 'Düzenle' }) : t('barcodeManagement.createOverride', { defaultValue: 'Override Oluştur' })}
                          </Button>
                          {definition.id ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={deleteMutation.isPending}
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteMutation.mutate(definition.id as number);
                              }}
                            >
                              <Trash2 className="mr-2 size-3.5" />
                              {t('common.delete', { defaultValue: 'Sil' })}
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

        <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-300">
                <ScanSearch className="size-5" />
              </div>
              <div>
                <CardTitle>{t('barcodeManagement.testTitle', { defaultValue: 'Resolve Testi' })}</CardTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t('barcodeManagement.testDescription', { defaultValue: 'Seçilen modül için barkodu backend resolve servisi üzerinden test edin.' })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('barcodeManagement.selectedModule', { defaultValue: 'Seçili Modül' })}</label>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                {selectedDefinition?.displayName || '-'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('barcodeManagement.barcodeInput', { defaultValue: 'Barkod' })}</label>
              <Input
                value={barcodeInput}
                onChange={(event) => setBarcodeInput(event.target.value)}
                placeholder={selectedDefinition?.hintText || t('barcodeManagement.barcodePlaceholder', { defaultValue: 'Test barkodu girin' })}
              />
            </div>

            <Button onClick={handleResolve} disabled={!selectedModuleKey || !barcodeInput.trim() || resolveMutation.isPending} className="w-full">
              {resolveMutation.isPending ? t('common.loading') : t('barcodeManagement.resolveButton', { defaultValue: 'Barkodu Test Et' })}
            </Button>

            {resolveMessage ? (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900 dark:text-white">{resolveMessage}</p>
                  <Badge variant={getReasonTone(resolveResult?.reasonCode)}>{resolveResult?.source || 'error'}</Badge>
                </div>

                {resolveResult ? (
                  <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                    {renderDetailRow('Stock', `${resolveResult.stockCode || '-'}${resolveResult.stockName ? ` - ${resolveResult.stockName}` : ''}`)}
                    {renderDetailRow('YapKod', `${resolveResult.yapKod || '-'}${resolveResult.yapAcik ? ` - ${resolveResult.yapAcik}` : ''}`)}
                    {renderDetailRow('Serial', resolveResult.serialNumber)}
                    {renderDetailRow('Quantity', resolveResult.quantity)}
                    {renderDetailRow('Unit', resolveResult.unit)}
                    {renderDetailRow('Source Warehouse', resolveResult.sourceWarehouseCode)}
                    {renderDetailRow('Target Warehouse', resolveResult.targetWarehouseCode)}
                    {renderDetailRow('Source Cell', resolveResult.sourceCellCode)}
                    {renderDetailRow('Target Cell', resolveResult.targetCellCode)}
                    {renderDetailRow('Pattern', resolveResult.segmentPattern)}
                  </div>
                ) : null}

                {resolveCandidates.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('barcodeManagement.candidatesTitle', { defaultValue: 'Aday Kayıtlar' })}
                    </p>
                    <div className="flex flex-col gap-2">
                      {resolveCandidates.map((candidate, index) => (
                        <div key={`${candidate.stockCode ?? 'candidate'}-${candidate.yapKod ?? 'none'}-${index}`} className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.02]">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDefinition
                ? (editingDefinition.id
                    ? t('barcodeManagement.editTitle', { defaultValue: 'Barkod Tanımını Düzenle' })
                    : t('barcodeManagement.overrideTitle', { defaultValue: 'Konfigürasyon Üzerine Override Oluştur' }))
                : t('barcodeManagement.createTitle', { defaultValue: 'Yeni Barkod Tanımı' })}
            </DialogTitle>
            <DialogDescription>
              {t('barcodeManagement.dialogDescription', { defaultValue: 'Bu kayıt mevcut şube için DB first barkod tanımı olarak kullanılır. Aynı module key varsa konfigürasyonun önüne geçer.' })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('barcodeManagement.moduleKey', { defaultValue: 'Module Key' })}</label>
              <Input value={formState.moduleKey} onChange={(event) => setFormState((current) => ({ ...current, moduleKey: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('barcodeManagement.displayName', { defaultValue: 'Görünen Ad' })}</label>
              <Input value={formState.displayName} onChange={(event) => setFormState((current) => ({ ...current, displayName: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('barcodeManagement.definitionType', { defaultValue: 'Tanım Tipi' })}</label>
              <Input value={formState.definitionType} onChange={(event) => setFormState((current) => ({ ...current, definitionType: event.target.value }))} placeholder="pattern" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('barcodeManagement.requiredSegments', { defaultValue: 'Zorunlu Alanlar' })}</label>
              <Input value={formState.requiredSegments} onChange={(event) => setFormState((current) => ({ ...current, requiredSegments: event.target.value }))} placeholder="StockCode,YapKod,SerialNumber" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('barcodeManagement.formatLabel', { defaultValue: 'Segment Pattern' })}</label>
              <Input value={formState.segmentPattern} onChange={(event) => setFormState((current) => ({ ...current, segmentPattern: event.target.value }))} placeholder="StockCode///YapKod///SerialNumber" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('barcodeManagement.hintLabel', { defaultValue: 'Kullanıcı İpuçları' })}</label>
              <Input value={formState.hintText} onChange={(event) => setFormState((current) => ({ ...current, hintText: event.target.value }))} placeholder="StockCode///YapKod///SerialNumber" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 px-4 py-3 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('common.active', { defaultValue: 'Aktif' })}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('barcodeManagement.activeHelp', { defaultValue: 'Pasif tanım runtime resolve tarafında kullanılmaz.' })}</p>
              </div>
              <Switch checked={formState.isActive} onCheckedChange={(checked) => setFormState((current) => ({ ...current, isActive: checked }))} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 px-4 py-3 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('barcodeManagement.erpFallbackLabel', { defaultValue: 'WMS Mirror Lookup' })}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('barcodeManagement.erpFallbackHelp', { defaultValue: 'Pattern tek başına çözemezse WMS mirror stok ve yapı kodu alanlarında arama yapar.' })}</p>
              </div>
              <Switch checked={formState.allowMirrorLookup} onCheckedChange={(checked) => setFormState((current) => ({ ...current, allowMirrorLookup: checked }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel', { defaultValue: 'İptal' })}
            </Button>
            <Button onClick={handleSaveDefinition} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t('common.loading') : t('common.save', { defaultValue: 'Kaydet' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
