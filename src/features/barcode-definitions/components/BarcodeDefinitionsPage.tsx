import { type ReactElement, useEffect, useMemo, useState } from 'react';
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
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { useUIStore } from '@/stores/ui-store';
import { barcodeApi } from '@/services/barcode-api';
import type { BarcodeDefinition, BarcodeMatchCandidate, ResolvedBarcode, SaveBarcodeDefinitionRequest } from '@/services/barcode-types';
import { BarcodeResolutionError } from '@/services/barcode-types';

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

const moduleOptions: ModuleOption[] = [
  { value: 'goods-receipt', label: 'Mal Kabul', category: 'Giriş' },
  { value: 'transfer', label: 'Transfer', category: 'Depo Hareketi' },
  { value: 'warehouse-inbound', label: 'Ambar Giriş', category: 'Depo Hareketi' },
  { value: 'warehouse-outbound', label: 'Ambar Çıkış', category: 'Depo Hareketi' },
  { value: 'shipment', label: 'Sevkiyat', category: 'Çıkış' },
  { value: 'subcontracting-issue', label: 'Fason Çıkış', category: 'Fason' },
  { value: 'subcontracting-receipt', label: 'Fason Giriş', category: 'Fason' },
  { value: 'package', label: 'Paketleme', category: 'Paket' },
  { value: 'production-transfer', label: 'Üretim Transfer', category: 'Üretim' },
];

const patternPresets: PatternPreset[] = [
  {
    value: 'stock-only',
    label: 'Sadece stok kodu',
    requiredSegments: 'StockCode',
    segmentPattern: 'StockCode',
    hintText: 'Örnek: STK-0001',
  },
  {
    value: 'stock-yapkod',
    label: 'Stok + yapkod',
    requiredSegments: 'StockCode,YapKod',
    segmentPattern: 'StockCode///YapKod',
    hintText: 'Örnek: STK-0001///RED-L',
  },
  {
    value: 'stock-yapkod-serial',
    label: 'Stok + yapkod + seri',
    requiredSegments: 'StockCode,YapKod,SerialNumber',
    segmentPattern: 'StockCode///YapKod///SerialNumber',
    hintText: 'Örnek: STK-0001///RED-L///SN000245',
  },
  {
    value: 'stock-lot',
    label: 'Stok + lot',
    requiredSegments: 'StockCode,LotNo',
    segmentPattern: 'StockCode///LotNo',
    hintText: 'Örnek: STK-0001///LOT2026-04',
  },
  {
    value: 'package-no',
    label: 'Paket numarası',
    requiredSegments: 'PackageNo',
    segmentPattern: 'PackageNo',
    hintText: 'Örnek: PK-2026-00045',
  },
];

const emptyFormState: BarcodeDefinitionFormState = {
  moduleKey: 'goods-receipt',
  displayName: 'Mal Kabul Barkodu',
  definitionType: 'pattern',
  segmentPattern: 'StockCode',
  requiredSegments: 'StockCode',
  isActive: true,
  allowMirrorLookup: true,
  hintText: 'Örnek: STK-0001',
};

function getModuleLabel(moduleKey: string): string {
  return moduleOptions.find((item) => item.value === moduleKey)?.label ?? moduleKey;
}

