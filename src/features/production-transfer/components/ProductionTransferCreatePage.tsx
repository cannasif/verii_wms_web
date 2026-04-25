import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { FormPageShell } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { lookupApi } from '@/services/lookup-api';
import type { StockLookup } from '@/services/lookup-types';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
import { ShelfLookupCombobox } from '@/features/shelf-management';
import { productionTransferApi } from '../api/production-transfer-api';
import {
  createEmptyProductionTransferDraft,
  createEmptyProductionTransferLineDraft,
  type ProductionOrderLookup,
  type ProductionTransferDraft,
} from '../types/production-transfer';
import { ProductionTransferSuggestPanel } from './ProductionTransferSuggestPanel';
import type { Warehouse } from '@/features/goods-receipt/types/goods-receipt';

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
  const [sourceWarehouseLookupOpen, setSourceWarehouseLookupOpen] = useState(false);
  const [targetWarehouseLookupOpen, setTargetWarehouseLookupOpen] = useState(false);
  const [selectedSourceWarehouseLabel, setSelectedSourceWarehouseLabel] = useState('');
  const [selectedTargetWarehouseLabel, setSelectedTargetWarehouseLabel] = useState('');
  const [productionOrderLookupOpen, setProductionOrderLookupOpen] = useState(false);
  const [activeLineOrderLookupId, setActiveLineOrderLookupId] = useState<string | null>(null);
  const [activeLineStockLookupId, setActiveLineStockLookupId] = useState<string | null>(null);
  const [selectedProductionOrderLabel, setSelectedProductionOrderLabel] = useState('');
  const [lineOrderLabels, setLineOrderLabels] = useState<Record<string, string>>({});
  const [lineStockLabels, setLineStockLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    setPageTitle(
      isEditMode
        ? t('productionTransfer.create.editTitle', { defaultValue: 'Missing translation' })
        : isCloneMode
          ? t('productionTransfer.create.cloneTitle', { defaultValue: 'Missing translation' })
          : t('productionTransfer.create.title', { defaultValue: 'Missing translation' }),
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
            stockId: line.stockId ?? undefined,
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

  const getProductionOrderLabel = (item: ProductionOrderLookup): string => (
    `${item.orderNo} · ${item.producedStockCode}${item.producedYapKod ? ` / ${item.producedYapKod}` : ''}`
  );

  const createMutation = useMutation({
    mutationFn: () => (isEditMode ? productionTransferApi.updateProductionTransfer(editId, draft) : productionTransferApi.createProductionTransfer(draft)),
    onSuccess: () => {
      toast.success(
        isEditMode
          ? t('productionTransfer.create.updateSuccess', { defaultValue: 'Missing translation' })
          : isCloneMode
            ? t('productionTransfer.create.cloneSuccess', { defaultValue: 'Missing translation' })
            : t('productionTransfer.create.success', { defaultValue: 'Missing translation' }),
      );
      navigate('/production-transfer/list');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('productionTransfer.create.error', { defaultValue: 'Missing translation' }));
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
      stockId: undefined,
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
  const transferPurposeLabel = (value: (typeof transferPurposes)[number]): string =>
    ({
      MaterialSupply: t('productionTransfer.create.guide.materialSupply', { defaultValue: 'Missing translation' }),
      SemiFinishedMove: t('productionTransfer.create.guide.semiFinishedMove', { defaultValue: 'Missing translation' }),
      FinishedGoodsPutaway: t('productionTransfer.create.guide.outputMove', { defaultValue: 'Missing translation' }),
      ScrapMove: t('productionTransfer.create.guide.scrapMove', { defaultValue: 'Missing translation' }),
      ReturnToStock: t('productionTransfer.create.guide.returnToStock', { defaultValue: 'Missing translation' }),
    })[value];
  const lineRoleLabel = (value: (typeof lineRoles)[number]): string =>
    ({
      ConsumptionSupply: t('productionTransfer.create.lineRoleConsumption', { defaultValue: 'Missing translation' }),
      SemiFinishedMove: t('productionTransfer.create.lineRoleSemiFinished', { defaultValue: 'Missing translation' }),
      OutputMove: t('productionTransfer.create.lineRoleOutput', { defaultValue: 'Missing translation' }),
    })[value];

  return (
    <FormPageShell
      title={
        isEditMode
          ? t('productionTransfer.create.editTitle', { defaultValue: 'Missing translation' })
          : isCloneMode
            ? t('productionTransfer.create.cloneTitle', { defaultValue: 'Missing translation' })
            : t('productionTransfer.create.title', { defaultValue: 'Missing translation' })
      }
      description={
        isEditMode
          ? t('productionTransfer.create.editSubtitle', { defaultValue: 'Missing translation' })
          : isCloneMode
            ? t('productionTransfer.create.cloneSubtitle', { defaultValue: 'Missing translation' })
            : t('productionTransfer.create.subtitle', { defaultValue: 'Missing translation' })
      }
      isLoading={detailQuery.isLoading}
      isError={detailQuery.isError}
      errorTitle={t('common.error')}
      errorDescription={detailQuery.error instanceof Error ? detailQuery.error.message : t('productionTransfer.create.error', { defaultValue: 'Missing translation' })}
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
                    stockId: line.stockId ?? undefined,
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
            {createMutation.isPending ? t('common.saving') : isEditMode ? t('common.update', { defaultValue: 'Missing translation' }) : isCloneMode ? t('common.save', { defaultValue: 'Missing translation' }) : t('common.save')}
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
            title={t('productionTransfer.create.editModeTitle', { defaultValue: 'Missing translation' })}
            body={t('productionTransfer.create.editModeBody', { defaultValue: 'Missing translation' })}
          />
        ) : null}
        {isCloneMode ? (
          <InfoCallout
            title={t('productionTransfer.create.cloneModeTitle', { defaultValue: 'Missing translation' })}
            body={t('productionTransfer.create.cloneModeBody', { defaultValue: 'Missing translation' })}
          />
        ) : null}
        <InfoCallout
          title={t('productionTransfer.create.info.overviewTitle', { defaultValue: 'Missing translation' })}
          body={t('productionTransfer.create.info.overviewBody', { defaultValue: 'Missing translation' })}
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
              <CardDescription>{t('productionTransfer.create.summary.purpose', { defaultValue: 'Missing translation' })}</CardDescription>
              <CardTitle className="text-2xl">{draft.transferPurpose}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="gap-3 bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.10),_transparent_55%)]">
            <CardHeader>
              <CardDescription>{t('productionTransfer.create.summary.lines', { defaultValue: 'Missing translation' })}</CardDescription>
              <CardTitle className="text-2xl">{summary.lineCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="gap-3 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_55%)]">
            <CardHeader>
              <CardDescription>{t('productionTransfer.create.summary.quantity', { defaultValue: 'Missing translation' })}</CardDescription>
              <CardTitle className="text-2xl">{summary.totalQuantity}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>{t('productionTransfer.create.header.title', { defaultValue: 'Missing translation' })}</CardTitle>
              <CardDescription>{t('productionTransfer.create.header.subtitle', { defaultValue: 'Missing translation' })}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-3">
                <InfoCallout
                  title={t('productionTransfer.create.info.linkTitle', { defaultValue: 'Missing translation' })}
                  body={t('productionTransfer.create.info.linkBody', { defaultValue: 'Missing translation' })}
                />
              </div>
              <div className="space-y-2"><Label>{t('common.documentNo')}</Label><Input value={draft.documentNo} onChange={(e) => setDraft((prev) => ({ ...prev, documentNo: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{t('common.documentDate', { defaultValue: 'Missing translation' })}</Label><Input type="date" value={draft.documentDate} onChange={(e) => setDraft((prev) => ({ ...prev, documentDate: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>{t('productionTransfer.create.purpose', { defaultValue: 'Missing translation' })}</Label>
                <Select value={draft.transferPurpose} onValueChange={(value) => setDraft((prev) => ({ ...prev, transferPurpose: value as ProductionTransferDraft['transferPurpose'] }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{transferPurposes.map((value) => <SelectItem key={value} value={value}>{transferPurposeLabel(value)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{t('productionTransfer.create.productionDocument', { defaultValue: 'Missing translation' })}</Label><Input value={draft.productionDocumentNo} onChange={(e) => setDraft((prev) => ({ ...prev, productionDocumentNo: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>{t('productionTransfer.create.productionOrder', { defaultValue: 'Missing translation' })}</Label>
                <PagedLookupDialog<ProductionOrderLookup>
                  open={productionOrderLookupOpen}
                  onOpenChange={setProductionOrderLookupOpen}
                  title={t('productionTransfer.create.productionOrder', { defaultValue: 'Missing translation' })}
                  description={t('productionTransfer.create.productionOrderSelect', { defaultValue: 'Missing translation' })}
                  value={selectedProductionOrderLabel || draft.productionOrderNo}
                  placeholder={t('productionTransfer.create.productionOrderSelect', { defaultValue: 'Missing translation' })}
                  searchPlaceholder={t('productionTransfer.create.productionOrderSearch', { defaultValue: 'Missing translation' })}
                  emptyText={t('productionTransfer.create.productionOrderEmpty', { defaultValue: 'Missing translation' })}
                  queryKey={['production-transfer', 'production-order-lookup']}
                  fetchPage={({ pageNumber, pageSize, search, signal }) =>
                    productionTransferApi.getProductionOrderLookupPaged({ pageNumber, pageSize, search }, { signal })
                  }
                  getKey={(item) => item.id.toString()}
                  getLabel={getProductionOrderLabel}
                  onSelect={(item) => {
                    setDraft((prev) => ({ ...prev, productionOrderNo: item.orderNo }));
                    setSelectedProductionOrderLabel(getProductionOrderLabel(item));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('production.create.sourceWarehouse', { defaultValue: 'Missing translation' })}</Label>
                <PagedLookupDialog<Warehouse>
                  open={sourceWarehouseLookupOpen}
                  onOpenChange={setSourceWarehouseLookupOpen}
                  title={t('production.create.sourceWarehouse', { defaultValue: 'Missing translation' })}
                  description={t('production.create.sourceWarehouseSelect', { defaultValue: 'Missing translation' })}
                  value={selectedSourceWarehouseLabel || draft.sourceWarehouseCode}
                  placeholder={t('production.create.sourceWarehouseSelect', { defaultValue: 'Missing translation' })}
                  searchPlaceholder={t('production.create.warehouseSearch', { defaultValue: 'Missing translation' })}
                  emptyText={t('production.create.warehouseEmpty', { defaultValue: 'Missing translation' })}
                  queryKey={['production-transfer', 'source-warehouse']}
                  fetchPage={({ pageNumber, pageSize, search, signal }: {
                    pageNumber: number;
                    pageSize: number;
                    search: string;
                    signal?: AbortSignal;
                  }) =>
                    lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                  }
                  getKey={(warehouse: Warehouse) => warehouse.id.toString()}
                  getLabel={(warehouse: Warehouse) => `${warehouse.depoKodu} - ${warehouse.depoIsmi}`}
                  onSelect={(warehouse: Warehouse) => {
                    setDraft((prev) => ({ ...prev, sourceWarehouseCode: String(warehouse.depoKodu) }));
                    setSelectedSourceWarehouseLabel(`${warehouse.depoKodu} - ${warehouse.depoIsmi}`);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('production.create.targetWarehouse', { defaultValue: 'Missing translation' })}</Label>
                <PagedLookupDialog<Warehouse>
                  open={targetWarehouseLookupOpen}
                  onOpenChange={setTargetWarehouseLookupOpen}
                  title={t('production.create.targetWarehouse', { defaultValue: 'Missing translation' })}
                  description={t('production.create.targetWarehouseSelect', { defaultValue: 'Missing translation' })}
                  value={selectedTargetWarehouseLabel || draft.targetWarehouseCode}
                  placeholder={t('production.create.targetWarehouseSelect', { defaultValue: 'Missing translation' })}
                  searchPlaceholder={t('production.create.warehouseSearch', { defaultValue: 'Missing translation' })}
                  emptyText={t('production.create.warehouseEmpty', { defaultValue: 'Missing translation' })}
                  queryKey={['production-transfer', 'target-warehouse']}
                  fetchPage={({ pageNumber, pageSize, search, signal }: {
                    pageNumber: number;
                    pageSize: number;
                    search: string;
                    signal?: AbortSignal;
                  }) =>
                    lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                  }
                  getKey={(warehouse: Warehouse) => warehouse.id.toString()}
                  getLabel={(warehouse: Warehouse) => `${warehouse.depoKodu} - ${warehouse.depoIsmi}`}
                  onSelect={(warehouse: Warehouse) => {
                    setDraft((prev) => ({ ...prev, targetWarehouseCode: String(warehouse.depoKodu) }));
                    setSelectedTargetWarehouseLabel(`${warehouse.depoKodu} - ${warehouse.depoIsmi}`);
                  }}
                />
              </div>
              <div className="space-y-2 md:col-span-3"><Label>{t('common.description')}</Label><Textarea rows={3} value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('productionTransfer.create.guide.title', { defaultValue: 'Missing translation' })}</CardTitle>
              <CardDescription>{t('productionTransfer.create.guide.subtitle', { defaultValue: 'Missing translation' })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-xl border border-slate-200/70 p-4 dark:border-white/10">
                <div className="font-medium text-slate-900 dark:text-slate-100">{t('productionTransfer.create.guide.materialSupply', { defaultValue: 'Missing translation' })}</div>
                <div className="mt-1">{t('productionTransfer.create.guide.materialSupplyBody', { defaultValue: 'Missing translation' })}</div>
              </div>
              <div className="rounded-xl border border-slate-200/70 p-4 dark:border-white/10">
                <div className="font-medium text-slate-900 dark:text-slate-100">{t('productionTransfer.create.guide.semiFinishedMove', { defaultValue: 'Missing translation' })}</div>
                <div className="mt-1">{t('productionTransfer.create.guide.semiFinishedMoveBody', { defaultValue: 'Missing translation' })}</div>
              </div>
              <div className="rounded-xl border border-slate-200/70 p-4 dark:border-white/10">
                <div className="font-medium text-slate-900 dark:text-slate-100">{t('productionTransfer.create.guide.outputMove', { defaultValue: 'Missing translation' })}</div>
                <div className="mt-1">{t('productionTransfer.create.guide.outputMoveBody', { defaultValue: 'Missing translation' })}</div>
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
                <CardTitle>{t('productionTransfer.create.lines.title', { defaultValue: 'Missing translation' })}</CardTitle>
                <CardDescription>{t('productionTransfer.create.lines.subtitle', { defaultValue: 'Missing translation' })}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => suggestionMutation.mutate()}
                  disabled={suggestionMutation.isPending || (!draft.productionDocumentNo && !draft.productionOrderNo)}
                >
                  {suggestionMutation.isPending
                    ? t('common.loading', { defaultValue: 'Missing translation' })
                    : t('productionTransfer.create.lines.fetchSuggestions', { defaultValue: 'Missing translation' })}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDraft((prev) => ({ ...prev, lines: [...prev.lines, createEmptyProductionTransferLineDraft()] }))}>{t('common.add', { defaultValue: 'Missing translation' })}</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <InfoCallout
                title={t('productionTransfer.create.info.linesTitle', { defaultValue: 'Missing translation' })}
                body={t('productionTransfer.create.info.linesBody', { defaultValue: 'Missing translation' })}
              />
            </div>
            <div className="space-y-4">
              {draft.lines.map((line, index) => (
                <Card key={line.localId} className="border-slate-200/70 dark:border-white/10">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{t('productionTransfer.create.lineCardTitle', { defaultValue: 'Missing translation', index: index + 1 })}</CardTitle>
                        <CardDescription>
                          {line.productionOrderNo
                            ? t('productionTransfer.create.lineCardHintLinked', { defaultValue: 'Missing translation', orderNo: line.productionOrderNo })
                            : t('productionTransfer.create.lineCardHint', { defaultValue: 'Missing translation' })}
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
                        <Label>{t('productionTransfer.create.productionOrder', { defaultValue: 'Missing translation' })}</Label>
                        <PagedLookupDialog<ProductionOrderLookup>
                          open={activeLineOrderLookupId === line.localId}
                          onOpenChange={(open) => setActiveLineOrderLookupId(open ? line.localId : null)}
                          title={t('productionTransfer.create.productionOrder', { defaultValue: 'Missing translation' })}
                          description={t('productionTransfer.create.lineCardTitle', { defaultValue: 'Missing translation', index: index + 1 })}
                          value={lineOrderLabels[line.localId] || line.productionOrderNo}
                          placeholder={t('productionTransfer.create.productionOrderSelect', { defaultValue: 'Missing translation' })}
                          searchPlaceholder={t('productionTransfer.create.productionOrderSearch', { defaultValue: 'Missing translation' })}
                          emptyText={t('productionTransfer.create.productionOrderEmpty', { defaultValue: 'Missing translation' })}
                          queryKey={['production-transfer', 'line-production-order-lookup', line.localId]}
                          fetchPage={({ pageNumber, pageSize, search, signal }) =>
                            productionTransferApi.getProductionOrderLookupPaged({ pageNumber, pageSize, search }, { signal })
                          }
                          getKey={(item) => item.id.toString()}
                          getLabel={getProductionOrderLabel}
                          onSelect={(item) => {
                            setDraft((prev) => ({
                              ...prev,
                              lines: prev.lines.map((current) =>
                                current.localId === line.localId
                                  ? {
                                      ...current,
                                      productionOrderNo: item.orderNo,
                                      stockId: current.productionOrderNo === item.orderNo ? current.stockId : undefined,
                                      stockCode: current.productionOrderNo === item.orderNo ? current.stockCode : '',
                                    }
                                  : current),
                            }));
                            setLineOrderLabels((prev) => ({ ...prev, [line.localId]: getProductionOrderLabel(item) }));
                            if (line.productionOrderNo !== item.orderNo) {
                              setLineStockLabels((prev) => ({ ...prev, [line.localId]: '' }));
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('productionTransfer.create.lineRole', { defaultValue: 'Missing translation' })}</Label>
                        <Select value={line.lineRole} onValueChange={(value) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, lineRole: value as typeof lineRoles[number] } : current) }))}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>{lineRoles.map((value) => <SelectItem key={value} value={value}>{lineRoleLabel(value)}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('production.create.producedStockCode', { defaultValue: 'Missing translation' })}</Label>
                        <PagedLookupDialog<StockLookup>
                          open={activeLineStockLookupId === line.localId}
                          onOpenChange={(open) => setActiveLineStockLookupId(open ? line.localId : null)}
                          title={t('production.create.producedStockCode', { defaultValue: 'Missing translation' })}
                          description={line.productionOrderNo || t('productionTransfer.create.lineCardHint', { defaultValue: 'Missing translation' })}
                          value={lineStockLabels[line.localId] || line.stockCode}
                          placeholder={t('productionTransfer.create.stockSelect', { defaultValue: 'Missing translation' })}
                          searchPlaceholder={t('productionTransfer.create.stockSearch', { defaultValue: 'Missing translation' })}
                          emptyText={t('productionTransfer.create.stockEmpty', { defaultValue: 'Missing translation' })}
                          queryKey={['production-transfer', 'line-stock-lookup', line.localId, line.productionOrderNo || 'all']}
                          fetchPage={({ pageNumber, pageSize, search, signal }) =>
                            lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })
                          }
                          getKey={(item) => item.id.toString()}
                          getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                          onSelect={(item) => {
                            setDraft((prev) => ({
                              ...prev,
                              lines: prev.lines.map((current) =>
                                current.localId === line.localId ? { ...current, stockId: item.id, stockCode: item.stokKodu } : current),
                            }));
                            setLineStockLabels((prev) => ({ ...prev, [line.localId]: `${item.stokKodu} - ${item.stokAdi}` }));
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('production.create.plannedQuantity', { defaultValue: 'Missing translation' })}</Label>
                        <Input type="number" min="0" step="0.001" value={line.quantity} onChange={(e) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, quantity: Number(e.target.value) || 0 } : current) }))} />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t('productionTransfer.create.sourceCell', { defaultValue: 'Missing translation' })}</Label>
                        <ShelfLookupCombobox
                          warehouseCode={draft.sourceWarehouseCode}
                          value={line.sourceCellCode}
                          onValueChange={(value) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, sourceCellCode: value } : current) }))}
                          placeholder={t('productionTransfer.create.sourceCell', { defaultValue: 'Missing translation' })}
                          searchPlaceholder={t('productionTransfer.create.cellSearch', { defaultValue: 'Missing translation' })}
                          emptyText={t('productionTransfer.create.sourceCellEmpty', { defaultValue: 'Missing translation' })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('productionTransfer.create.targetCell', { defaultValue: 'Missing translation' })}</Label>
                        <ShelfLookupCombobox
                          warehouseCode={draft.targetWarehouseCode}
                          value={line.targetCellCode}
                          onValueChange={(value) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, targetCellCode: value } : current) }))}
                          placeholder={t('productionTransfer.create.targetCell', { defaultValue: 'Missing translation' })}
                          searchPlaceholder={t('productionTransfer.create.cellSearch', { defaultValue: 'Missing translation' })}
                          emptyText={t('productionTransfer.create.targetCellEmpty', { defaultValue: 'Missing translation' })}
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
          <Badge variant="secondary">{t('productionTransfer.create.review.header', { defaultValue: 'Missing translation' })}: {draft.productionDocumentNo || '-'}</Badge>
          <Badge variant="secondary">{t('productionTransfer.create.review.order', { defaultValue: 'Missing translation' })}: {draft.productionOrderNo || '-'}</Badge>
          <Badge variant="secondary">{t('productionTransfer.create.review.purpose', { defaultValue: 'Missing translation' })}: {transferPurposeLabel(draft.transferPurpose)}</Badge>
        </div>
      </div>
    </FormPageShell>
  );
}
