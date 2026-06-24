import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import {
  OpsActionButton,
  OpsFieldShell,
  OpsFormPageShell,
  OpsInput,
  OpsTextarea,
  PageState,
} from '@/components/shared';
import { OPS_FIELD_CLASS, OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { StockLookup } from '@/features/shared/api/lookup-types';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { ShelfLookupCombobox } from '@/features/shelf-management';
import { productionTransferApi } from '../api/production-transfer-api';
import {
  createEmptyProductionTransferDraft,
  createEmptyProductionTransferLineDraft,
  type ProductionOrderLookup,
  type ProductionTransferDraft,
} from '../types/production-transfer';
import { ProductionTransferSuggestPanel } from './ProductionTransferSuggestPanel';
import {
  PtCollapsibleWorkflow,
  PtFormField,
  PtGuideItem,
  PtInfoCallout,
  PtLineCard,
  PtSection,
  PtStatGrid,
  PtTerminalBlock,
} from './production-transfer-ops-ui';
import type { Warehouse } from '@/features/shared';

const transferPurposes = ['MaterialSupply', 'SemiFinishedMove', 'FinishedGoodsPutaway', 'ScrapMove', 'ReturnToStock'] as const;
const lineRoles = ['ConsumptionSupply', 'SemiFinishedMove', 'OutputMove'] as const;

export function ProductionTransferCreatePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: routeEditId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.production-transfer');
  const editId = Number(routeEditId ?? searchParams.get('editId') ?? '');
  const cloneId = Number(searchParams.get('cloneId') ?? '');
  const isEditMode = Number.isFinite(editId) && editId > 0;
  const isCloneMode = !isEditMode && Number.isFinite(cloneId) && cloneId > 0;
  const canCreateTransfer = permission.canCreate;
  const canUpdateTransfer = permission.canUpdate;
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

  const pageTitle = isEditMode
    ? t('productionTransfer.create.editTitle', { defaultValue: 'Missing translation' })
    : isCloneMode
      ? t('productionTransfer.create.cloneTitle', { defaultValue: 'Missing translation' })
      : t('productionTransfer.create.title', { defaultValue: 'Missing translation' });
  const pageDescription = isEditMode
    ? t('productionTransfer.create.editSubtitle', { defaultValue: 'Missing translation' })
    : isCloneMode
      ? t('productionTransfer.create.cloneSubtitle', { defaultValue: 'Missing translation' })
      : t('productionTransfer.create.subtitle', { defaultValue: 'Missing translation' });
  const showInitialLoading = (isEditMode || isCloneMode) && detailQuery.isLoading;
  const showInitialError = (isEditMode || isCloneMode) && detailQuery.isError;
  const showFormContent = !showInitialLoading && !showInitialError;

  const resetDraft = (): void => {
    setDraft(detailQuery.data ? {
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
    } : createEmptyProductionTransferDraft());
  };

  return (
    <OpsFormPageShell
      eyebrow={
        <>
          <span>{t('productionTransfer.breadcrumb.parent')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('productionTransfer.breadcrumb.module')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>
            {isEditMode
              ? t('common.edit', { defaultValue: 'Missing translation' })
              : isCloneMode
                ? t('productionTransfer.list.cloneTransfer', { defaultValue: 'Missing translation' })
                : t('common.add', { defaultValue: 'Missing translation' })}
          </span>
        </>
      }
      title={pageTitle}
      description={pageDescription}
      actions={
        isEditMode && Number.isFinite(editId) && editId > 0 ? (
          <span className="wms-ops-code-badge">#{editId}</span>
        ) : null
      }
    >
      {showInitialLoading ? (
        <PageState tone="loading" title={t('common.loading')} compact />
      ) : null}

      {showInitialError ? (
        <PageState
          tone="error"
          title={t('common.error')}
          description={detailQuery.error instanceof Error ? detailQuery.error.message : t('productionTransfer.create.error', { defaultValue: 'Missing translation' })}
          compact
        />
      ) : null}

      {showFormContent ? (
      <div className="space-y-6">
        {!permission.canMutate ? <PermissionNotice /> : null}
        {!canSaveTransfer ? (
          <PtInfoCallout
            defaultOpen={false}
            title={t('productionTransfer.create.permissionInfoTitle')}
            body={isEditMode ? t('productionTransfer.create.permissionInfoUpdate') : t('productionTransfer.create.permissionInfoCreate')}
          />
        ) : null}
        {isEditMode ? (
          <PtInfoCallout
            defaultOpen={false}
            title={t('productionTransfer.create.editModeTitle', { defaultValue: 'Missing translation' })}
            body={t('productionTransfer.create.editModeBody', { defaultValue: 'Missing translation' })}
          />
        ) : null}
        {isCloneMode ? (
          <PtInfoCallout
            defaultOpen={false}
            title={t('productionTransfer.create.cloneModeTitle', { defaultValue: 'Missing translation' })}
            body={t('productionTransfer.create.cloneModeBody', { defaultValue: 'Missing translation' })}
          />
        ) : null}
        <PtCollapsibleWorkflow
          title={t('productionTransfer.create.info.overviewTitle', { defaultValue: 'Missing translation' })}
          body={t('productionTransfer.create.info.overviewBody', { defaultValue: 'Missing translation' })}
          steps={[
            {
              eyebrow: t('productionTransfer.create.steps.connect.eyebrow'),
              title: t('productionTransfer.create.steps.connect.title'),
              body: t('productionTransfer.create.steps.connect.body'),
            },
            {
              eyebrow: t('productionTransfer.create.steps.purpose.eyebrow'),
              title: t('productionTransfer.create.steps.purpose.title'),
              body: t('productionTransfer.create.steps.purpose.body'),
            },
            {
              eyebrow: t('productionTransfer.create.steps.lines.eyebrow'),
              title: t('productionTransfer.create.steps.lines.title'),
              body: t('productionTransfer.create.steps.lines.body'),
            },
          ]}
        />

        <PtStatGrid
          items={[
            {
              label: t('productionTransfer.create.summary.purpose', { defaultValue: 'Missing translation' }),
              value: transferPurposeLabel(draft.transferPurpose),
            },
            {
              label: t('productionTransfer.create.summary.lines', { defaultValue: 'Missing translation' }),
              value: summary.lineCount,
            },
            {
              label: t('productionTransfer.create.summary.quantity', { defaultValue: 'Missing translation' }),
              value: summary.totalQuantity,
            },
          ]}
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <PtSection
            variant="terminal"
            title={t('productionTransfer.create.header.title', { defaultValue: 'Missing translation' })}
            subtitle={t('productionTransfer.create.header.subtitle', { defaultValue: 'Missing translation' })}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-3">
                <PtTerminalBlock
                  defaultOpen={false}
                  title={t('productionTransfer.create.info.linkTitle', { defaultValue: 'Missing translation' })}
                  body={t('productionTransfer.create.info.linkBody', { defaultValue: 'Missing translation' })}
                />
              </div>
              <PtFormField label={t('common.documentNo')}>
                <OpsInput value={draft.documentNo} onChange={(e) => setDraft((prev) => ({ ...prev, documentNo: e.target.value }))} />
              </PtFormField>
              <PtFormField label={t('common.documentDate', { defaultValue: 'Missing translation' })}>
                <OpsInput type="date" value={draft.documentDate} onChange={(e) => setDraft((prev) => ({ ...prev, documentDate: e.target.value }))} />
              </PtFormField>
              <PtFormField label={t('productionTransfer.create.purpose', { defaultValue: 'Missing translation' })}>
                <OpsFieldShell>
                  <Select value={draft.transferPurpose} onValueChange={(value) => setDraft((prev) => ({ ...prev, transferPurpose: value as ProductionTransferDraft['transferPurpose'] }))}>
                    <SelectTrigger className={OPS_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                      {transferPurposes.map((value) => <SelectItem key={value} value={value}>{transferPurposeLabel(value)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </OpsFieldShell>
              </PtFormField>
              <PtFormField label={t('productionTransfer.create.productionDocument', { defaultValue: 'Missing translation' })}>
                <OpsInput value={draft.productionDocumentNo} onChange={(e) => setDraft((prev) => ({ ...prev, productionDocumentNo: e.target.value }))} />
              </PtFormField>
              <PtFormField label={t('productionTransfer.create.productionOrder', { defaultValue: 'Missing translation' })}>
                <OpsFieldShell className={productionOrderLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                  <PagedLookupDialog<ProductionOrderLookup>
                    variant="ops"
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
                </OpsFieldShell>
              </PtFormField>
              <PtFormField label={t('production.create.sourceWarehouse', { defaultValue: 'Missing translation' })}>
                <OpsFieldShell className={sourceWarehouseLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                  <PagedLookupDialog<Warehouse>
                    variant="ops"
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
                </OpsFieldShell>
              </PtFormField>
              <PtFormField label={t('production.create.targetWarehouse', { defaultValue: 'Missing translation' })}>
                <OpsFieldShell className={targetWarehouseLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                  <PagedLookupDialog<Warehouse>
                    variant="ops"
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
                </OpsFieldShell>
              </PtFormField>
              <PtFormField label={t('common.description')} className="md:col-span-3">
                <OpsTextarea rows={3} value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} />
              </PtFormField>
            </div>
          </PtSection>

          <PtSection
            variant="terminal"
            title={t('productionTransfer.create.guide.title', { defaultValue: 'Missing translation' })}
            subtitle={t('productionTransfer.create.guide.subtitle', { defaultValue: 'Missing translation' })}
          >
            <div className="space-y-3">
              <PtGuideItem
                title={t('productionTransfer.create.guide.materialSupply', { defaultValue: 'Missing translation' })}
                body={t('productionTransfer.create.guide.materialSupplyBody', { defaultValue: 'Missing translation' })}
              />
              <PtGuideItem
                title={t('productionTransfer.create.guide.semiFinishedMove', { defaultValue: 'Missing translation' })}
                body={t('productionTransfer.create.guide.semiFinishedMoveBody', { defaultValue: 'Missing translation' })}
              />
              <PtGuideItem
                title={t('productionTransfer.create.guide.outputMove', { defaultValue: 'Missing translation' })}
                body={t('productionTransfer.create.guide.outputMoveBody', { defaultValue: 'Missing translation' })}
              />
            </div>
          </PtSection>
        </div>

        <ProductionTransferSuggestPanel
          lines={suggestedLines}
          isLoading={suggestionMutation.isPending}
          applyMode={applyMode}
          onApplyModeChange={setApplyMode}
          onApplySelected={applySuggestedLines}
        />

        <PtSection
          title={t('productionTransfer.create.lines.title', { defaultValue: 'Missing translation' })}
          subtitle={t('productionTransfer.create.lines.subtitle', { defaultValue: 'Missing translation' })}
          actions={
            <>
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => suggestionMutation.mutate()}
                disabled={suggestionMutation.isPending || (!draft.productionDocumentNo && !draft.productionOrderNo)}
              >
                {suggestionMutation.isPending
                  ? t('common.loading', { defaultValue: 'Missing translation' })
                  : t('productionTransfer.create.lines.fetchSuggestions', { defaultValue: 'Missing translation' })}
              </OpsActionButton>
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => setDraft((prev) => ({ ...prev, lines: [...prev.lines, createEmptyProductionTransferLineDraft()] }))}
              >
                {t('common.add', { defaultValue: 'Missing translation' })}
              </OpsActionButton>
            </>
          }
        >
          <div className="mb-4">
            <PtTerminalBlock
              defaultOpen={false}
              title={t('productionTransfer.create.info.linesTitle', { defaultValue: 'Missing translation' })}
              body={t('productionTransfer.create.info.linesBody', { defaultValue: 'Missing translation' })}
            />
          </div>
          <div className="space-y-4">
            {draft.lines.map((line, index) => (
              <PtLineCard
                key={line.localId}
                index={index + 1}
                title={t('productionTransfer.create.lineCardTitle', { defaultValue: 'Missing translation', index: index + 1 })}
                hint={
                  line.productionOrderNo
                    ? t('productionTransfer.create.lineCardHintLinked', { defaultValue: 'Missing translation', orderNo: line.productionOrderNo })
                    : t('productionTransfer.create.lineCardHint', { defaultValue: 'Missing translation' })
                }
                removeLabel={t('common.delete')}
                onRemove={() => removeLine(line.localId)}
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <PtFormField label={t('productionTransfer.create.productionOrder', { defaultValue: 'Missing translation' })}>
                    <OpsFieldShell className={activeLineOrderLookupId === line.localId ? 'wms-ops-field-shell--active' : undefined}>
                      <PagedLookupDialog<ProductionOrderLookup>
                        variant="ops"
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
                    </OpsFieldShell>
                  </PtFormField>
                  <PtFormField label={t('productionTransfer.create.lineRole', { defaultValue: 'Missing translation' })}>
                    <OpsFieldShell>
                      <Select value={line.lineRole} onValueChange={(value) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, lineRole: value as typeof lineRoles[number] } : current) }))}>
                        <SelectTrigger className={OPS_FIELD_CLASS}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                          {lineRoles.map((value) => <SelectItem key={value} value={value}>{lineRoleLabel(value)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </OpsFieldShell>
                  </PtFormField>
                  <PtFormField label={t('production.create.producedStockCode', { defaultValue: 'Missing translation' })}>
                    <OpsFieldShell className={activeLineStockLookupId === line.localId ? 'wms-ops-field-shell--active' : undefined}>
                      <PagedLookupDialog<StockLookup>
                        variant="ops"
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
                    </OpsFieldShell>
                  </PtFormField>
                  <PtFormField label={t('production.create.plannedQuantity', { defaultValue: 'Missing translation' })}>
                    <OpsInput
                      type="number"
                      min="0"
                      step="0.001"
                      value={line.quantity}
                      onChange={(e) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, quantity: Number(e.target.value) || 0 } : current) }))}
                    />
                  </PtFormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <PtFormField label={t('productionTransfer.create.sourceCell', { defaultValue: 'Missing translation' })}>
                    <ShelfLookupCombobox
                      variant="ops"
                      warehouseCode={draft.sourceWarehouseCode}
                      value={line.sourceCellCode}
                      onValueChange={(value) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, sourceCellCode: value } : current) }))}
                      placeholder={t('productionTransfer.create.sourceCell', { defaultValue: 'Missing translation' })}
                      searchPlaceholder={t('productionTransfer.create.cellSearch', { defaultValue: 'Missing translation' })}
                      emptyText={t('productionTransfer.create.sourceCellEmpty', { defaultValue: 'Missing translation' })}
                    />
                  </PtFormField>
                  <PtFormField label={t('productionTransfer.create.targetCell', { defaultValue: 'Missing translation' })}>
                    <ShelfLookupCombobox
                      variant="ops"
                      warehouseCode={draft.targetWarehouseCode}
                      value={line.targetCellCode}
                      onValueChange={(value) => setDraft((prev) => ({ ...prev, lines: prev.lines.map((current) => current.localId === line.localId ? { ...current, targetCellCode: value } : current) }))}
                      placeholder={t('productionTransfer.create.targetCell', { defaultValue: 'Missing translation' })}
                      searchPlaceholder={t('productionTransfer.create.cellSearch', { defaultValue: 'Missing translation' })}
                      emptyText={t('productionTransfer.create.targetCellEmpty', { defaultValue: 'Missing translation' })}
                    />
                  </PtFormField>
                </div>
              </PtLineCard>
            ))}
          </div>
        </PtSection>

        <div className="flex flex-wrap gap-2">
          <span className="wms-ops-code-badge">{t('productionTransfer.create.review.header', { defaultValue: 'Missing translation' })}: {draft.productionDocumentNo || '-'}</span>
          <span className="wms-ops-code-badge">{t('productionTransfer.create.review.order', { defaultValue: 'Missing translation' })}: {draft.productionOrderNo || '-'}</span>
          <span className="wms-ops-code-badge">{t('productionTransfer.create.review.purpose', { defaultValue: 'Missing translation' })}: {transferPurposeLabel(draft.transferPurpose)}</span>
        </div>

        <div className="wms-ops-actions flex flex-wrap justify-between gap-4 border-t pt-6">
          <OpsActionButton type="button" variant="secondary" onClick={() => navigate('/production-transfer/list')}>
            <ChevronLeft className="size-3.5" aria-hidden />
            {t('common.cancel')}
          </OpsActionButton>
          <div className="flex flex-wrap gap-2">
            <OpsActionButton type="button" variant="secondary" onClick={resetDraft}>
              {t('common.clear')}
            </OpsActionButton>
            <OpsActionButton
              type="button"
              variant="primary"
              onClick={() => createMutation.mutate()}
              disabled={!canSaveTransfer || createMutation.isPending}
            >
              {createMutation.isPending
                ? t('common.saving')
                : isEditMode
                  ? t('common.update', { defaultValue: 'Missing translation' })
                  : t('common.save')}
            </OpsActionButton>
          </div>
        </div>
      </div>
      ) : null}
    </OpsFormPageShell>
  );
}
