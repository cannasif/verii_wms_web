import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import {
  OpsActionButton,
  OpsCircuitToggleField,
  OpsFormPageShell,
  OpsInput,
  OpsSelect,
  OpsSelectItem,
  OpsTextarea,
  PageState,
} from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { useUIStore } from '@/stores/ui-store';
import { inventoryCountApi } from '../api/inventory-count-api';
import type { StockLookup, WarehouseLookup, YapKodLookup } from '@/features/shared/api/lookup-types';
import {
  createEmptyInventoryCountDraft,
  createEmptyInventoryCountScopeDraft,
  type CreateInventoryCountHeaderRequest,
  type CreateInventoryCountScopeRequest,
  type InventoryCountCreateDraft,
  type InventoryCountHeader,
  type InventoryCountScope,
  type InventoryCountScopeDraft,
} from '../types/inventory-count';
import {
  InventoryCountOpsCallout,
  InventoryCountOpsDeleteButton,
  InventoryCountOpsField,
  InventoryCountOpsScopePanel,
  InventoryCountOpsSectionHeader,
} from './inventory-count-ops-ui';

type LookupTarget =
  | { type: 'warehouse'; scopeIndex?: number }
  | { type: 'stock'; scopeIndex?: number }
  | { type: 'yapkod'; scopeIndex?: number };

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function dateToInput(value?: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function getScopeMode(draft: InventoryCountCreateDraft): string {
  switch (draft.countType) {
    case 'General':
      return 'All';
    case 'Warehouse':
      return 'Warehouse';
    case 'Stock':
      return draft.warehouseCode ? 'WarehouseStock' : 'StockAcrossWarehouses';
    case 'Rack':
      return 'WarehouseRack';
    case 'Cell':
      return 'WarehouseCell';
    case 'Combined':
    default:
      return 'Mixed';
  }
}

function getCountTypeDescription(t: (key: string) => string, countType: InventoryCountCreateDraft['countType']): string {
  switch (countType) {
    case 'General':
      return t('inventoryCount.create.countTypeDescriptions.general');
    case 'Warehouse':
      return t('inventoryCount.create.countTypeDescriptions.warehouse');
    case 'Stock':
      return t('inventoryCount.create.countTypeDescriptions.stock');
    case 'Rack':
      return t('inventoryCount.create.countTypeDescriptions.rack');
    case 'Cell':
      return t('inventoryCount.create.countTypeDescriptions.cell');
    case 'Combined':
      return t('inventoryCount.create.countTypeDescriptions.combined');
    default:
      return '';
  }
}

function buildHeaderRequest(draft: InventoryCountCreateDraft): CreateInventoryCountHeaderRequest {
  const request: CreateInventoryCountHeaderRequest = {
    documentNo: draft.documentNo.trim(),
    documentDate: toNullable(draft.documentDate),
    description1: draft.description1.trim(),
    countType: draft.countType,
    scopeMode: getScopeMode(draft),
    countMode: draft.countMode,
    freezeMode: draft.freezeMode,
    warehouseCode: null,
    stockCode: null,
    yapKod: null,
    rackCode: null,
    cellCode: null,
    plannedStartDate: toNullable(draft.plannedStartDate),
    plannedEndDate: toNullable(draft.plannedEndDate),
    isFirstCount: draft.isFirstCount,
  };

  if (draft.countType !== 'Combined') {
    request.warehouseCode = toNullable(draft.warehouseCode);
    request.stockCode = toNullable(draft.stockCode);
    request.yapKod = toNullable(draft.yapKod);
    request.rackCode = toNullable(draft.rackCode);
    request.cellCode = toNullable(draft.cellCode);
  }

  return request;
}

function buildScopeRequest(headerId: number, scope: InventoryCountScopeDraft): CreateInventoryCountScopeRequest {
  return {
    headerId,
    sequenceNo: scope.sequenceNo,
    scopeType: scope.scopeType,
    warehouseCode: toNullable(scope.warehouseCode),
    stockCode: toNullable(scope.stockCode),
    yapKod: toNullable(scope.yapKod),
    rackCode: toNullable(scope.rackCode),
    cellCode: toNullable(scope.cellCode),
    isActive: true,
  };
}

function hasScopeData(scope: InventoryCountScopeDraft): boolean {
  return Boolean(
    scope.warehouseCode.trim()
    || scope.stockCode.trim()
    || scope.rackCode.trim()
    || scope.cellCode.trim(),
  );
}

function mapHeaderToDraft(header: InventoryCountHeader, scopes: InventoryCountScope[]): InventoryCountCreateDraft {
  return {
    documentNo: header.documentNo ?? '',
    documentDate: dateToInput(header.documentDate) || new Date().toISOString().slice(0, 10),
    description1: header.description1 ?? '',
    countType: header.countType,
    countMode: header.countMode,
    freezeMode: (header.freezeMode || 'None') as InventoryCountCreateDraft['freezeMode'],
    plannedStartDate: dateToInput(header.plannedStartDate),
    plannedEndDate: dateToInput(header.plannedEndDate),
    isFirstCount: header.isFirstCount,
    warehouseCode: header.warehouseCode ?? '',
    stockId: header.stockId ?? null,
    stockCode: header.stockCode ?? '',
    yapKod: header.yapKod ?? '',
    rackCode: header.rackCode ?? '',
    cellCode: header.cellCode ?? '',
    scopes: scopes.length > 0
      ? scopes.map((scope, index) => ({
          id: scope.id,
          sequenceNo: scope.sequenceNo ?? index + 1,
          scopeType: scope.scopeType as InventoryCountScopeDraft['scopeType'],
          warehouseCode: scope.warehouseCode ?? '',
          stockId: scope.stockId ?? null,
          stockCode: scope.stockCode ?? '',
          yapKod: scope.yapKod ?? '',
          rackCode: scope.rackCode ?? '',
          cellCode: scope.cellCode ?? '',
        }))
      : [createEmptyInventoryCountScopeDraft(1)],
  };
}

function validateDraft(t: (key: string) => string, draft: InventoryCountCreateDraft): string | null {
  if (!draft.documentNo.trim()) {
    return t('inventoryCount.create.validation.documentNoRequired');
  }

  if (draft.countType === 'Warehouse' && !draft.warehouseCode.trim()) {
    return t('inventoryCount.create.validation.warehouseRequired');
  }

  if (draft.countType === 'Stock' && !draft.stockCode.trim()) {
    return t('inventoryCount.create.validation.stockRequired');
  }

  if (draft.countType === 'Rack' && !draft.rackCode.trim()) {
    return t('inventoryCount.create.validation.rackRequired');
  }

  if (draft.countType === 'Cell' && !draft.cellCode.trim()) {
    return t('inventoryCount.create.validation.cellRequired');
  }

  if (draft.countType === 'Combined') {
    if (draft.scopes.length === 0) {
      return t('inventoryCount.create.validation.scopeRequired');
    }

    const hasValidScope = draft.scopes.some((scope) => {
      switch (scope.scopeType) {
        case 'Warehouse':
          return Boolean(scope.warehouseCode.trim());
        case 'Stock':
          return Boolean(scope.stockCode.trim());
        case 'Rack':
          return Boolean(scope.rackCode.trim());
        case 'Cell':
          return Boolean(scope.cellCode.trim());
        default:
          return false;
      }
    });

    if (!hasValidScope) {
      return t('inventoryCount.create.validation.validScopeRequired');
    }
  }

  return null;
}

export function InventoryCountCreatePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: routeEditId } = useParams<{ id?: string }>();
  const { setPageTitle } = useUIStore();
  const permissionAccess = usePermissionAccess();
  const editId = Number(routeEditId ?? '');
  const isEditMode = Number.isFinite(editId) && editId > 0;
  const canCreate = permissionAccess.can('wms.inventory-count.create');
  const canUpdate = permissionAccess.can('wms.inventory-count.update');
  const canSave = isEditMode ? canUpdate : canCreate;
  const [draft, setDraft] = useState<InventoryCountCreateDraft>(() => createEmptyInventoryCountDraft());
  const [lookupTarget, setLookupTarget] = useState<LookupTarget | null>(null);

  const countTypeOptions = useMemo(
    () => [
      { value: 'General', label: t('inventoryCount.create.options.countType.general') },
      { value: 'Warehouse', label: t('inventoryCount.create.options.countType.warehouse') },
      { value: 'Stock', label: t('inventoryCount.create.options.countType.stock') },
      { value: 'Rack', label: t('inventoryCount.create.options.countType.rack') },
      { value: 'Cell', label: t('inventoryCount.create.options.countType.cell') },
      { value: 'Combined', label: t('inventoryCount.create.options.countType.combined') },
    ] as const,
    [t],
  );

  const countModeOptions = useMemo(
    () => [
      { value: 'Blind', label: t('inventoryCount.create.options.countMode.blind') },
      { value: 'Open', label: t('inventoryCount.create.options.countMode.open') },
    ] as const,
    [t],
  );

  const freezeModeOptions = useMemo(
    () => [
      { value: 'None', label: t('inventoryCount.create.options.freezeMode.none') },
      { value: 'Soft', label: t('inventoryCount.create.options.freezeMode.soft') },
      { value: 'Hard', label: t('inventoryCount.create.options.freezeMode.hard') },
    ] as const,
    [t],
  );

  const scopeTypeOptions = useMemo(
    () => [
      { value: 'Warehouse', label: t('inventoryCount.create.options.scopeType.warehouse') },
      { value: 'Stock', label: t('inventoryCount.create.options.scopeType.stock') },
      { value: 'Rack', label: t('inventoryCount.create.options.scopeType.rack') },
      { value: 'Cell', label: t('inventoryCount.create.options.scopeType.cell') },
    ] as const,
    [t],
  );

  useEffect(() => {
    setPageTitle(t(isEditMode ? 'inventoryCount.create.editTitle' : 'inventoryCount.create.title', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [isEditMode, setPageTitle, t]);

  const headerQuery = useQuery({
    queryKey: ['inventory-count-edit-header', editId],
    queryFn: () => inventoryCountApi.getHeaderById(editId),
    enabled: isEditMode,
  });

  const scopesQuery = useQuery({
    queryKey: ['inventory-count-edit-scopes', editId],
    queryFn: () => inventoryCountApi.getScopesByHeader(editId),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (!isEditMode || !headerQuery.data || !scopesQuery.data) {
      return;
    }

    setDraft(mapHeaderToDraft(headerQuery.data, scopesQuery.data));
  }, [headerQuery.data, isEditMode, scopesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const error = validateDraft(t, draft);
      if (error) {
        throw new Error(error);
      }

      if (isEditMode) {
        const updatedHeader = await inventoryCountApi.updateHeader(editId, buildHeaderRequest(draft));
        const existingScopes = scopesQuery.data ?? [];

        if (draft.countType === 'Combined') {
          const retainedScopeIds = new Set<number>();

          for (const scope of draft.scopes.filter(hasScopeData)) {
            const scopePayload = buildScopeRequest(editId, scope);

            if (scope.id) {
              retainedScopeIds.add(scope.id);
              await inventoryCountApi.updateScope(scope.id, {
                sequenceNo: scopePayload.sequenceNo,
                scopeType: scopePayload.scopeType,
                warehouseCode: scopePayload.warehouseCode,
                stockCode: scopePayload.stockCode,
                yapKod: scopePayload.yapKod,
                rackCode: scopePayload.rackCode,
                cellCode: scopePayload.cellCode,
                isActive: true,
              });
            } else {
              const createdScope = await inventoryCountApi.createScope(scopePayload);
              retainedScopeIds.add(createdScope.id);
            }
          }

          for (const scope of existingScopes) {
            if (!retainedScopeIds.has(scope.id)) {
              await inventoryCountApi.softDeleteScope(scope.id);
            }
          }
        } else {
          for (const scope of existingScopes) {
            await inventoryCountApi.softDeleteScope(scope.id);
          }
        }

        return updatedHeader;
      }

      const createdHeader = await inventoryCountApi.createHeader(buildHeaderRequest(draft));

      if (draft.countType === 'Combined') {
        for (const scope of draft.scopes) {
          const scopeRequest = buildScopeRequest(createdHeader.id, scope);

          if (hasScopeData(scope)) {
            await inventoryCountApi.createScope(scopeRequest);
          }
        }
      }

      await inventoryCountApi.generateLines(createdHeader.id);
      return createdHeader;
    },
    onSuccess: (header) => {
      toast.success(t(isEditMode ? 'inventoryCount.create.updateSuccess' : 'inventoryCount.create.success', {
        defaultValue: 'Missing translation',
      }));
      navigate(isEditMode ? '/inventory-count/list' : '/inventory-count/process?headerId=' + String(header.id));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('inventoryCount.create.error', { defaultValue: 'Missing translation' }));
    },
  });

  const updateScope = (index: number, updater: (current: InventoryCountScopeDraft) => InventoryCountScopeDraft): void => {
    setDraft((prev) => ({
      ...prev,
      scopes: prev.scopes.map((scope, scopeIndex) => (scopeIndex === index ? updater(scope) : scope)),
    }));
  };

  const addScope = (): void => {
    setDraft((prev) => ({
      ...prev,
      scopes: [...prev.scopes, createEmptyInventoryCountScopeDraft(prev.scopes.length + 1)],
    }));
  };

  const removeScope = (index: number): void => {
    setDraft((prev) => ({
      ...prev,
      scopes: prev.scopes.filter((_, scopeIndex) => scopeIndex !== index).map((scope, scopeIndex) => ({
        ...scope,
        sequenceNo: scopeIndex + 1,
      })),
    }));
  };

  const summaryText = useMemo(() => {
    if (draft.countType === 'Combined') {
      return t('inventoryCount.create.summary.combined', { count: draft.scopes.length });
    }
    if (draft.countType === 'General') {
      return t('inventoryCount.create.summary.general');
    }
    return t('inventoryCount.create.summary.scoped');
  }, [draft.countType, draft.scopes.length, t]);

  const handleWarehouseSelect = (item: WarehouseLookup): void => {
    if (!lookupTarget || lookupTarget.type !== 'warehouse') {
      return;
    }

    if (typeof lookupTarget.scopeIndex === 'number') {
      updateScope(lookupTarget.scopeIndex, (current) => ({ ...current, warehouseCode: String(item.depoKodu) }));
    } else {
      setDraft((prev) => ({ ...prev, warehouseCode: String(item.depoKodu) }));
    }

    setLookupTarget(null);
  };

  const handleStockSelect = (item: StockLookup): void => {
    if (!lookupTarget || lookupTarget.type !== 'stock') {
      return;
    }

    if (typeof lookupTarget.scopeIndex === 'number') {
      updateScope(lookupTarget.scopeIndex, (current) => ({ ...current, stockId: item.id, stockCode: item.stokKodu, yapKod: '' }));
    } else {
      setDraft((prev) => ({ ...prev, stockId: item.id, stockCode: item.stokKodu, yapKod: '' }));
    }

    setLookupTarget(null);
  };

  const handleYapKodSelect = (item: YapKodLookup): void => {
    if (!lookupTarget || lookupTarget.type !== 'yapkod') {
      return;
    }

    if (typeof lookupTarget.scopeIndex === 'number') {
      updateScope(lookupTarget.scopeIndex, (current) => ({ ...current, yapKod: item.yapKod }));
    } else {
      setDraft((prev) => ({ ...prev, yapKod: item.yapKod }));
    }

    setLookupTarget(null);
  };

  return (
    <>
      {isEditMode && (headerQuery.isLoading || scopesQuery.isLoading) ? (
        <PageState tone="loading" title={t('common.loading')} />
      ) : null}

      {isEditMode && (headerQuery.isError || scopesQuery.isError) ? (
        <PageState
          tone="error"
          title={t('common.error')}
          description={
            headerQuery.error instanceof Error
              ? headerQuery.error.message
              : scopesQuery.error instanceof Error
                ? scopesQuery.error.message
                : t('inventoryCount.create.error')
          }
        />
      ) : null}

      {(!isEditMode || (headerQuery.isSuccess && scopesQuery.isSuccess)) ? (
    <OpsFormPageShell
      className="wms-ops-erp-skin wms-ops-inventory-count-page"
      eyebrow={t('sidebar.inventoryCount')}
      title={t(isEditMode ? 'inventoryCount.create.editTitle' : 'inventoryCount.create.title')}
      description={t(isEditMode ? 'inventoryCount.create.editDescription' : 'inventoryCount.create.description')}
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          <OpsActionButton type="button" variant="secondary" onClick={() => navigate('/inventory-count/list')}>
            {t('common.cancel')}
          </OpsActionButton>
          <OpsActionButton type="button" variant="primary" onClick={() => saveMutation.mutate()} disabled={!canSave || saveMutation.isPending}>
            {saveMutation.isPending
              ? t('common.saving')
              : isEditMode
                ? t('common.update')
                : t('inventoryCount.create.saveAndPrepare')}
          </OpsActionButton>
        </div>
      )}
    >
      <div className="wms-ops-inventory-count-content">
        {!canSave ? (
          <InventoryCountOpsCallout
            tone="warn"
            title={t('common.accessDeniedMessage')}
            body={t('inventoryCount.create.permissionInfo')}
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <InventoryCountOpsSectionHeader
                  title={t('inventoryCount.create.whatToCountTitle')}
                  description={t('inventoryCount.create.whatToCountDescription')}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <InventoryCountOpsField label={t('inventoryCount.fields.countType')}>
                    <OpsSelect
                      value={draft.countType}
                      onValueChange={(value) => setDraft((prev) => ({
                        ...prev,
                        countType: value as InventoryCountCreateDraft['countType'],
                      }))}
                    >
                      {countTypeOptions.map((item) => (
                        <OpsSelectItem key={item.value} value={item.value}>{item.label}</OpsSelectItem>
                      ))}
                    </OpsSelect>
                  </InventoryCountOpsField>

                  <InventoryCountOpsField label={t('inventoryCount.fields.countMode')}>
                    <OpsSelect
                      value={draft.countMode}
                      onValueChange={(value) => setDraft((prev) => ({
                        ...prev,
                        countMode: value as InventoryCountCreateDraft['countMode'],
                      }))}
                    >
                      {countModeOptions.map((item) => (
                        <OpsSelectItem key={item.value} value={item.value}>{item.label}</OpsSelectItem>
                      ))}
                    </OpsSelect>
                  </InventoryCountOpsField>
                </div>

                <InventoryCountOpsCallout
                  tone="info"
                  title={countTypeOptions.find((item) => item.value === draft.countType)?.label ?? ''}
                  body={getCountTypeDescription(t, draft.countType)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <InventoryCountOpsSectionHeader
                  title={t('inventoryCount.create.headerInfoTitle')}
                  description={t('inventoryCount.create.headerInfoDescription')}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <InventoryCountOpsField label={t('common.documentNo')}>
                    <OpsInput value={draft.documentNo} onChange={(event) => setDraft((prev) => ({ ...prev, documentNo: event.target.value }))} />
                  </InventoryCountOpsField>
                  <InventoryCountOpsField label={t('common.documentDate')}>
                    <OpsInput type="date" value={draft.documentDate} onChange={(event) => setDraft((prev) => ({ ...prev, documentDate: event.target.value }))} />
                  </InventoryCountOpsField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InventoryCountOpsField label={t('inventoryCount.fields.plannedStartDate')}>
                    <OpsInput type="date" value={draft.plannedStartDate} onChange={(event) => setDraft((prev) => ({ ...prev, plannedStartDate: event.target.value }))} />
                  </InventoryCountOpsField>
                  <InventoryCountOpsField label={t('inventoryCount.fields.plannedEndDate')}>
                    <OpsInput type="date" value={draft.plannedEndDate} onChange={(event) => setDraft((prev) => ({ ...prev, plannedEndDate: event.target.value }))} />
                  </InventoryCountOpsField>
                </div>

                <InventoryCountOpsField label={t('common.description')}>
                  <OpsTextarea value={draft.description1} onChange={(event) => setDraft((prev) => ({ ...prev, description1: event.target.value }))} rows={3} />
                </InventoryCountOpsField>

                <div className="grid gap-4 md:grid-cols-2">
                  <InventoryCountOpsField label={t('inventoryCount.fields.freezeMode')}>
                    <OpsSelect
                      value={draft.freezeMode}
                      onValueChange={(value) => setDraft((prev) => ({
                        ...prev,
                        freezeMode: value as InventoryCountCreateDraft['freezeMode'],
                      }))}
                    >
                      {freezeModeOptions.map((item) => (
                        <OpsSelectItem key={item.value} value={item.value}>{item.label}</OpsSelectItem>
                      ))}
                    </OpsSelect>
                  </InventoryCountOpsField>

                  <OpsCircuitToggleField
                    checked={draft.isFirstCount}
                    onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, isFirstCount: checked }))}
                    title={t('inventoryCount.fields.isFirstCount')}
                    description={t('inventoryCount.create.firstCountHint')}
                    className="h-full min-h-[2.625rem]"
                  />
                </div>
              </CardContent>
            </Card>

            {draft.countType !== 'Combined' ? (
              <Card>
                <CardHeader>
                  <InventoryCountOpsSectionHeader
                    title={t('inventoryCount.create.scopeTitle')}
                    description={t('inventoryCount.create.scopeDescription')}
                  />
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <InventoryCountOpsField label={t('inventoryCount.fields.warehouse')}>
                    <PagedLookupDialog
                      variant="ops"
                      open={lookupTarget?.type === 'warehouse' && lookupTarget.scopeIndex === undefined}
                      onOpenChange={(open) => setLookupTarget(open ? { type: 'warehouse' } : null)}
                      title={t('inventoryCount.fields.warehouse', { defaultValue: 'Missing translation' })}
                      value={draft.warehouseCode || null}
                      placeholder={t('inventoryCount.placeholders.selectWarehouse', { defaultValue: 'Missing translation' })}
                      searchPlaceholder={t('inventoryCount.placeholders.selectWarehouse', { defaultValue: 'Missing translation' })}
                      emptyText={t('common.noResults', { defaultValue: 'Missing translation' })}
                      queryKey={['inventory-count-create', 'warehouse-paged']}
                      fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })}
                      getKey={(item) => String(item.id)}
                      getLabel={(item) => item.depoKodu + ' - ' + item.depoIsmi}
                      onSelect={handleWarehouseSelect}
                    />
                  </InventoryCountOpsField>
                  <InventoryCountOpsField label={t('inventoryCount.fields.stock')}>
                    <PagedLookupDialog
                      variant="ops"
                      open={lookupTarget?.type === 'stock' && lookupTarget.scopeIndex === undefined}
                      onOpenChange={(open) => setLookupTarget(open ? { type: 'stock' } : null)}
                      title={t('inventoryCount.fields.stock', { defaultValue: 'Missing translation' })}
                      value={draft.stockCode || null}
                      placeholder={t('inventoryCount.placeholders.selectStock', { defaultValue: 'Missing translation' })}
                      searchPlaceholder={t('inventoryCount.placeholders.selectStock', { defaultValue: 'Missing translation' })}
                      emptyText={t('common.noResults', { defaultValue: 'Missing translation' })}
                      queryKey={['inventory-count-create', 'stock-paged']}
                      fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })}
                      getKey={(item) => String(item.id)}
                      getLabel={(item) => item.stokKodu + ' - ' + item.stokAdi}
                      onSelect={handleStockSelect}
                    />
                  </InventoryCountOpsField>
                  <InventoryCountOpsField label={t('inventoryCount.fields.yapKod')}>
                    <PagedLookupDialog
                      variant="ops"
                      open={lookupTarget?.type === 'yapkod' && lookupTarget.scopeIndex === undefined}
                      onOpenChange={(open) => setLookupTarget(open ? { type: 'yapkod' } : null)}
                      title={t('inventoryCount.fields.yapKod', { defaultValue: 'Missing translation' })}
                      value={draft.yapKod || null}
                      placeholder={t('inventoryCount.placeholders.selectYapKod', { defaultValue: 'Missing translation' })}
                      searchPlaceholder={t('inventoryCount.placeholders.selectYapKod', { defaultValue: 'Missing translation' })}
                      emptyText={t('common.noResults', { defaultValue: 'Missing translation' })}
                      disabled={!draft.stockCode}
                      queryKey={['inventory-count-create', 'yapkod-paged', draft.stockCode]}
                      fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getYapKodlarPaged({ pageNumber, pageSize, search }, { stockId: draft.stockId ?? undefined }, { signal })}
                      getKey={(item) => String(item.id)}
                      getLabel={(item) => item.yapKod + ' - ' + item.yapAcik}
                      onSelect={handleYapKodSelect}
                    />
                  </InventoryCountOpsField>
                  <InventoryCountOpsField label={t('inventoryCount.fields.rack')}>
                    <OpsInput value={draft.rackCode} onChange={(event) => setDraft((prev) => ({ ...prev, rackCode: event.target.value }))} placeholder={t('inventoryCount.placeholders.enterRack')} />
                  </InventoryCountOpsField>
                  <InventoryCountOpsField label={t('inventoryCount.fields.cell')}>
                    <OpsInput value={draft.cellCode} onChange={(event) => setDraft((prev) => ({ ...prev, cellCode: event.target.value }))} placeholder={t('inventoryCount.placeholders.enterCell')} />
                  </InventoryCountOpsField>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <InventoryCountOpsSectionHeader
                    title={t('inventoryCount.create.combinedScopeTitle')}
                    description={t('inventoryCount.create.combinedScopeDescription')}
                    action={(
                      <OpsActionButton type="button" variant="secondary" onClick={addScope}>
                        <Plus className="size-4" />
                        {t('inventoryCount.create.addScope')}
                      </OpsActionButton>
                    )}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  {draft.scopes.map((scope, index) => (
                    <InventoryCountOpsScopePanel
                      key={index}
                      title={t('inventoryCount.create.scopeRow', { index: index + 1 })}
                      action={draft.scopes.length > 1 ? (
                        <InventoryCountOpsDeleteButton label={t('common.delete')} onClick={() => removeScope(index)} />
                      ) : undefined}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <InventoryCountOpsField label={t('inventoryCount.fields.scopeType')}>
                          <OpsSelect
                            value={scope.scopeType}
                            onValueChange={(value) => updateScope(index, (current) => ({ ...current, scopeType: value as InventoryCountScopeDraft['scopeType'] }))}
                          >
                            {scopeTypeOptions.map((item) => (
                              <OpsSelectItem key={item.value} value={item.value}>{item.label}</OpsSelectItem>
                            ))}
                          </OpsSelect>
                        </InventoryCountOpsField>
                        <InventoryCountOpsField label={t('inventoryCount.fields.warehouse')}>
                          <PagedLookupDialog
                            variant="ops"
                            open={lookupTarget?.type === 'warehouse' && lookupTarget.scopeIndex === index}
                            onOpenChange={(open) => setLookupTarget(open ? { type: 'warehouse', scopeIndex: index } : null)}
                            title={t('inventoryCount.fields.warehouse', { defaultValue: 'Missing translation' })}
                            value={scope.warehouseCode || null}
                            placeholder={t('inventoryCount.placeholders.selectWarehouse', { defaultValue: 'Missing translation' })}
                            searchPlaceholder={t('inventoryCount.placeholders.selectWarehouse', { defaultValue: 'Missing translation' })}
                            emptyText={t('common.noResults', { defaultValue: 'Missing translation' })}
                            queryKey={['inventory-count-create', 'scope-warehouse-paged', index]}
                            fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })}
                            getKey={(item) => String(item.id)}
                            getLabel={(item) => item.depoKodu + ' - ' + item.depoIsmi}
                            onSelect={handleWarehouseSelect}
                          />
                        </InventoryCountOpsField>
                        <InventoryCountOpsField label={t('inventoryCount.fields.stock')}>
                          <PagedLookupDialog
                            variant="ops"
                            open={lookupTarget?.type === 'stock' && lookupTarget.scopeIndex === index}
                            onOpenChange={(open) => setLookupTarget(open ? { type: 'stock', scopeIndex: index } : null)}
                            title={t('inventoryCount.fields.stock', { defaultValue: 'Missing translation' })}
                            value={scope.stockCode || null}
                            placeholder={t('inventoryCount.placeholders.selectStock', { defaultValue: 'Missing translation' })}
                            searchPlaceholder={t('inventoryCount.placeholders.selectStock', { defaultValue: 'Missing translation' })}
                            emptyText={t('common.noResults', { defaultValue: 'Missing translation' })}
                            queryKey={['inventory-count-create', 'scope-stock-paged', index]}
                            fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })}
                            getKey={(item) => String(item.id)}
                            getLabel={(item) => item.stokKodu + ' - ' + item.stokAdi}
                            onSelect={handleStockSelect}
                          />
                        </InventoryCountOpsField>
                        <InventoryCountOpsField label={t('inventoryCount.fields.yapKod')}>
                          <PagedLookupDialog
                            variant="ops"
                            open={lookupTarget?.type === 'yapkod' && lookupTarget.scopeIndex === index}
                            onOpenChange={(open) => setLookupTarget(open ? { type: 'yapkod', scopeIndex: index } : null)}
                            title={t('inventoryCount.fields.yapKod', { defaultValue: 'Missing translation' })}
                            value={scope.yapKod || null}
                            placeholder={t('inventoryCount.placeholders.selectYapKod', { defaultValue: 'Missing translation' })}
                            searchPlaceholder={t('inventoryCount.placeholders.selectYapKod', { defaultValue: 'Missing translation' })}
                            emptyText={t('common.noResults', { defaultValue: 'Missing translation' })}
                            disabled={!scope.stockCode}
                            queryKey={['inventory-count-create', 'scope-yapkod-paged', index, scope.stockCode]}
                            fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getYapKodlarPaged({ pageNumber, pageSize, search }, { stockId: scope.stockId ?? undefined }, { signal })}
                            getKey={(item) => String(item.id)}
                            getLabel={(item) => item.yapKod + ' - ' + item.yapAcik}
                            onSelect={handleYapKodSelect}
                          />
                        </InventoryCountOpsField>
                        <InventoryCountOpsField label={t('inventoryCount.fields.rack')}>
                          <OpsInput value={scope.rackCode} onChange={(event) => updateScope(index, (current) => ({ ...current, rackCode: event.target.value }))} placeholder={t('inventoryCount.placeholders.enterRack')} />
                        </InventoryCountOpsField>
                        <InventoryCountOpsField label={t('inventoryCount.fields.cell')}>
                          <OpsInput value={scope.cellCode} onChange={(event) => updateScope(index, (current) => ({ ...current, cellCode: event.target.value }))} placeholder={t('inventoryCount.placeholders.enterCell')} />
                        </InventoryCountOpsField>
                      </div>
                    </InventoryCountOpsScopePanel>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <InventoryCountOpsSectionHeader
                  title={t('inventoryCount.create.readyTitle')}
                  description={t('inventoryCount.create.readyDescription')}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <InventoryCountOpsCallout
                  tone="success"
                  title={t('inventoryCount.create.summaryTitle')}
                  body={summaryText}
                />

                <InventoryCountOpsCallout
                  tone="warn"
                  title={t('inventoryCount.create.modeHintTitle')}
                  body={(
                    <ul className="mt-1 list-none space-y-1 p-0">
                      <li>{`• ${draft.countMode === 'Blind' ? t('inventoryCount.create.modeHints.blind', { defaultValue: 'Depocu sistem miktarını görmez, sadece saydığını girer.' }) : t('inventoryCount.create.modeHints.open', { defaultValue: 'Depocu beklenen miktarı da görür.' })}`}</li>
                      <li>{`• ${draft.freezeMode === 'Hard' ? t('inventoryCount.create.modeHints.freezeHard', { defaultValue: 'Sayım kapsamı sırasında hareketler sert şekilde engellenir.' }) : t('inventoryCount.create.modeHints.freezeSoft', { defaultValue: 'Hareketler tamamen durdurulmaz.' })}`}</li>
                    </ul>
                  )}
                />

                <InventoryCountOpsCallout
                  tone="info"
                  title={t('inventoryCount.create.nextStepTitle')}
                  body={(
                    <ol className="mt-1 list-decimal space-y-1 pl-4">
                      <li>{t('inventoryCount.create.nextStepOne')}</li>
                      <li>{t('inventoryCount.create.nextStepTwo')}</li>
                      <li>{t('inventoryCount.create.nextStepThree')}</li>
                    </ol>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </OpsFormPageShell>
      ) : null}
    </>
  );
}
