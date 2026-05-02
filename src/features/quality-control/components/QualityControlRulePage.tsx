import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FormPageShell } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { lookupApi } from '@/services/lookup-api';
import type { StockLookup } from '@/services/lookup-types';
import { useUIStore } from '@/stores/ui-store';
import { qualityControlApi } from '../api/quality-control.api';
import type { CreateInventoryQualityRuleDto, InventoryQualityRuleDto } from '../types/quality-control.types';
import { buildStockLabel, createEmptyQualityRule } from './quality-control/shared';

interface LookupPageArgs {
  pageNumber: number;
  pageSize: number;
  search: string;
  signal?: AbortSignal;
}

export function QualityControlRulePage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedStockLabel, setSelectedStockLabel] = useState('');
  const [currentRecord, setCurrentRecord] = useState<InventoryQualityRuleDto | null>(null);
  const [formState, setFormState] = useState<CreateInventoryQualityRuleDto>(createEmptyQualityRule);

  const isEdit = Boolean(currentRecord?.id);

  useEffect(() => {
    setPageTitle(t('qualityControl.rules.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const getByIdMutation = useMutation({
    mutationFn: (id: number) => qualityControlApi.getRuleById(id),
    onSuccess: (data) => {
      setCurrentRecord(data);
      setFormState({
        branchCode: data.branchCode || '0',
        scopeType: data.scopeType,
        stockId: data.stockId ?? null,
        stockGroupCode: data.stockGroupCode || '',
        stockGroupName: data.stockGroupName || '',
        inspectionMode: data.inspectionMode,
        autoQuarantine: data.autoQuarantine,
        requireLot: data.requireLot,
        requireSerial: data.requireSerial,
        requireExpiry: data.requireExpiry,
        minRemainingShelfLifeDays: data.minRemainingShelfLifeDays ?? null,
        nearExpiryWarningDays: data.nearExpiryWarningDays ?? null,
        onFailAction: data.onFailAction,
        isActive: data.isActive,
        description: data.description || '',
      });
      setSelectedStockLabel(buildStockLabel(data.stockCode, data.stockName));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (!idParam) return;
    const id = Number(idParam);
    if (Number.isNaN(id) || id <= 0) return;
    if (currentRecord?.id === id || getByIdMutation.isPending) return;
    getByIdMutation.mutate(id);
  }, [currentRecord?.id, getByIdMutation, searchParams]);

  const saveMutation = useMutation({
    mutationFn: async (dto: CreateInventoryQualityRuleDto) => (
      currentRecord?.id
        ? qualityControlApi.updateRule(currentRecord.id, dto)
        : qualityControlApi.createRule(dto)
    ),
    onSuccess: (data) => {
      setCurrentRecord(data);
      setSearchParams({ id: String(data.id) }, { replace: true });
      toast.success(isEdit ? t('qualityControl.messages.ruleUpdated') : t('qualityControl.messages.ruleCreated'));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const stockSummary = useMemo(
    () => buildStockLabel(currentRecord?.stockCode, currentRecord?.stockName) || selectedStockLabel,
    [currentRecord?.stockCode, currentRecord?.stockName, selectedStockLabel],
  );

  function handleReset(): void {
    setCurrentRecord(null);
    setSelectedStockLabel('');
    setSearchParams({}, { replace: true });
    setFormState(createEmptyQualityRule());
  }

  function handleSave(): void {
    if (formState.scopeType === 'Stock' && !formState.stockId) {
      toast.error(t('qualityControl.messages.ruleStockRequired'));
      return;
    }

    if (formState.scopeType === 'StockGroup' && !formState.stockGroupCode?.trim()) {
      toast.error(t('qualityControl.messages.ruleGroupRequired'));
      return;
    }

    if (!formState.inspectionMode) {
      toast.error(t('qualityControl.messages.ruleInspectionModeRequired'));
      return;
    }

    if (!formState.onFailAction) {
      toast.error(t('qualityControl.messages.ruleFailActionRequired'));
      return;
    }

    saveMutation.mutate({
      ...formState,
      stockGroupCode: formState.scopeType === 'StockGroup' ? formState.stockGroupCode?.trim() || null : null,
      stockGroupName: formState.scopeType === 'StockGroup' ? formState.stockGroupName?.trim() || null : null,
      description: formState.description?.trim() || null,
      minRemainingShelfLifeDays: formState.minRemainingShelfLifeDays || null,
      nearExpiryWarningDays: formState.nearExpiryWarningDays || null,
      stockId: formState.scopeType === 'Stock' ? formState.stockId || null : null,
    });
  }

  return (
    <div className="crm-page space-y-6">
      <Badge variant="secondary">{t('qualityControl.badge')}</Badge>

      <FormPageShell title={t('qualityControl.rules.title')} description={t('qualityControl.rules.description')}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('qualityControl.rules.guidanceTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{t('qualityControl.rules.guidance1')}</p>
              <p>{t('qualityControl.rules.guidance2')}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('qualityControl.rules.fields.scopeType')}</Label>
              <Select
                value={formState.scopeType}
                onValueChange={(value) => setFormState((prev) => ({
                  ...prev,
                  scopeType: value,
                  stockId: value === 'Stock' ? prev.stockId : null,
                  stockGroupCode: value === 'StockGroup' ? prev.stockGroupCode : '',
                  stockGroupName: value === 'StockGroup' ? prev.stockGroupName : '',
                }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stock">{t('qualityControl.rules.scopeTypes.stock')}</SelectItem>
                  <SelectItem value="StockGroup">{t('qualityControl.rules.scopeTypes.stockGroup')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formState.scopeType === 'Stock' ? (
              <div className="space-y-2">
                <Label>{t('qualityControl.rules.fields.stock')} *</Label>
                <PagedLookupDialog<StockLookup>
                  open={stockDialogOpen}
                  onOpenChange={setStockDialogOpen}
                  title={t('qualityControl.rules.stockLookup.title')}
                  description={t('qualityControl.rules.stockLookup.description')}
                  value={stockSummary}
                  placeholder={t('qualityControl.rules.fields.stockPlaceholder')}
                  searchPlaceholder={t('qualityControl.rules.stockLookup.searchPlaceholder')}
                  queryKey={['quality-control', 'rule-stocks']}
                  fetchPage={({ pageNumber, pageSize, search, signal }: LookupPageArgs) =>
                    lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })}
                  getKey={(item) => String(item.id)}
                  getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                  onSelect={(item) => {
                    setFormState((prev) => ({ ...prev, stockId: item.id, stockGroupCode: item.grupKodu || '', stockGroupName: prev.stockGroupName || '' }));
                    setSelectedStockLabel(`${item.stokKodu} - ${item.stokAdi}`);
                  }}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="stockGroupCode">{t('qualityControl.rules.fields.stockGroupCode')} *</Label>
                <Input
                  id="stockGroupCode"
                  value={formState.stockGroupCode || ''}
                  onChange={(event) => setFormState((prev) => ({ ...prev, stockGroupCode: event.target.value }))}
                  placeholder={t('qualityControl.rules.fields.stockGroupCodePlaceholder')}
                />
              </div>
            )}

            {formState.scopeType === 'StockGroup' ? (
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="stockGroupName">{t('qualityControl.rules.fields.stockGroupName')}</Label>
                <Input
                  id="stockGroupName"
                  value={formState.stockGroupName || ''}
                  onChange={(event) => setFormState((prev) => ({ ...prev, stockGroupName: event.target.value }))}
                  placeholder={t('qualityControl.rules.fields.stockGroupNamePlaceholder')}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>{t('qualityControl.rules.fields.inspectionMode')}</Label>
              <Select value={formState.inspectionMode} onValueChange={(value) => setFormState((prev) => ({ ...prev, inspectionMode: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NoCheck">{t('qualityControl.rules.inspectionModes.noCheck')}</SelectItem>
                  <SelectItem value="QuickCheck">{t('qualityControl.rules.inspectionModes.quickCheck')}</SelectItem>
                  <SelectItem value="InspectionRequired">{t('qualityControl.rules.inspectionModes.inspectionRequired')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('qualityControl.rules.fields.onFailAction')}</Label>
              <Select value={formState.onFailAction} onValueChange={(value) => setFormState((prev) => ({ ...prev, onFailAction: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quarantine">{t('qualityControl.rules.failActions.quarantine')}</SelectItem>
                  <SelectItem value="Reject">{t('qualityControl.rules.failActions.reject')}</SelectItem>
                  <SelectItem value="ManagerApproval">{t('qualityControl.rules.failActions.managerApproval')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minShelfLife">{t('qualityControl.rules.fields.minRemainingShelfLifeDays')}</Label>
              <Input
                id="minShelfLife"
                type="number"
                min={0}
                value={formState.minRemainingShelfLifeDays ?? ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, minRemainingShelfLifeDays: event.target.value ? Number(event.target.value) : null }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nearExpiry">{t('qualityControl.rules.fields.nearExpiryWarningDays')}</Label>
              <Input
                id="nearExpiry"
                type="number"
                min={0}
                value={formState.nearExpiryWarningDays ?? ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, nearExpiryWarningDays: event.target.value ? Number(event.target.value) : null }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['autoQuarantine', 'qualityControl.rules.fields.autoQuarantine'],
              ['requireLot', 'qualityControl.rules.fields.requireLot'],
              ['requireSerial', 'qualityControl.rules.fields.requireSerial'],
              ['requireExpiry', 'qualityControl.rules.fields.requireExpiry'],
              ['isActive', 'qualityControl.rules.fields.isActive'],
            ].map(([field, labelKey]) => (
              <div key={field} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label>{t(labelKey)}</Label>
                </div>
                <Switch
                  checked={Boolean(formState[field as keyof CreateInventoryQualityRuleDto])}
                  onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, [field]: checked }))}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ruleDescription">{t('qualityControl.rules.fields.description')}</Label>
            <Textarea
              id="ruleDescription"
              rows={4}
              value={formState.description || ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={t('qualityControl.rules.fields.descriptionPlaceholder')}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={handleSave} disabled={saveMutation.isPending || getByIdMutation.isPending}>
              {isEdit ? t('common.update') : t('common.save')}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              {t('common.clear')}
            </Button>
          </div>
        </div>
      </FormPageShell>
    </div>
  );
}
