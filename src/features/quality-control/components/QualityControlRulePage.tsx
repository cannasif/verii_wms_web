import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { OpsActionButton, OpsFieldShell, OpsFormPageShell, OpsInput, OpsTextarea, OpsToggleField } from '@/components/shared';
import { OPS_FIELD_CLASS, OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { StockLookup } from '@/features/shared/api/lookup-types';
import { useUIStore } from '@/stores/ui-store';
import { qualityControlApi } from '../api/quality-control.api';
import type { CreateInventoryQualityRuleDto, InventoryQualityRuleDto } from '../types/quality-control.types';
import { buildStockLabel, createEmptyQualityRule } from './quality-control/shared';
import { QcOpsField, QcOpsGuidance } from './quality-control/ops-form-ui';

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
    <OpsFormPageShell
      eyebrow={
        <>
          <span>{t('qualityControl.breadcrumb.parent')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('qualityControl.breadcrumb.module')}</span>
        </>
      }
      title={t('qualityControl.rules.title')}
      description={t('qualityControl.rules.description')}
    >
      <div className="wms-ops-form space-y-6">
        <QcOpsGuidance
          title={t('qualityControl.rules.guidanceTitle')}
          lines={[t('qualityControl.rules.guidance1'), t('qualityControl.rules.guidance2')]}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <QcOpsField label={t('qualityControl.rules.fields.scopeType')}>
            <OpsFieldShell>
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
                <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                  <SelectItem value="Stock">{t('qualityControl.rules.scopeTypes.stock')}</SelectItem>
                  <SelectItem value="StockGroup">{t('qualityControl.rules.scopeTypes.stockGroup')}</SelectItem>
                </SelectContent>
              </Select>
            </OpsFieldShell>
          </QcOpsField>

          {formState.scopeType === 'Stock' ? (
            <QcOpsField label={t('qualityControl.rules.fields.stock')} required>
              <OpsFieldShell className={stockDialogOpen ? 'wms-ops-field-shell--active' : undefined}>
                <PagedLookupDialog<StockLookup>
                  variant="ops"
                  open={stockDialogOpen}
                  onOpenChange={setStockDialogOpen}
                  title={t('qualityControl.rules.stockLookup.title')}
                  value={stockSummary}
                  placeholder={t('qualityControl.rules.fields.stockPlaceholder')}
                  searchPlaceholder={t('qualityControl.rules.stockLookup.searchPlaceholder')}
                  triggerClassName={OPS_FIELD_CLASS}
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
              </OpsFieldShell>
            </QcOpsField>
          ) : (
            <QcOpsField label={t('qualityControl.rules.fields.stockGroupCode')} required>
              <OpsInput
                id="stockGroupCode"
                value={formState.stockGroupCode || ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, stockGroupCode: event.target.value }))}
                placeholder={t('qualityControl.rules.fields.stockGroupCodePlaceholder')}
              />
            </QcOpsField>
          )}

          {formState.scopeType === 'StockGroup' ? (
            <QcOpsField label={t('qualityControl.rules.fields.stockGroupName')} className="lg:col-span-2">
              <OpsInput
                id="stockGroupName"
                value={formState.stockGroupName || ''}
                onChange={(event) => setFormState((prev) => ({ ...prev, stockGroupName: event.target.value }))}
                placeholder={t('qualityControl.rules.fields.stockGroupNamePlaceholder')}
              />
            </QcOpsField>
          ) : null}

          <QcOpsField label={t('qualityControl.rules.fields.inspectionMode')}>
            <OpsFieldShell>
              <Select value={formState.inspectionMode} onValueChange={(value) => setFormState((prev) => ({ ...prev, inspectionMode: value }))}>
                <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                  <SelectItem value="NoCheck">{t('qualityControl.rules.inspectionModes.noCheck')}</SelectItem>
                  <SelectItem value="QuickCheck">{t('qualityControl.rules.inspectionModes.quickCheck')}</SelectItem>
                  <SelectItem value="InspectionRequired">{t('qualityControl.rules.inspectionModes.inspectionRequired')}</SelectItem>
                </SelectContent>
              </Select>
            </OpsFieldShell>
          </QcOpsField>

          <QcOpsField label={t('qualityControl.rules.fields.onFailAction')}>
            <OpsFieldShell>
              <Select value={formState.onFailAction} onValueChange={(value) => setFormState((prev) => ({ ...prev, onFailAction: value }))}>
                <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                  <SelectItem value="Quarantine">{t('qualityControl.rules.failActions.quarantine')}</SelectItem>
                  <SelectItem value="Reject">{t('qualityControl.rules.failActions.reject')}</SelectItem>
                  <SelectItem value="ManagerApproval">{t('qualityControl.rules.failActions.managerApproval')}</SelectItem>
                </SelectContent>
              </Select>
            </OpsFieldShell>
          </QcOpsField>

          <QcOpsField label={t('qualityControl.rules.fields.minRemainingShelfLifeDays')}>
            <OpsInput
              id="minShelfLife"
              type="number"
              min={0}
              value={formState.minRemainingShelfLifeDays ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, minRemainingShelfLifeDays: event.target.value ? Number(event.target.value) : null }))}
              placeholder="0"
            />
          </QcOpsField>

          <QcOpsField label={t('qualityControl.rules.fields.nearExpiryWarningDays')}>
            <OpsInput
              id="nearExpiry"
              type="number"
              min={0}
              value={formState.nearExpiryWarningDays ?? ''}
              onChange={(event) => setFormState((prev) => ({ ...prev, nearExpiryWarningDays: event.target.value ? Number(event.target.value) : null }))}
              placeholder="0"
            />
          </QcOpsField>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {([
            ['autoQuarantine', 'qualityControl.rules.fields.autoQuarantine'],
            ['requireLot', 'qualityControl.rules.fields.requireLot'],
            ['requireSerial', 'qualityControl.rules.fields.requireSerial'],
            ['requireExpiry', 'qualityControl.rules.fields.requireExpiry'],
            ['isActive', 'qualityControl.rules.fields.isActive'],
          ] as const).map(([field, labelKey]) => (
            <OpsToggleField
              key={field}
              checked={Boolean(formState[field])}
              onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, [field]: checked }))}
              title={t(labelKey)}
            />
          ))}
        </div>

        <QcOpsField label={t('qualityControl.rules.fields.description')}>
          <OpsTextarea
            id="ruleDescription"
            rows={4}
            value={formState.description || ''}
            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
            placeholder={t('qualityControl.rules.fields.descriptionPlaceholder')}
          />
        </QcOpsField>

        <div className="wms-ops-actions flex flex-wrap gap-3 border-t pt-6">
          <OpsActionButton type="button" variant="primary" onClick={handleSave} disabled={saveMutation.isPending || getByIdMutation.isPending}>
            {isEdit ? t('common.update') : t('common.save')}
          </OpsActionButton>
          <OpsActionButton type="button" variant="secondary" onClick={handleReset}>
            {t('common.clear')}
          </OpsActionButton>
        </div>
      </div>
    </OpsFormPageShell>
  );
}
