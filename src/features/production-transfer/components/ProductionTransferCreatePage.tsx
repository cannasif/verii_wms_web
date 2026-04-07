import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { FormPageShell } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { lookupApi } from '@/services/lookup-api';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
import { productionTransferApi } from '../api/production-transfer-api';
import { createEmptyProductionTransferDraft, createEmptyProductionTransferLineDraft, type ProductionTransferDraft } from '../types/production-transfer';
import { ProductionTransferSuggestPanel } from './ProductionTransferSuggestPanel';

const transferPurposes = ['MaterialSupply', 'SemiFinishedMove', 'FinishedGoodsPutaway', 'ScrapMove', 'ReturnToStock'] as const;
const lineRoles = ['ConsumptionSupply', 'SemiFinishedMove', 'OutputMove'] as const;

function InfoCallout({ title, body }: { title: string; body: string }): ReactElement {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
      <div className="mt-0.5 rounded-full bg-slate-900/5 p-2 text-slate-600 dark:bg-white/10 dark:text-slate-200">
        <Info className="h-4 w-4" />
      </div>
      <div>
        <div className="font-medium text-slate-900 dark:text-slate-100">{title}</div>
        <div className="mt-1 leading-6">{body}</div>
      </div>
    </div>
  );
}

export function ProductionTransferCreatePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setPageTitle } = useUIStore();
  const permissionAccess = usePermissionAccess();
  const editId = Number(searchParams.get('editId') ?? '');
  const cloneId = Number(searchParams.get('cloneId') ?? '');
  const isEditMode = Number.isFinite(editId) && editId > 0;
  const isCloneMode = !isEditMode && Number.isFinite(cloneId) && cloneId > 0;
  const canCreateTransfer = permissionAccess.can('wms.production-transfer.create');
  const canUpdateTransfer = permissionAccess.can('wms.production-transfer.update');
  const canSaveTransfer = isEditMode ? canUpdateTransfer : canCreateTransfer;
  const [draft, setDraft] = useState<ProductionTransferDraft>(() => createEmptyProductionTransferDraft());
  const [suggestedLines, setSuggestedLines] = useState<Awaited<ReturnType<typeof productionTransferApi.getSuggestedLines>>>([]);
  const [applyMode, setApplyMode] = useState<'append' | 'replace'>('append');
  const warehousesQuery = useQuery({
    queryKey: ['production-transfer-warehouses'],
    queryFn: () => lookupApi.getWarehouses(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setPageTitle(
      isEditMode
        ? t('productionTransfer.create.editTitle', { defaultValue: 'Uretim Transfer Emrini Duzenle' })
        : isCloneMode
          ? t('productionTransfer.create.cloneTitle', { defaultValue: 'Uretim Transfer Emrini Kopyala' })
          : t('productionTransfer.create.title', { defaultValue: 'Uretim Transfer Emri Olustur' }),
    );
    return () => setPageTitle(null);
  }, [isCloneMode, isEditMode, setPageTitle, t]);

  const detailId = isEditMode ? editId : isCloneMode ? cloneId : null;
  const detailQuery = useQuery({
    queryKey: ['production-transfer-detail', detailId],
    queryFn: () => productionTransferApi.getProductionTransferDetail(detailId as number),
    enabled: detailId != null,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    const productionDocumentNo = searchParams.get('productionDocumentNo');
    const productionOrderNo = searchParams.get('productionOrderNo');
    if ((!productionDocumentNo && !productionOrderNo) || detailQuery.data) {
      return;
    }

    setDraft((prev) => ({
      ...prev,
      productionDocumentNo: prev.productionDocumentNo || productionDocumentNo || '',
      productionOrderNo: prev.productionOrderNo || productionOrderNo || '',
    }));
  }, [detailQuery.data, searchParams]);

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    setDraft({
      documentNo: isCloneMode ? '' : detailQuery.data.documentNo,
      documentDate: detailQuery.data.documentDate ? detailQuery.data.documentDate.split('T')[0] : new Date().toISOString().split('T')[0],
      transferPurpose: detailQuery.data.transferPurpose,
      productionDocumentNo: detailQuery.data.productionDocumentNo ?? '',
      productionOrderNo: detailQuery.data.productionOrderNo ?? '',
      sourceWarehouseCode: detailQuery.data.sourceWarehouseCode ?? '',
      targetWarehouseCode: detailQuery.data.targetWarehouseCode ?? '',
      description: detailQuery.data.description ?? '',
      lines: detailQuery.data.lines.length > 0
        ? detailQuery.data.lines.map((line, index) => ({
            localId: `${isCloneMode ? 'pt-clone' : 'pt-edit'}-line-${line.id}-${index}`,
            stockCode: line.stockCode,
            yapKod: line.yapKod ?? '',
            quantity: line.quantity,
            lineRole: line.lineRole,
            sourceCellCode: line.sourceCellCode ?? '',
            targetCellCode: line.targetCellCode ?? '',
            productionOrderNo: line.productionOrderNo ?? '',
          }))
        : [createEmptyProductionTransferLineDraft()],
    });
  }, [detailQuery.data, isCloneMode]);

  const createMutation = useMutation({
    mutationFn: () => (isEditMode ? productionTransferApi.updateProductionTransfer(editId, draft) : productionTransferApi.createProductionTransfer(draft)),
    onSuccess: () => {
      toast.success(
        isEditMode
          ? t('productionTransfer.create.updateSuccess', { defaultValue: 'Uretim transfer emri guncellendi' })
          : isCloneMode
            ? t('productionTransfer.create.cloneSuccess', { defaultValue: 'Uretim transfer emri kopyalanarak kaydedildi' })
            : t('productionTransfer.create.success', { defaultValue: 'Uretim transfer emri kaydedildi' }),
      );
      navigate('/production-transfer/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('productionTransfer.create.error', { defaultValue: 'Uretim transfer emri kaydedilemedi' }));
    },
  });

  const suggestionMutation = useMutation({
    mutationFn: () =>
      productionTransferApi.getSuggestedLines({
        productionDocumentNo: draft.productionDocumentNo || undefined,
        productionOrderNo: draft.productionOrderNo || undefined,
        transferPurpose: draft.transferPurpose,
      }),
    onSuccess: (lines) => {
      setSuggestedLines(lines);
      if (lines.length === 0) {
        toast.message(t('productionTransfer.create.suggestions.empty'));
        return;
      }
      toast.success(t('productionTransfer.create.suggestions.success'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('productionTransfer.create.suggestions.error'));
    },
  });

  const removeLine = (localId: string): void => {
    setDraft((prev) => ({ ...prev, lines: prev.lines.filter((line) => line.localId !== localId) }));
  };

  const applySuggestedLines = (linesToApply: typeof suggestedLines): void => {
    if (linesToApply.length === 0) {
      return;
    }

    const mappedLines = linesToApply.map((line) => ({
      ...createEmptyProductionTransferLineDraft(),
      stockCode: line.stockCode,
      yapKod: line.yapKod ?? '',
      quantity: line.quantity,
      lineRole: line.lineRole,
      sourceCellCode: line.sourceCellCode ?? '',
      targetCellCode: line.targetCellCode ?? '',
      productionOrderNo: line.productionOrderNo,
    }));

    setDraft((prev) => ({
      ...prev,
      lines:
        applyMode === 'replace'
          ? mappedLines
          : [
              ...prev.lines.filter((line) =>
                line.stockCode.trim() !== ''
                || line.productionOrderNo.trim() !== ''
                || line.sourceCellCode.trim() !== ''
                || line.targetCellCode.trim() !== ''),
              ...mappedLines,
            ],
      sourceWarehouseCode: prev.sourceWarehouseCode || linesToApply[0]?.sourceWarehouseCode || '',
      targetWarehouseCode: prev.targetWarehouseCode || linesToApply[0]?.targetWarehouseCode || '',
    }));

    toast.success(t(applyMode === 'replace' ? 'productionTransfer.create.suggestions.appliedReplace' : 'productionTransfer.create.suggestions.appliedAppend'));
  };

  const summary = useMemo(
    () => ({
      lineCount: draft.lines.length,
      totalQuantity: draft.lines.reduce((total, line) => total + (line.quantity || 0), 0),
    }),
    [draft.lines],
  );
  const warehouseOptions = useMemo<ComboboxOption[]>(
    () =>
      (warehousesQuery.data ?? []).map((item) => ({
        value: String(item.depoKodu),
        label: `${item.depoKodu} - ${item.depoIsmi}`,
      })),
    [warehousesQuery.data],
  );
  const transferPurposeLabel = (value: (typeof transferPurposes)[number]): string =>
    ({
      MaterialSupply: t('productionTransfer.create.guide.materialSupply', { defaultValue: 'Malzeme Besleme' }),
      SemiFinishedMove: t('productionTransfer.create.guide.semiFinishedMove', { defaultValue: 'Yari Mamul Tasima' }),
      FinishedGoodsPutaway: t('productionTransfer.create.guide.outputMove', { defaultValue: 'Mamul Depoya Cikis' }),
      ScrapMove: t('productionTransfer.create.guide.scrapMove', { defaultValue: 'Fire Tasima' }),
      ReturnToStock: t('productionTransfer.create.guide.returnToStock', { defaultValue: 'Stoga Iade' }),
    })[value];
  const lineRoleLabel = (value: (typeof lineRoles)[number]): string =>
    ({
      ConsumptionSupply: t('productionTransfer.create.lineRoleConsumption', { defaultValue: 'Tuketimi Besle' }),
      SemiFinishedMove: t('productionTransfer.create.lineRoleSemiFinished', { defaultValue: 'Ara Mamul Tasi' }),
      OutputMove: t('productionTransfer.create.lineRoleOutput', { defaultValue: 'Ciktiyi Tasi' }),
    })[value];

  const productionOrderOptions = useMemo<ComboboxOption[]>(() => {
    const values = new Set<string>();
    const options: ComboboxOption[] = [];

    for (const line of suggestedLines) {
      if (!line.productionOrderNo || values.has(line.productionOrderNo)) {
        continue;
      }
      values.add(line.productionOrderNo);
      options.push({ value: line.productionOrderNo, label: line.productionOrderNo });
    }

    if (draft.productionOrderNo && !values.has(draft.productionOrderNo)) {
      options.unshift({ value: draft.productionOrderNo, label: draft.productionOrderNo });
    }

    return options;
  }, [draft.productionOrderNo, suggestedLines]);

  const stockOptionsByOrder = useMemo(() => {
    const map = new Map<string, ComboboxOption[]>();

    for (const line of suggestedLines) {
      const key = line.productionOrderNo || '__all__';
      const current = map.get(key) ?? [];
      if (!current.some((option) => option.value === line.stockCode)) {
        current.push({
          value: line.stockCode,
          label: `${line.stockCode}${line.yapKod ? ` / ${line.yapKod}` : ''}`,
        });
      }
      map.set(key, current);
    }

    return map;
  }, [suggestedLines]);
  const cellOptionsByOrderAndStock = useMemo(() => {
    const sourceMap = new Map<string, ComboboxOption[]>();
    const targetMap = new Map<string, ComboboxOption[]>();

    for (const line of suggestedLines) {
      const key = `${line.productionOrderNo || '__all__'}::${line.stockCode || '__all__'}`;

      const sourceCurrent = sourceMap.get(key) ?? [];
      const sourceCell = line.sourceCellCode?.trim();
      if (sourceCell && !sourceCurrent.some((option) => option.value === sourceCell)) {
        sourceCurrent.push({ value: sourceCell, label: sourceCell });
      }
      sourceMap.set(key, sourceCurrent);

      const targetCurrent = targetMap.get(key) ?? [];
      const targetCell = line.targetCellCode?.trim();
      if (targetCell && !targetCurrent.some((option) => option.value === targetCell)) {
        targetCurrent.push({ value: targetCell, label: targetCell });
      }
      targetMap.set(key, targetCurrent);
    }

    return { sourceMap, targetMap };
  }, [suggestedLines]);

  return (
    <FormPageShell
      title={
        isEditMode
          ? t('productionTransfer.create.editTitle', { defaultValue: 'Uretim Transfer Emrini Duzenle' })
          : isCloneMode
            ? t('productionTransfer.create.cloneTitle', { defaultValue: 'Uretim Transfer Emrini Kopyala' })
            : t('productionTransfer.create.title', { defaultValue: 'Uretim Transfer Emri Olustur' })
      }
      description={
        isEditMode
          ? t('productionTransfer.create.editSubtitle', { defaultValue: 'Tamamlanmamis ve henüz islenmemis transfer emirlerini burada guncelleyebilirsiniz.' })
          : isCloneMode
            ? t('productionTransfer.create.cloneSubtitle', { defaultValue: 'Var olan transfer emrini baz alip yeni bir transfer emri olusturuyorsunuz.' })
            : t('productionTransfer.create.subtitle', { defaultValue: 'Uretim planina bagli hammadde besleme, yari mamul tasima veya mamul cikis akislarini tanimlayin.' })
      }
      isLoading={detailQuery.isLoading}
      isError={detailQuery.isError}
      errorTitle={t('common.error')}
      errorDescription={detailQuery.error instanceof Error ? detailQuery.error.message : t('productionTransfer.create.error', { defaultValue: 'Uretim transfer detayi yuklenemedi' })}
      actions={(
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/production-transfer/list')}>{t('common.cancel')}</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDraft(detailQuery.data ? {
              documentNo: isCloneMode ? '' : detailQuery.data.documentNo,
              documentDate: detailQuery.data.documentDate ? detailQuery.data.documentDate.split('T')[0] : new Date().toISOString().split('T')[0],
              transferPurpose: detailQuery.data.transferPurpose,
              productionDocumentNo: detailQuery.data.productionDocumentNo ?? '',
              productionOrderNo: detailQuery.data.productionOrderNo ?? '',
              sourceWarehouseCode: detailQuery.data.sourceWarehouseCode ?? '',
              targetWarehouseCode: detailQuery.data.targetWarehouseCode ?? '',
              description: detailQuery.data.description ?? '',
              lines: detailQuery.data.lines.length > 0
                ? detailQuery.data.lines.map((line, index) => ({
                    localId: `${isCloneMode ? 'pt-clone' : 'pt-edit'}-line-${line.id}-${index}`,
                    stockCode: line.stockCode,
                    yapKod: line.yapKod ?? '',
                    quantity: line.quantity,
                    lineRole: line.lineRole,
                    sourceCellCode: line.sourceCellCode ?? '',
                    targetCellCode: line.targetCellCode ?? '',
                    productionOrderNo: line.productionOrderNo ?? '',
                  }))
                : [createEmptyProductionTransferLineDraft()],
            } : createEmptyProductionTransferDraft())}
          >
            {t('common.clear')}
          </Button>
          <Button type="button" onClick={() => createMutation.mutate()} disabled={!canSaveTransfer || createMutation.isPending}>
            {createMutation.isPending ? t('common.saving') : isEditMode ? t('common.update', { defaultValue: 'Guncelle' }) : isCloneMode ? t('common.save', { defaultValue: 'Kaydet' }) : t('common.save')}
          </Button>
        </div>
      )}
    >
      <div className="space-y-6">
        {!canSaveTransfer ? (
          <InfoCallout
            title={t('productionTransfer.create.permissionInfoTitle')}
            body={isEditMode ? t('productionTransfer.create.permissionInfoUpdate') : t('productionTransfer.create.permissionInfoCreate')}
          />
        ) : null}
        {isEditMode ? (
          <InfoCallout
            title={t('productionTransfer.create.editModeTitle', { defaultValue: 'Kayit guncelleme modu' })}
            body={t('productionTransfer.create.editModeBody', { defaultValue: 'Bu transfer daha once kaydedildi. Burada yaptiginiz degisiklikler mevcut transfer emrini gunceller; yeni bir kopya olusturmaz.' })}
          />
        ) : null}
        {isCloneMode ? (
          <InfoCallout
            title={t('productionTransfer.create.cloneModeTitle', { defaultValue: 'Kopya olusturma modu' })}
            body={t('productionTransfer.create.cloneModeBody', { defaultValue: 'Bu ekran mevcut transfer emrini baz alir. Belge no yeni olmalidir; kaydettiginizde yeni bir transfer emri olustururuz.' })}
          />
        ) : null}
        <InfoCallout
          title={t('productionTransfer.create.info.overviewTitle', { defaultValue: 'Bu ekran ne yapiyor?' })}
          body={t('productionTransfer.create.info.overviewBody', { defaultValue: 'Bu ekran, uretim planindaki bir asamaya malzeme beslemek, ara mamulu sonraki istasyona tasimak veya tamamlanan urunu mamul depoya almak icin transfer emri olusturur. Oneri paneli, secili plan veya emrin ihtiyacindan otomatik satir uretir.' })}
        />
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-slate-200/70 dark:border-white/10">
            <CardHeader className="gap-1">
              <CardDescription>{t('productionTransfer.create.steps.connect.eyebrow')}</CardDescription>
              <CardTitle className="text-lg">{t('productionTransfer.create.steps.connect.title')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-slate-500 dark:text-slate-400">
              {t('productionTransfer.create.steps.connect.body')}
            </CardContent>
          </Card>
          <Card className="border-slate-200/70 dark:border-white/10">
            <CardHeader className="gap-1">
              <CardDescription>{t('productionTransfer.create.steps.purpose.eyebrow')}</CardDescription>
              <CardTitle className="text-lg">{t('productionTransfer.create.steps.purpose.title')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-slate-500 dark:text-slate-400">
              {t('productionTransfer.create.steps.purpose.body')}
            </CardContent>
          </Card>
          <Card className="border-slate-200/70 dark:border-white/10">
            <CardHeader className="gap-1">
              <CardDescription>{t('productionTransfer.create.steps.lines.eyebrow')}</CardDescription>
              <CardTitle className="text-lg">{t('productionTransfer.create.steps.lines.title')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-slate-500 dark:text-slate-400">
              {t('productionTransfer.create.steps.lines.body')}
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="gap-3 bg-[radial-gradient(circle_at_top_left,_rgba(2,132,199,0.12),_transparent_55%)]">
            <CardHeader>
              <CardDescription>{t('productionTransfer.create.summary.purpose', { defaultValue: 'Transfer Amaci' })}</CardDescription>
              <CardTitle className="text-2xl">{draft.transferPurpose}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="gap-3 bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.10),_transparent_55%)]">
            <CardHeader>
              <CardDescription>{t('productionTransfer.create.summary.lines', { defaultValue: 'Kalem' })}</CardDescription>
              <CardTitle className="text-2xl">{summary.lineCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="gap-3 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_55%)]">
            <CardHeader>
              <CardDescription>{t('productionTransfer.create.summary.quantity', { defaultValue: 'Toplam Miktar' })}</CardDescription>
              <CardTitle className="text-2xl">{summary.totalQuantity}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>{t('productionTransfer.create.header.title', { defaultValue: 'Transfer Ust Bilgisi' })}</CardTitle>
              <CardDescription>{t('productionTransfer.create.header.subtitle', { defaultValue: 'Transferin hangi uretim plani veya emri icin acildigini belirtin.' })}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-3">
                <InfoCallout
                  title={t('productionTransfer.create.info.linkTitle', { defaultValue: 'Uretim baglantisi neden onemli?' })}
                  body={t('productionTransfer.create.info.linkBody', { defaultValue: 'Plan veya emir baglantisi kuruldugunda sistem, bu transferin hangi uretim ihtiyacini karşıladığını bilir. Boylece hangi tuketim satirinin beslendigi veya hangi ciktinin tasindigi izlenebilir olur.' })}
                />
              </div>
              <div className="space-y-2"><Label>{t('common.documentNo')}</Label><Input value={draft.documentNo} onChange={(e) => setDraft((prev) => ({ ...prev, documentNo: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{t('common.documentDate', { defaultValue: 'Belge Tarihi' })}</Label><Input type="date" value={draft.documentDate} onChange={(e) => setDraft((prev) => ({ ...prev, documentDate: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>{t('productionTransfer.create.purpose', { defaultValue: 'Transfer Amaci' })}</Label>
                <Select value={draft.transferPurpose} onValueChange={(value) => setDraft((prev) => ({ ...prev, transferPurpose: value as ProductionTransferDraft['transferPurpose'] }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{transferPurposes.map((value) => <SelectItem key={value} value={value}>{transferPurposeLabel(value)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{t('productionTransfer.create.productionDocument', { defaultValue: 'Uretim Plani No' })}</Label><Input value={draft.productionDocumentNo} onChange={(e) => setDraft((prev) => ({ ...prev, productionDocumentNo: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>{t('productionTransfer.create.productionOrder', { defaultValue: 'Uretim Emri No' })}</Label>
                <Combobox
                  options={productionOrderOptions}
                  value={draft.productionOrderNo}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, productionOrderNo: value }))}
                  placeholder={t('productionTransfer.create.productionOrderSelect', { defaultValue: 'Bagli emri secin' })}
                  searchPlaceholder={t('productionTransfer.create.productionOrderSearch', { defaultValue: 'Uretim emirlerinde ara' })}
                  emptyText={t('productionTransfer.create.productionOrderEmpty', { defaultValue: 'Once onerileri getirerek emir listesini olusturun' })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('production.create.sourceWarehouse', { defaultValue: 'Kaynak Depo' })}</Label>
                <Combobox
                  options={warehouseOptions}
                  value={draft.sourceWarehouseCode}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, sourceWarehouseCode: value }))}
                  placeholder={t('production.create.sourceWarehouseSelect', { defaultValue: 'Kaynak depo secin' })}
                  searchPlaceholder={t('production.create.warehouseSearch', { defaultValue: 'Depolarda ara' })}
                  emptyText={t('production.create.warehouseEmpty', { defaultValue: 'Depo bulunamadi' })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('production.create.targetWarehouse', { defaultValue: 'Hedef Depo' })}</Label>
                <Combobox
                  options={warehouseOptions}
                  value={draft.targetWarehouseCode}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, targetWarehouseCode: value }))}
                  placeholder={t('production.create.targetWarehouseSelect', { defaultValue: 'Hedef depo secin' })}
                  searchPlaceholder={t('production.create.warehouseSearch', { defaultValue: 'Depolarda ara' })}
                  emptyText={t('production.create.warehouseEmpty', { defaultValue: 'Depo bulunamadi' })}
                />
              </div>
              <div className="space-y-2 md:col-span-3"><Label>{t('common.description')}</Label><Textarea rows={3} value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('productionTransfer.create.guide.title', { defaultValue: 'Transfer Rehberi' })}</CardTitle>
              <CardDescription>{t('productionTransfer.create.guide.subtitle', { defaultValue: 'Bu ekran PT tarafinda hangi rol ile neden acildigini netlestirir.' })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-xl border border-slate-200/70 p-4 dark:border-white/10">
                <div className="font-medium text-slate-900 dark:text-slate-100">{t('productionTransfer.create.guide.materialSupply', { defaultValue: 'Malzeme Besleme' })}</div>
                <div className="mt-1">{t('productionTransfer.create.guide.materialSupplyBody', { defaultValue: 'Uretim tuketimi icin gerekli hammaddeleri besleme alanina cekmek icin kullanilir.' })}</div>
              </div>
              <div className="rounded-xl border border-slate-200/70 p-4 dark:border-white/10">
                <div className="font-medium text-slate-900 dark:text-slate-100">{t('productionTransfer.create.guide.semiFinishedMove', { defaultValue: 'Yari Mamul Tasima' })}</div>
                <div className="mt-1">{t('productionTransfer.create.guide.semiFinishedMoveBody', { defaultValue: 'Bir emrin ciktisini sonraki emrin tuketimine veya istasyonuna tasir.' })}</div>
              </div>
              <div className="rounded-xl border border-slate-200/70 p-4 dark:border-white/10">
                <div className="font-medium text-slate-900 dark:text-slate-100">{t('productionTransfer.create.guide.outputMove', { defaultValue: 'Mamul Depoya Cikis' })}</div>
                <div className="mt-1">{t('productionTransfer.create.guide.outputMoveBody', { defaultValue: 'Tamamlanan urunun uretimden mamul depoya cikisini yonetir.' })}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <ProductionTransferSuggestPanel
          lines={suggestedLines}
          isLoading={suggestionMutation.isPending}
          applyMode={applyMode}
          onApplyModeChange={setApplyMode}
          onApplySelected={applySuggestedLines}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{t('productionTransfer.create.lines.title', { defaultValue: 'Transfer Kalemleri' })}</CardTitle>
                <CardDescription>{t('productionTransfer.create.lines.subtitle', { defaultValue: 'Uretim tuketimlerini besleyen veya ciktisini tasiyan satirlari tanimlayin.' })}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => suggestionMutation.mutate()}
                  disabled={suggestionMutation.isPending || (!draft.productionDocumentNo && !draft.productionOrderNo)}
                >
                  {suggestionMutation.isPending
                    ? t('common.loading', { defaultValue: 'Yukleniyor' })
                    : t('productionTransfer.create.lines.fetchSuggestions', { defaultValue: 'Ihtiyactan Oneri Getir' })}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDraft((prev) => ({ ...prev, lines: [...prev.lines, createEmptyProductionTransferLineDraft()] }))}>{t('common.add', { defaultValue: 'Kalem Ekle' })}</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <InfoCallout
                title={t('productionTransfer.create.info.linesTitle', { defaultValue: 'Kalemleri nasil kullanmaliyim?' })}
                body={t('productionTransfer.create.info.linesBody', { defaultValue: 'Once onerileri getirerek sistemin uretim ihtiyacindan tavsiye uretmesini saglayin. Sonra gerekli satirlari secip mevcut taslaga ekleyin veya degistirin. Bu ekran planlamaciya malzeme besleme ve ara istasyon hareketlerini kontrollu kurdurmak icin tasarlandi.' })}
              />
            </div>
            <div className="space-y-4">
              {draft.lines.map((line, index) => (
                <Card key={line.localId} className="border-slate-200/70 dark:border-white/10">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{t('productionTransfer.create.lineCardTitle', { defaultValue: 'Transfer Kalemi {{index}}', index: index + 1 })}</CardTitle>
                        <CardDescription>
                          {line.productionOrderNo
                            ? t('productionTransfer.create.lineCardHintLinked', { defaultValue: 'Bu kalem {{orderNo}} emrine bagli ihtiyaci tasir.', orderNo: line.productionOrderNo })
                            : t('productionTransfer.create.lineCardHint', { defaultValue: 'Bu kalemin neyi, nereye ve hangi amacla tasiyacagini secin.' })}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{lineRoleLabel(line.lineRole)}</Badge>
                        <Button type="button" variant="ghost" onClick={() => removeLine(line.localId)}>{t('common.delete')}</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>{t('productionTransfer.create.productionOrder', { defaultValue: 'Uretim Emri' })}</Label>
                        <Combobox
                          options={productionOrderOptions}
                          value={line.productionOrderNo}
                          onValueChange={(value) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, productionOrderNo: value, stockCode: current.productionOrderNo === value ? current.stockCode : '' } : current) }))}
                          placeholder={t('productionTransfer.create.productionOrderSelect', { defaultValue: 'Emir secin' })}
                          searchPlaceholder={t('productionTransfer.create.productionOrderSearch', { defaultValue: 'Uretim emirlerinde ara' })}
                          emptyText={t('productionTransfer.create.productionOrderEmpty', { defaultValue: 'Once onerileri getirerek emir listesini olusturun' })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('productionTransfer.create.lineRole', { defaultValue: 'Bu kalem ne yapiyor?' })}</Label>
                        <Select value={line.lineRole} onValueChange={(value) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, lineRole: value as typeof lineRoles[number] } : current) }))}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>{lineRoles.map((value) => <SelectItem key={value} value={value}>{lineRoleLabel(value)}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('production.create.producedStockCode', { defaultValue: 'Stok' })}</Label>
                        <Combobox
                          options={stockOptionsByOrder.get(line.productionOrderNo || '__all__') ?? Array.from(stockOptionsByOrder.values()).flat()}
                          value={line.stockCode}
                          onValueChange={(value) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, stockCode: value } : current) }))}
                          placeholder={t('productionTransfer.create.stockSelect', { defaultValue: 'Stok secin' })}
                          searchPlaceholder={t('productionTransfer.create.stockSearch', { defaultValue: 'Transfer stoklarinda ara' })}
                          emptyText={t('productionTransfer.create.stockEmpty', { defaultValue: 'Bu emre bagli onerili stok bulunmuyor' })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('production.create.plannedQuantity', { defaultValue: 'Miktar' })}</Label>
                        <Input type="number" min="0" step="0.001" value={line.quantity} onChange={(e) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, quantity: Number(e.target.value) || 0 } : current) }))} />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t('productionTransfer.create.sourceCell', { defaultValue: 'Kaynak Hucre' })}</Label>
                        <Combobox
                          options={
                            cellOptionsByOrderAndStock.sourceMap.get(`${line.productionOrderNo || '__all__'}::${line.stockCode || '__all__'}`)
                            ?? cellOptionsByOrderAndStock.sourceMap.get(`${line.productionOrderNo || '__all__'}::__all__`)
                            ?? []
                          }
                          value={line.sourceCellCode}
                          onValueChange={(value) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, sourceCellCode: value } : current) }))}
                          placeholder={t('productionTransfer.create.sourceCell', { defaultValue: 'Kaynak Hucre secin' })}
                          searchPlaceholder={t('productionTransfer.create.cellSearch', { defaultValue: 'Hucrelerde ara' })}
                          emptyText={t('productionTransfer.create.sourceCellEmpty', { defaultValue: 'Bu secim icin kaynak hucre onerisi yok' })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('productionTransfer.create.targetCell', { defaultValue: 'Hedef Hucre' })}</Label>
                        <Combobox
                          options={
                            cellOptionsByOrderAndStock.targetMap.get(`${line.productionOrderNo || '__all__'}::${line.stockCode || '__all__'}`)
                            ?? cellOptionsByOrderAndStock.targetMap.get(`${line.productionOrderNo || '__all__'}::__all__`)
                            ?? []
                          }
                          value={line.targetCellCode}
                          onValueChange={(value) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, targetCellCode: value } : current) }))}
                          placeholder={t('productionTransfer.create.targetCell', { defaultValue: 'Hedef Hucre secin' })}
                          searchPlaceholder={t('productionTransfer.create.cellSearch', { defaultValue: 'Hucrelerde ara' })}
                          emptyText={t('productionTransfer.create.targetCellEmpty', { defaultValue: 'Bu secim icin hedef hucre onerisi yok' })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{t('productionTransfer.create.review.header', { defaultValue: 'Plan No' })}: {draft.productionDocumentNo || '-'}</Badge>
          <Badge variant="secondary">{t('productionTransfer.create.review.order', { defaultValue: 'Emir No' })}: {draft.productionOrderNo || '-'}</Badge>
          <Badge variant="secondary">{t('productionTransfer.create.review.purpose', { defaultValue: 'Amac' })}: {transferPurposeLabel(draft.transferPurpose)}</Badge>
        </div>
      </div>
    </FormPageShell>
  );
}