function getModuleCategory(moduleKey: string): string {
  return moduleOptions.find((item) => item.value === moduleKey)?.category ?? 'Diğer';
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

  useEffect(() => {
    setPageTitle(t('barcodeManagement.title', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    if (!definitions.some((definition) => definition.moduleKey === selectedModuleKey) && definitions.length > 0) {
      setSelectedModuleKey(definitions[0].moduleKey);
    }
  }, [definitions, selectedModuleKey]);

  const selectedDefinition = useMemo(
    () => definitions.find((definition) => definition.moduleKey === selectedModuleKey) ?? null,
    [definitions, selectedModuleKey],
  );

  const selectedPreset = useMemo(
    () => patternPresets.find((item) => item.segmentPattern === formState.segmentPattern && item.requiredSegments === formState.requiredSegments)?.value ?? '',
    [formState.requiredSegments, formState.segmentPattern],
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
    const moduleLabel = getModuleLabel(selectedModuleKey);
    setEditingDefinition(null);
    setFormState({
      ...emptyFormState,
      moduleKey: selectedModuleKey,
      displayName: `${moduleLabel} Barkodu`,
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
    const moduleLabel = getModuleLabel(value);
    setFormState((current) => ({
      ...current,
      moduleKey: value,
      displayName: editingDefinition ? current.displayName : `${moduleLabel} Barkodu`,
    }));
  };

  const handleSaveDefinition = (): void => {
    if (!permission.canCreate && !permission.canUpdate) {
      toast.error('Kaydetme yetkiniz yok');
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

  return (
    <div className="crm-page space-y-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.erp', { defaultValue: 'Missing translation' }) },
          { label: t('sidebar.erpBarcodeDefinitions', { defaultValue: 'Missing translation' }), isActive: true },
        ]}
      />

      <section className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(241,245,249,0.92))] p-6 shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.88))]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t('sidebar.erp', { defaultValue: 'Missing translation' })}</Badge>
              <Badge variant="secondary">Barcode Setup</Badge>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {t('barcodeManagement.title', { defaultValue: 'Missing translation' })}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Her işlem için hangi barkod yapısının kullanılacağını, hangi alanların zorunlu olduğunu ve sistemin yedek arama yapıp yapmayacağını tanımla.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.03]">
              <CardContent className="p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">Toplam Tanım</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">{definitions.length}</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.03]">
              <CardContent className="p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">Aktif Tanım</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">{definitions.filter((item) => item.isActive).length}</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.03]">
              <CardContent className="p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">Mirror Lookup</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">{definitions.filter((item) => item.allowMirrorLookup).length}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600 dark:text-sky-300">
                  <Settings2 className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl">İşlem Bazlı Barkod Tanımları</CardTitle>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Teknik alanlar yerine işlem odaklı bak. Her kart bir WMS işlemindeki barkod davranışını temsil eder.
                  </p>
                </div>
              </div>
              <Button onClick={openCreateDialog} disabled={!permission.canCreate}>
                <Plus className="mr-2 size-4" />
                Yeni Tanım
              </Button>
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
                          : 'border-slate-200/80 bg-white/70 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 dark:text-white">{definition.displayName}</p>
                            <Badge variant="outline">{getModuleCategory(definition.moduleKey)}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{getModuleLabel(definition.moduleKey)}</p>
                        </div>
                        <Badge variant={definition.isActive ? 'default' : 'outline'}>
                          {definition.isActive ? t('common.active', { defaultValue: 'Missing translation' }) : t('common.passive', { defaultValue: 'Missing translation' })}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Barcode className="size-4" />
                          <span className="font-medium">Yapı:</span>
                          <span className="font-mono text-xs">{definition.segmentPattern || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Package2 className="size-4" />
                          <span>Zorunlu alanlar: {definition.requiredSegments || 'Yok'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Truck className="size-4" />
                          <span>{definition.allowMirrorLookup ? 'WMS mirror lookup açık' : 'WMS mirror lookup kapalı'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <CheckCircle2 className="size-4" />
                          <span>{definition.hintText || 'Kullanıcı ipucu tanımlanmadı'}</span>
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
                            {definition.id ? 'Düzenle' : 'Override Oluştur'}
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
                              Sil
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
          <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-300">
                  <Settings2 className="size-5" />
                </div>
                <div>
                  <CardTitle>Seçili Tanım Özeti</CardTitle>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Şu anda hangi işlem için nasıl barkod beklendiğini hızlıca gör.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-xs text-slate-500 dark:text-slate-400">İşlem</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-white">{selectedDefinition ? getModuleLabel(selectedDefinition.moduleKey) : '-'}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-xs text-slate-500 dark:text-slate-400">Barkod Yapısı</div>
                <div className="mt-1 font-mono text-xs text-slate-900 dark:text-white">{selectedDefinition?.segmentPattern || '-'}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-xs text-slate-500 dark:text-slate-400">Zorunlu Alanlar</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-white">{selectedDefinition?.requiredSegments || '-'}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-xs text-slate-500 dark:text-slate-400">Kullanıcı İpucu</div>
                <div className="mt-1 font-medium text-slate-900 dark:text-white">{selectedDefinition?.hintText || '-'}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-300">
                  <ScanSearch className="size-5" />
                </div>
                <div>
                  <CardTitle>Barkod Testi</CardTitle>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Tanımın çalışmasını hızlıca doğrulamak için barkodu burada çözümle.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>İşlem</Label>
                <Select value={selectedModuleKey} onValueChange={setSelectedModuleKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="İşlem seç" />
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
                <Label>Barkod</Label>
                <Input
                  value={barcodeInput}
                  onChange={(event) => setBarcodeInput(event.target.value)}
                  placeholder={selectedDefinition?.hintText || 'Test barkodunu gir'}
                />
              </div>

              <Button onClick={handleResolve} disabled={!selectedModuleKey || !barcodeInput.trim() || resolveMutation.isPending} className="w-full">
                {resolveMutation.isPending ? t('common.loading', { defaultValue: 'Missing translation' }) : 'Barkodu Test Et'}
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
                      {renderDetailRow('Pattern', resolveResult.segmentPattern)}
                    </div>
                  ) : null}

                  {resolveCandidates.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Aday Kayıtlar</p>
                      <div className="flex flex-col gap-2">
                        {resolveCandidates.map((candidate, index) => (
                          <div
                            key={`${candidate.stockCode ?? 'candidate'}-${candidate.yapKod ?? 'none'}-${index}`}
                            className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.02]"
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingDefinition
                ? (editingDefinition.id ? 'Barkod Tanımını Düzenle' : 'Tanım Override Oluştur')
                : 'Yeni Barkod Tanımı'}
            </DialogTitle>
            <DialogDescription>
              Kullanıcıya teknik parse ekranı göstermeden, işlem bazlı barkod beklentisini burada sade şekilde tanımlıyorsun.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>İşlem</Label>
              <Select value={formState.moduleKey} onValueChange={handleModuleChange} disabled={Boolean(editingDefinition)}>
                <SelectTrigger>
                  <SelectValue placeholder="İşlem seç" />
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
              <Label>Görünen Ad</Label>
              <Input
                value={formState.displayName}
                onChange={(event) => setFormState((current) => ({ ...current, displayName: event.target.value }))}
                disabled={!permission.canCreate && !permission.canUpdate}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Hazır Barkod Yapısı</Label>
              <Select value={selectedPreset || undefined} onValueChange={handlePatternPresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Hazır yapı seç" />
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
              <Label>Barkod Sırası</Label>
              <Input
                value={formState.segmentPattern}
                onChange={(event) => setFormState((current) => ({ ...current, segmentPattern: event.target.value }))}
                placeholder="StockCode///YapKod///SerialNumber"
                disabled={!permission.canCreate && !permission.canUpdate}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Zorunlu Alanlar</Label>
              <Input
                value={formState.requiredSegments}
                onChange={(event) => setFormState((current) => ({ ...current, requiredSegments: event.target.value }))}
                placeholder="StockCode,YapKod,SerialNumber"
                disabled={!permission.canCreate && !permission.canUpdate}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Kullanıcıya Gösterilecek İpucu</Label>
              <Textarea
                value={formState.hintText}
                onChange={(event) => setFormState((current) => ({ ...current, hintText: event.target.value }))}
                placeholder="Örnek: STK-0001///RED-L///SN000245"
                className="min-h-[88px]"
                disabled={!permission.canCreate && !permission.canUpdate}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 px-4 py-3 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Aktif</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pasif tanım runtime’da kullanılmaz.</p>
              </div>
              <Switch
                checked={formState.isActive}
                onCheckedChange={(checked) => setFormState((current) => ({ ...current, isActive: checked }))}
                disabled={!permission.canCreate && !permission.canUpdate}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 px-4 py-3 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">WMS Mirror Lookup</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pattern tek başına çözemezse WMS içinden yedek arama yapar.</p>
              </div>
              <Switch
                checked={formState.allowMirrorLookup}
                onCheckedChange={(checked) => setFormState((current) => ({ ...current, allowMirrorLookup: checked }))}
                disabled={!permission.canCreate && !permission.canUpdate}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel', { defaultValue: 'Missing translation' })}
            </Button>
            <Button onClick={handleSaveDefinition} disabled={saveMutation.isPending || (!permission.canCreate && !permission.canUpdate)}>
              {saveMutation.isPending ? t('common.loading', { defaultValue: 'Missing translation' }) : t('common.save', { defaultValue: 'Missing translation' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
