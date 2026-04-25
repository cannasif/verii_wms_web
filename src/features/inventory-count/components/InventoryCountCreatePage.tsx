import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { FormPageShell } from '@/components/shared/FormPageShell';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
import { lookupApi } from '@/services/lookup-api';
import { useUIStore } from '@/stores/ui-store';
import { inventoryCountApi } from '../api/inventory-count-api';
import type { StockLookup, WarehouseLookup, YapKodLookup } from '@/services/lookup-types';
import {
  createEmptyInventoryCountDraft,
  createEmptyInventoryCountScopeDraft,
  type CreateInventoryCountHeaderRequest,
  type CreateInventoryCountScopeRequest,
  type InventoryCountCreateDraft,
  type InventoryCountScopeDraft,
} from '../types/inventory-count';

type LookupTarget =
  | { type: 'warehouse'; scopeIndex?: number }
  | { type: 'stock'; scopeIndex?: number }
  | { type: 'yapkod'; scopeIndex?: number };

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
  const { setPageTitle } = useUIStore();
  const permissionAccess = usePermissionAccess();
  const canCreate = permissionAccess.can('wms.inventory-count.create');
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
    setPageTitle(t('inventoryCount.create.title', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const error = validateDraft(t, draft);
      if (error) {
        throw new Error(error);
      }

      const createdHeader = await inventoryCountApi.createHeader(buildHeaderRequest(draft));

      if (draft.countType === 'Combined') {
        for (const scope of draft.scopes) {
          const scopeRequest = buildScopeRequest(createdHeader.id, scope);
          const hasScopeData = Boolean(
            scopeRequest.warehouseCode
            || scopeRequest.stockCode
            || scopeRequest.rackCode
            || scopeRequest.cellCode,
          );

          if (hasScopeData) {
            await inventoryCountApi.createScope(scopeRequest);
          }
        }
      }

      await inventoryCountApi.generateLines(createdHeader.id);
      return createdHeader;
    },
    onSuccess: (header) => {
      toast.success(t('inventoryCount.create.success', {
        defaultValue: 'Missing translation',
      }));
      navigate('/inventory-count/process?headerId=' + String(header.id));
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
    <div className="space-y-6">
      <FormPageShell
        title={t('inventoryCount.create.title', { defaultValue: 'Missing translation' })}
        description={t('inventoryCount.create.description', {
          defaultValue: 'Missing translation',
        })}
        actions={(
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/inventory-count/list')}>
              {t('common.cancel', { defaultValue: 'Missing translation' })}
            </Button>
            <Button type="button" onClick={() => createMutation.mutate()} disabled={!canCreate || createMutation.isPending}>
              {createMutation.isPending
                ? t('common.saving', { defaultValue: 'Missing translation' })
                : t('inventoryCount.create.saveAndPrepare', { defaultValue: 'Missing translation' })}
            </Button>
          </div>
        )}
      >
        {!canCreate ? (
          <Card className="mb-6 border-amber-200 bg-amber-50/80">
            <CardContent className="py-4 text-sm text-amber-900">
              {t('inventoryCount.create.permissionInfo', {
                defaultValue: 'Missing translation',
              })}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('inventoryCount.create.whatToCountTitle', { defaultValue: 'Missing translation' })}</CardTitle>
                <CardDescription>{t('inventoryCount.create.whatToCountDescription', {
                  defaultValue: 'Missing translation',
                })}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('inventoryCount.fields.countType', { defaultValue: 'Missing translation' })}</Label>
                    <Select
                      value={draft.countType}
                      onValueChange={(value) => setDraft((prev) => ({
                        ...prev,
                        countType: value as InventoryCountCreateDraft['countType'],
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countTypeOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('inventoryCount.fields.countMode', { defaultValue: 'Missing translation' })}</Label>
                    <Select
                      value={draft.countMode}
                      onValueChange={(value) => setDraft((prev) => ({
                        ...prev,
                        countMode: value as InventoryCountCreateDraft['countMode'],
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countModeOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-sm text-sky-950">
                  <div className="font-semibold">
                    {countTypeOptions.find((item) => item.value === draft.countType)?.label}
                  </div>
                  <div className="mt-1 leading-6">{getCountTypeDescription(t, draft.countType)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('inventoryCount.create.headerInfoTitle', { defaultValue: 'Missing translation' })}</CardTitle>
                <CardDescription>{t('inventoryCount.create.headerInfoDescription', {
                  defaultValue: 'Missing translation',
                })}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('common.documentNo', { defaultValue: 'Missing translation' })}</Label>
                    <Input value={draft.documentNo} onChange={(event) => setDraft((prev) => ({ ...prev, documentNo: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.documentDate', { defaultValue: 'Missing translation' })}</Label>
                    <Input type="date" value={draft.documentDate} onChange={(event) => setDraft((prev) => ({ ...prev, documentDate: event.target.value }))} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('inventoryCount.fields.plannedStartDate', { defaultValue: 'Missing translation' })}</Label>
                    <Input type="date" value={draft.plannedStartDate} onChange={(event) => setDraft((prev) => ({ ...prev, plannedStartDate: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('inventoryCount.fields.plannedEndDate', { defaultValue: 'Missing translation' })}</Label>
                    <Input type="date" value={draft.plannedEndDate} onChange={(event) => setDraft((prev) => ({ ...prev, plannedEndDate: event.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('common.description', { defaultValue: 'Missing translation' })}</Label>
                  <Textarea value={draft.description1} onChange={(event) => setDraft((prev) => ({ ...prev, description1: event.target.value }))} rows={3} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('inventoryCount.fields.freezeMode', { defaultValue: 'Missing translation' })}</Label>
                    <Select
                      value={draft.freezeMode}
                      onValueChange={(value) => setDraft((prev) => ({
                        ...prev,
                        freezeMode: value as InventoryCountCreateDraft['freezeMode'],
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {freezeModeOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{t('inventoryCount.fields.isFirstCount', { defaultValue: 'Missing translation' })}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('inventoryCount.create.firstCountHint', { defaultValue: 'Missing translation' })}
                      </div>
                    </div>
                    <Switch checked={draft.isFirstCount} onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, isFirstCount: checked }))} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {draft.countType !== 'Combined' ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t('inventoryCount.create.scopeTitle', { defaultValue: 'Missing translation' })}</CardTitle>
                  <CardDescription>{t('inventoryCount.create.scopeDescription', {
                    defaultValue: 'Missing translation',
                  })}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('inventoryCount.fields.warehouse', { defaultValue: 'Missing translation' })}</Label>
                    <PagedLookupDialog
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
                  </div>
                  <div className="space-y-2">
                    <Label>{t('inventoryCount.fields.stock', { defaultValue: 'Missing translation' })}</Label>
                    <PagedLookupDialog
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
                  </div>
                  <div className="space-y-2">
                    <Label>{t('inventoryCount.fields.yapKod', { defaultValue: 'Missing translation' })}</Label>
                    <PagedLookupDialog
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
                  </div>
                  <div className="space-y-2">
                    <Label>{t('inventoryCount.fields.rack', { defaultValue: 'Missing translation' })}</Label>
                    <Input value={draft.rackCode} onChange={(event) => setDraft((prev) => ({ ...prev, rackCode: event.target.value }))} placeholder={t('inventoryCount.placeholders.enterRack', { defaultValue: 'Missing translation' })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('inventoryCount.fields.cell', { defaultValue: 'Missing translation' })}</Label>
                    <Input value={draft.cellCode} onChange={(event) => setDraft((prev) => ({ ...prev, cellCode: event.target.value }))} placeholder={t('inventoryCount.placeholders.enterCell', { defaultValue: 'Missing translation' })} />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>{t('inventoryCount.create.combinedScopeTitle', { defaultValue: 'Missing translation' })}</CardTitle>
                    <CardDescription>{t('inventoryCount.create.combinedScopeDescription')}</CardDescription>
                  </div>
                  <Button type="button" variant="outline" onClick={addScope}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('inventoryCount.create.addScope', { defaultValue: 'Missing translation' })}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {draft.scopes.map((scope, index) => (
                    <div key={index} className="rounded-xl border p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm font-semibold">
                          {t('inventoryCount.create.scopeRow', { defaultValue: 'Missing translation', index: index + 1 })}
                        </div>
                        {draft.scopes.length > 1 ? (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeScope(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{t('inventoryCount.fields.scopeType', { defaultValue: 'Missing translation' })}</Label>
                          <Select
                            value={scope.scopeType}
                            onValueChange={(value) => updateScope(index, (current) => ({ ...current, scopeType: value as InventoryCountScopeDraft['scopeType'] }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {scopeTypeOptions.map((item) => (
                                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('inventoryCount.fields.warehouse', { defaultValue: 'Missing translation' })}</Label>
                          <PagedLookupDialog
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
                        </div>
                        <div className="space-y-2">
                          <Label>{t('inventoryCount.fields.stock', { defaultValue: 'Missing translation' })}</Label>
                          <PagedLookupDialog
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
                        </div>
                        <div className="space-y-2">
                          <Label>{t('inventoryCount.fields.yapKod', { defaultValue: 'Missing translation' })}</Label>
                          <PagedLookupDialog
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
                        </div>
                        <div className="space-y-2">
                          <Label>{t('inventoryCount.fields.rack', { defaultValue: 'Missing translation' })}</Label>
                          <Input value={scope.rackCode} onChange={(event) => updateScope(index, (current) => ({ ...current, rackCode: event.target.value }))} placeholder={t('inventoryCount.placeholders.enterRack', { defaultValue: 'Missing translation' })} />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('inventoryCount.fields.cell', { defaultValue: 'Missing translation' })}</Label>
                          <Input value={scope.cellCode} onChange={(event) => updateScope(index, (current) => ({ ...current, cellCode: event.target.value }))} placeholder={t('inventoryCount.placeholders.enterCell', { defaultValue: 'Missing translation' })} />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('inventoryCount.create.readyTitle', { defaultValue: 'Missing translation' })}</CardTitle>
                <CardDescription>{t('inventoryCount.create.readyDescription', {
                  defaultValue: 'Missing translation',
                })}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-950">
                  <div className="font-semibold">{t('inventoryCount.create.summaryTitle', { defaultValue: 'Missing translation' })}</div>
                  <div className="mt-2 leading-6">{summaryText}</div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
                  <div className="font-semibold">{t('inventoryCount.create.modeHintTitle', { defaultValue: 'Missing translation' })}</div>
                  <ul className="mt-2 list-disc space-y-1 pl-4 leading-6">
                    <li>{draft.countMode === 'Blind' ? 'Depocu sistem miktarini gormez, sadece saydigini girer.' : 'Depocu beklenen miktari da gorur.'}</li>
                    <li>{draft.freezeMode === 'Hard' ? 'Sayim kapsami sirasinda hareketler sert sekilde engellenir.' : 'Hareketler tamamen durdurulmaz.'}</li>
                  </ul>
                </div>

                <div className="rounded-xl border p-4 text-sm">
                  <div className="font-semibold">{t('inventoryCount.create.nextStepTitle', { defaultValue: 'Missing translation' })}</div>
                  <ol className="mt-2 list-decimal space-y-1 pl-4 leading-6 text-muted-foreground">
                    <li>{t('inventoryCount.create.nextStepOne', { defaultValue: 'Missing translation' })}</li>
                    <li>{t('inventoryCount.create.nextStepTwo', { defaultValue: 'Missing translation' })}</li>
                    <li>{t('inventoryCount.create.nextStepThree', { defaultValue: 'Missing translation' })}</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </FormPageShell>
    </div>
  );
}
