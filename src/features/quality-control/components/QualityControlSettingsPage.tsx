import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { OpsActionButton, OpsFieldShell, OpsFormPageShell, OpsInput, OpsToggleField, PageState } from '@/components/shared';
import { OPS_FIELD_CLASS, OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { DefinitionExcelActions } from '@/features/definition-excel';
import type { WarehouseLookup } from '@/features/shared/api/lookup-types';
import { useUIStore } from '@/stores/ui-store';
import { qualityControlApi } from '../api/quality-control.api';
import type { CreateInventoryQualityParameterDto } from '../types/quality-control.types';
import { buildWarehouseLabel } from './quality-control/shared';
import { QcOpsField, QcOpsGuidance } from './quality-control/ops-form-ui';

interface LookupPageArgs {
  pageNumber: number;
  pageSize: number;
  search: string;
  signal?: AbortSignal;
}

function createDefaultSettings(): CreateInventoryQualityParameterDto {
  return {
    branchCode: '0',
    autoCreateInspectionOnReceipt: false,
    defaultInspectionMode: 'NoCheck',
    defaultOnFailAction: 'Quarantine',
    useQuarantineWarehouse: false,
    defaultQuarantineWarehouseId: null,
    defaultApprovedWarehouseId: null,
    defaultRejectWarehouseId: null,
    defaultReturnOutboundType: 'QRETURN',
    allowDirectReceiptWhenNoRule: true,
    blockReceiptWhenLotMissing: false,
    blockReceiptWhenSerialMissing: false,
    blockReceiptWhenExpiryMissing: false,
    requireManagerApprovalForRelease: false,
    enableTraceabilityEvents: true,
    enableNearExpiryWarning: true,
  };
}

export function QualityControlSettingsPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [approvedWarehouseDialogOpen, setApprovedWarehouseDialogOpen] = useState(false);
  const [rejectWarehouseDialogOpen, setRejectWarehouseDialogOpen] = useState(false);
  const [warehouseLabel, setWarehouseLabel] = useState('');
  const [approvedWarehouseLabel, setApprovedWarehouseLabel] = useState('');
  const [rejectWarehouseLabel, setRejectWarehouseLabel] = useState('');
  const [formState, setFormState] = useState<CreateInventoryQualityParameterDto>(createDefaultSettings);

  useEffect(() => {
    setPageTitle(t('qualityControl.settings.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const query = useQuery({
    queryKey: ['quality-control', 'settings'],
    queryFn: () => qualityControlApi.getParameter('0'),
  });

  useEffect(() => {
    if (!query.data) return;
    setFormState({
      branchCode: query.data.branchCode || '0',
      autoCreateInspectionOnReceipt: query.data.autoCreateInspectionOnReceipt,
      defaultInspectionMode: query.data.defaultInspectionMode,
      defaultOnFailAction: query.data.defaultOnFailAction,
      useQuarantineWarehouse: query.data.useQuarantineWarehouse,
      defaultQuarantineWarehouseId: query.data.defaultQuarantineWarehouseId ?? null,
      defaultApprovedWarehouseId: query.data.defaultApprovedWarehouseId ?? null,
      defaultRejectWarehouseId: query.data.defaultRejectWarehouseId ?? null,
      defaultReturnOutboundType: query.data.defaultReturnOutboundType || 'QRETURN',
      allowDirectReceiptWhenNoRule: query.data.allowDirectReceiptWhenNoRule,
      blockReceiptWhenLotMissing: query.data.blockReceiptWhenLotMissing,
      blockReceiptWhenSerialMissing: query.data.blockReceiptWhenSerialMissing,
      blockReceiptWhenExpiryMissing: query.data.blockReceiptWhenExpiryMissing,
      requireManagerApprovalForRelease: query.data.requireManagerApprovalForRelease,
      enableTraceabilityEvents: query.data.enableTraceabilityEvents,
      enableNearExpiryWarning: query.data.enableNearExpiryWarning,
    });
    setWarehouseLabel(buildWarehouseLabel(query.data.defaultQuarantineWarehouseCode, query.data.defaultQuarantineWarehouseName));
    setApprovedWarehouseLabel(buildWarehouseLabel(query.data.defaultApprovedWarehouseCode, query.data.defaultApprovedWarehouseName));
    setRejectWarehouseLabel(buildWarehouseLabel(query.data.defaultRejectWarehouseCode, query.data.defaultRejectWarehouseName));
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: (dto: CreateInventoryQualityParameterDto) => qualityControlApi.saveParameter(dto),
    onSuccess: async () => {
      toast.success(t('qualityControl.messages.settingsSaved'));
      await query.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const currentWarehouseLabel = useMemo(
    () => warehouseLabel || buildWarehouseLabel(query.data?.defaultQuarantineWarehouseCode, query.data?.defaultQuarantineWarehouseName),
    [query.data?.defaultQuarantineWarehouseCode, query.data?.defaultQuarantineWarehouseName, warehouseLabel],
  );
  const currentApprovedWarehouseLabel = useMemo(
    () => approvedWarehouseLabel || buildWarehouseLabel(query.data?.defaultApprovedWarehouseCode, query.data?.defaultApprovedWarehouseName),
    [approvedWarehouseLabel, query.data?.defaultApprovedWarehouseCode, query.data?.defaultApprovedWarehouseName],
  );
  const currentRejectWarehouseLabel = useMemo(
    () => rejectWarehouseLabel || buildWarehouseLabel(query.data?.defaultRejectWarehouseCode, query.data?.defaultRejectWarehouseName),
    [query.data?.defaultRejectWarehouseCode, query.data?.defaultRejectWarehouseName, rejectWarehouseLabel],
  );

  function handleSave(): void {
    if (formState.useQuarantineWarehouse && !formState.defaultQuarantineWarehouseId) {
      toast.error(t('qualityControl.messages.settingsQuarantineWarehouseRequired'));
      return;
    }

    saveMutation.mutate(formState);
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
      title={t('qualityControl.settings.title')}
      description={t('qualityControl.settings.description')}
    >
      {query.isLoading ? (
        <PageState tone="loading" title={t('common.loading')} compact />
      ) : null}

      {query.error ? (
        <PageState
          tone="error"
          title={t('common.error')}
          description={query.error instanceof Error ? query.error.message : t('common.generalError')}
          compact
        />
      ) : null}

      {!query.isLoading && !query.error ? (
        <div className="wms-ops-form space-y-6">
          <QcOpsGuidance
            title={t('qualityControl.settings.guidanceTitle')}
            lines={[t('qualityControl.settings.guidance1'), t('qualityControl.settings.guidance2')]}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <QcOpsField label={t('qualityControl.settings.fields.defaultInspectionMode')}>
              <OpsFieldShell>
                <Select value={formState.defaultInspectionMode} onValueChange={(value) => setFormState((prev) => ({ ...prev, defaultInspectionMode: value }))}>
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

            <QcOpsField label={t('qualityControl.settings.fields.defaultOnFailAction')}>
              <OpsFieldShell>
                <Select value={formState.defaultOnFailAction} onValueChange={(value) => setFormState((prev) => ({ ...prev, defaultOnFailAction: value }))}>
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

            <QcOpsField label={t('qualityControl.settings.fields.defaultQuarantineWarehouse')} className="lg:col-span-2">
              <OpsFieldShell className={warehouseDialogOpen ? 'wms-ops-field-shell--active' : undefined}>
                <PagedLookupDialog<WarehouseLookup>
                  variant="ops"
                  open={warehouseDialogOpen}
                  onOpenChange={setWarehouseDialogOpen}
                  title={t('qualityControl.settings.warehouseLookup.title')}
                  value={currentWarehouseLabel}
                  placeholder={t('qualityControl.settings.fields.defaultQuarantineWarehousePlaceholder')}
                  searchPlaceholder={t('qualityControl.settings.warehouseLookup.searchPlaceholder')}
                  triggerClassName={OPS_FIELD_CLASS}
                  queryKey={['quality-control', 'settings-warehouses']}
                  fetchPage={({ pageNumber, pageSize, search, signal }: LookupPageArgs) =>
                    lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })}
                  getKey={(item) => String(item.id)}
                  getLabel={(item) => `${item.depoKodu} - ${item.depoIsmi}`}
                  onSelect={(item) => {
                    setFormState((prev) => ({ ...prev, defaultQuarantineWarehouseId: item.id }));
                    setWarehouseLabel(`${item.depoKodu} - ${item.depoIsmi}`);
                  }}
                  disabled={!formState.useQuarantineWarehouse}
                />
              </OpsFieldShell>
            </QcOpsField>

            <QcOpsField label={t('qualityControl.settings.fields.defaultApprovedWarehouse')}>
              <OpsFieldShell className={approvedWarehouseDialogOpen ? 'wms-ops-field-shell--active' : undefined}>
                <PagedLookupDialog<WarehouseLookup>
                  variant="ops"
                  open={approvedWarehouseDialogOpen}
                  onOpenChange={setApprovedWarehouseDialogOpen}
                  title={t('qualityControl.settings.warehouseLookup.title')}
                  value={currentApprovedWarehouseLabel}
                  placeholder={t('qualityControl.settings.fields.defaultApprovedWarehousePlaceholder')}
                  searchPlaceholder={t('qualityControl.settings.warehouseLookup.searchPlaceholder')}
                  triggerClassName={OPS_FIELD_CLASS}
                  queryKey={['quality-control', 'settings-approved-warehouses']}
                  fetchPage={({ pageNumber, pageSize, search, signal }: LookupPageArgs) =>
                    lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })}
                  getKey={(item) => String(item.id)}
                  getLabel={(item) => `${item.depoKodu} - ${item.depoIsmi}`}
                  onSelect={(item) => {
                    setFormState((prev) => ({ ...prev, defaultApprovedWarehouseId: item.id }));
                    setApprovedWarehouseLabel(`${item.depoKodu} - ${item.depoIsmi}`);
                  }}
                />
              </OpsFieldShell>
            </QcOpsField>

            <QcOpsField label={t('qualityControl.settings.fields.defaultRejectWarehouse')}>
              <OpsFieldShell className={rejectWarehouseDialogOpen ? 'wms-ops-field-shell--active' : undefined}>
                <PagedLookupDialog<WarehouseLookup>
                  variant="ops"
                  open={rejectWarehouseDialogOpen}
                  onOpenChange={setRejectWarehouseDialogOpen}
                  title={t('qualityControl.settings.warehouseLookup.title')}
                  value={currentRejectWarehouseLabel}
                  placeholder={t('qualityControl.settings.fields.defaultRejectWarehousePlaceholder')}
                  searchPlaceholder={t('qualityControl.settings.warehouseLookup.searchPlaceholder')}
                  triggerClassName={OPS_FIELD_CLASS}
                  queryKey={['quality-control', 'settings-reject-warehouses']}
                  fetchPage={({ pageNumber, pageSize, search, signal }: LookupPageArgs) =>
                    lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })}
                  getKey={(item) => String(item.id)}
                  getLabel={(item) => `${item.depoKodu} - ${item.depoIsmi}`}
                  onSelect={(item) => {
                    setFormState((prev) => ({ ...prev, defaultRejectWarehouseId: item.id }));
                    setRejectWarehouseLabel(`${item.depoKodu} - ${item.depoIsmi}`);
                  }}
                />
              </OpsFieldShell>
            </QcOpsField>

            <QcOpsField label={t('qualityControl.settings.fields.defaultReturnOutboundType')} className="lg:col-span-2">
              <OpsInput
                value={formState.defaultReturnOutboundType}
                onChange={(event) => setFormState((prev) => ({ ...prev, defaultReturnOutboundType: event.target.value }))}
                placeholder={t('qualityControl.settings.fields.defaultReturnOutboundTypePlaceholder')}
              />
            </QcOpsField>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {([
              ['autoCreateInspectionOnReceipt', 'qualityControl.settings.fields.autoCreateInspectionOnReceipt'],
              ['useQuarantineWarehouse', 'qualityControl.settings.fields.useQuarantineWarehouse'],
              ['allowDirectReceiptWhenNoRule', 'qualityControl.settings.fields.allowDirectReceiptWhenNoRule'],
              ['blockReceiptWhenLotMissing', 'qualityControl.settings.fields.blockReceiptWhenLotMissing'],
              ['blockReceiptWhenSerialMissing', 'qualityControl.settings.fields.blockReceiptWhenSerialMissing'],
              ['blockReceiptWhenExpiryMissing', 'qualityControl.settings.fields.blockReceiptWhenExpiryMissing'],
              ['requireManagerApprovalForRelease', 'qualityControl.settings.fields.requireManagerApprovalForRelease'],
              ['enableTraceabilityEvents', 'qualityControl.settings.fields.enableTraceabilityEvents'],
              ['enableNearExpiryWarning', 'qualityControl.settings.fields.enableNearExpiryWarning'],
            ] as const).map(([field, labelKey]) => (
              <OpsToggleField
                key={field}
                checked={Boolean(formState[field])}
                onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, [field]: checked }))}
                title={t(labelKey)}
              />
            ))}
          </div>

          <div className="wms-ops-actions flex flex-wrap items-center justify-between gap-3 border-t pt-6">
            <DefinitionExcelActions
              variant="ops-toolbar"
              showLastJobSummary={false}
              definitionKey="quality-control-parameter"
              fileNamePrefix="kalite-kontrol-ayarlari"
              onImportCompleted={async () => {
                await query.refetch();
              }}
            />
            <div className="flex flex-wrap gap-3">
              <OpsActionButton type="button" variant="primary" onClick={handleSave} disabled={saveMutation.isPending || query.isLoading}>
                {t('common.save')}
              </OpsActionButton>
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setFormState(createDefaultSettings());
                  setWarehouseLabel('');
                  setApprovedWarehouseLabel('');
                  setRejectWarehouseLabel('');
                }}
              >
                {t('common.clear')}
              </OpsActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </OpsFormPageShell>
  );
}
