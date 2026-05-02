import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FormPageShell } from '@/components/shared';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { lookupApi } from '@/services/lookup-api';
import type { WarehouseLookup } from '@/services/lookup-types';
import { useUIStore } from '@/stores/ui-store';
import { qualityControlApi } from '../api/quality-control.api';
import type { CreateInventoryQualityParameterDto } from '../types/quality-control.types';
import { buildWarehouseLabel } from './quality-control/shared';

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
    () => buildWarehouseLabel(query.data?.defaultQuarantineWarehouseCode, query.data?.defaultQuarantineWarehouseName) || warehouseLabel,
    [query.data?.defaultQuarantineWarehouseCode, query.data?.defaultQuarantineWarehouseName, warehouseLabel],
  );
  const currentApprovedWarehouseLabel = useMemo(
    () => buildWarehouseLabel(query.data?.defaultApprovedWarehouseCode, query.data?.defaultApprovedWarehouseName) || approvedWarehouseLabel,
    [approvedWarehouseLabel, query.data?.defaultApprovedWarehouseCode, query.data?.defaultApprovedWarehouseName],
  );
  const currentRejectWarehouseLabel = useMemo(
    () => buildWarehouseLabel(query.data?.defaultRejectWarehouseCode, query.data?.defaultRejectWarehouseName) || rejectWarehouseLabel,
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
    <div className="crm-page space-y-6">
      <Badge variant="secondary">{t('qualityControl.badge')}</Badge>

      <FormPageShell
        title={t('qualityControl.settings.title')}
        description={t('qualityControl.settings.description')}
        isLoading={query.isLoading}
        isError={Boolean(query.error)}
        errorTitle={t('common.error')}
        errorDescription={query.error instanceof Error ? query.error.message : t('common.generalError')}
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('qualityControl.settings.guidanceTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{t('qualityControl.settings.guidance1')}</p>
              <p>{t('qualityControl.settings.guidance2')}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('qualityControl.settings.fields.defaultInspectionMode')}</Label>
              <Select value={formState.defaultInspectionMode} onValueChange={(value) => setFormState((prev) => ({ ...prev, defaultInspectionMode: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NoCheck">{t('qualityControl.rules.inspectionModes.noCheck')}</SelectItem>
                  <SelectItem value="QuickCheck">{t('qualityControl.rules.inspectionModes.quickCheck')}</SelectItem>
                  <SelectItem value="InspectionRequired">{t('qualityControl.rules.inspectionModes.inspectionRequired')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('qualityControl.settings.fields.defaultOnFailAction')}</Label>
              <Select value={formState.defaultOnFailAction} onValueChange={(value) => setFormState((prev) => ({ ...prev, defaultOnFailAction: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quarantine">{t('qualityControl.rules.failActions.quarantine')}</SelectItem>
                  <SelectItem value="Reject">{t('qualityControl.rules.failActions.reject')}</SelectItem>
                  <SelectItem value="ManagerApproval">{t('qualityControl.rules.failActions.managerApproval')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label>{t('qualityControl.settings.fields.defaultQuarantineWarehouse')}</Label>
              <PagedLookupDialog<WarehouseLookup>
                open={warehouseDialogOpen}
                onOpenChange={setWarehouseDialogOpen}
                title={t('qualityControl.settings.warehouseLookup.title')}
                description={t('qualityControl.settings.warehouseLookup.description')}
                value={currentWarehouseLabel}
                placeholder={t('qualityControl.settings.fields.defaultQuarantineWarehousePlaceholder')}
                searchPlaceholder={t('qualityControl.settings.warehouseLookup.searchPlaceholder')}
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
            </div>

            <div className="space-y-2">
              <Label>{t('qualityControl.settings.fields.defaultApprovedWarehouse')}</Label>
              <PagedLookupDialog<WarehouseLookup>
                open={approvedWarehouseDialogOpen}
                onOpenChange={setApprovedWarehouseDialogOpen}
                title={t('qualityControl.settings.warehouseLookup.title')}
                description={t('qualityControl.settings.warehouseLookup.description')}
                value={currentApprovedWarehouseLabel}
                placeholder={t('qualityControl.settings.fields.defaultApprovedWarehousePlaceholder')}
                searchPlaceholder={t('qualityControl.settings.warehouseLookup.searchPlaceholder')}
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
            </div>

            <div className="space-y-2">
              <Label>{t('qualityControl.settings.fields.defaultRejectWarehouse')}</Label>
              <PagedLookupDialog<WarehouseLookup>
                open={rejectWarehouseDialogOpen}
                onOpenChange={setRejectWarehouseDialogOpen}
                title={t('qualityControl.settings.warehouseLookup.title')}
                description={t('qualityControl.settings.warehouseLookup.description')}
                value={currentRejectWarehouseLabel}
                placeholder={t('qualityControl.settings.fields.defaultRejectWarehousePlaceholder')}
                searchPlaceholder={t('qualityControl.settings.warehouseLookup.searchPlaceholder')}
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
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label>{t('qualityControl.settings.fields.defaultReturnOutboundType')}</Label>
              <Input
                value={formState.defaultReturnOutboundType}
                onChange={(event) => setFormState((prev) => ({ ...prev, defaultReturnOutboundType: event.target.value }))}
                placeholder={t('qualityControl.settings.fields.defaultReturnOutboundTypePlaceholder')}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['autoCreateInspectionOnReceipt', 'qualityControl.settings.fields.autoCreateInspectionOnReceipt'],
              ['useQuarantineWarehouse', 'qualityControl.settings.fields.useQuarantineWarehouse'],
              ['allowDirectReceiptWhenNoRule', 'qualityControl.settings.fields.allowDirectReceiptWhenNoRule'],
              ['blockReceiptWhenLotMissing', 'qualityControl.settings.fields.blockReceiptWhenLotMissing'],
              ['blockReceiptWhenSerialMissing', 'qualityControl.settings.fields.blockReceiptWhenSerialMissing'],
              ['blockReceiptWhenExpiryMissing', 'qualityControl.settings.fields.blockReceiptWhenExpiryMissing'],
              ['requireManagerApprovalForRelease', 'qualityControl.settings.fields.requireManagerApprovalForRelease'],
              ['enableTraceabilityEvents', 'qualityControl.settings.fields.enableTraceabilityEvents'],
              ['enableNearExpiryWarning', 'qualityControl.settings.fields.enableNearExpiryWarning'],
            ].map(([field, labelKey]) => (
              <div key={field} className="flex items-center justify-between rounded-lg border p-4">
                <Label>{t(labelKey)}</Label>
                <Switch
                  checked={Boolean(formState[field as keyof CreateInventoryQualityParameterDto])}
                  onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, [field]: checked }))}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={handleSave} disabled={saveMutation.isPending || query.isLoading}>
              {t('common.save')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormState(createDefaultSettings());
                setWarehouseLabel('');
                setApprovedWarehouseLabel('');
                setRejectWarehouseLabel('');
              }}
            >
              {t('common.clear')}
            </Button>
          </div>
        </div>
      </FormPageShell>
    </div>
  );
}
