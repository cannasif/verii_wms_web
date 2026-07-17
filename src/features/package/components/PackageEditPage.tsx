import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import {
  OpsActionButton,
  OpsFieldShell,
  OpsFormMessage,
  OpsFormPageShell,
  OpsInput,
  OpsTextarea,
  PageState,
} from '@/components/shared';
import { OPS_FIELD_CLASS, OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { packageApi } from '../api/package-api';
import { usePHeader } from '../hooks/usePHeader';
import { useUpdatePHeader } from '../hooks/useUpdatePHeader';
import { useMatchPlines } from '../hooks/useMatchPlines';
import { SearchableSelect } from '@/features/shared';
import { pHeaderFormSchema, CargoCompany, type PHeaderFormData, type PHeaderFormInput, type AvailableHeaderDto } from '../types/package';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { lookupApi } from '@/features/shared/api/lookup-api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Customer, Warehouse } from '@/features/shared';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';

export function PackageEditPage(): ReactElement {
  const { t } = useTranslation(['package', 'common']);
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);
  const [warehouseLookupOpen, setWarehouseLookupOpen] = useState(false);
  const [sourceHeaderLookupOpen, setSourceHeaderLookupOpen] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
  const [selectedWarehouseLabel, setSelectedWarehouseLabel] = useState('');
  const [selectedSourceHeaderLabel, setSelectedSourceHeaderLabel] = useState('');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.package');
  const headerId = id ? parseInt(id, 10) : undefined;
  const { data: header, isLoading } = usePHeader(headerId);
  const updateMutation = useUpdatePHeader();
  const matchPlinesMutation = useMatchPlines();

  const formItemClass = 'wms-ops-form-item';
  const fieldMessage = <OpsFormMessage />;
  const requiredMark = <span className="wms-ops-required"> *</span>;

  const cargoCompanyOptions = useMemo(() => {
    return Object.entries(CargoCompany)
      .filter(([key]) => isNaN(Number(key)))
      .map(([key, value]) => ({
        value: value as number,
        label: t(`package.cargoCompany.${key}`, key),
      }));
  }, [t]);

  const schema = useMemo(() => pHeaderFormSchema(t), [t]);

  const form = useForm<PHeaderFormInput, unknown, PHeaderFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      packingNo: '',
      packingDate: new Date().toISOString().split('T')[0],
      warehouseCode: '',
      sourceType: undefined,
      sourceHeaderId: undefined,
      customerCode: '',
      customerAddress: '',
      status: 'Draft' as const,
      carrierId: undefined,
      carrierServiceType: '',
      trackingNo: '',
    },
  });

  const sourceType = form.watch('sourceType');
  const isReadOnly = !permission.canUpdate;

  useEffect(() => {
    if (!sourceType) {
      form.setValue('sourceHeaderId', undefined);
      setSelectedSourceHeaderLabel('');
    }
  }, [sourceType, form]);

  const sourceTypeOptions = useMemo(
    () => [
      { value: 'GR', label: t('package.sourceType.GR') },
      { value: 'WT', label: t('package.sourceType.WT') },
      { value: 'SH', label: t('package.sourceType.SH') },
      { value: 'PR', label: t('package.sourceType.PR') },
      { value: 'PT', label: t('package.sourceType.PT') },
      { value: 'SIT', label: t('package.sourceType.SIT') },
      { value: 'SRT', label: t('package.sourceType.SRT') },
      { value: 'WI', label: t('package.sourceType.WI') },
      { value: 'WO', label: t('package.sourceType.WO') },
    ],
    [t]
  );

  const getHeaderDisplayLabel = (headerItem: AvailableHeaderDto): string => {
    const parts = [`#${headerItem.id}`];
    if (headerItem.documentNo) {
      parts.push(headerItem.documentNo);
    }
    if (headerItem.customerName) {
      parts.push(headerItem.customerName);
    }
    return parts.join(' - ');
  };

  useEffect(() => {
    if (header) {
      form.reset({
        packingNo: header.packingNo,
        packingDate: header.packingDate ? header.packingDate.split('T')[0] : new Date().toISOString().split('T')[0],
        warehouseCode: header.warehouseCode || '',
        sourceType: header.sourceType,
        sourceHeaderId: header.sourceHeaderId,
        customerCode: header.customerCode || '',
        customerAddress: header.customerAddress || '',
        status: header.status,
        carrierId: header.carrierId,
        carrierServiceType: header.carrierServiceType || '',
        trackingNo: header.trackingNo || '',
      });
      setSelectedSourceHeaderLabel(
        header.sourceHeaderId
          ? [`#${header.sourceHeaderId}`, header.customerCode].filter(Boolean).join(' - ')
          : '',
      );
    }
  }, [header, form]);

  useEffect(() => {
    setPageTitle(t('package.edit.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const onSubmit = async (data: PHeaderFormData): Promise<void> => {
    if (!headerId) return;

    try {
      await updateMutation.mutateAsync({
        id: headerId,
        data: {
          packingNo: data.packingNo,
          packingDate: data.packingDate || undefined,
          warehouseCode: data.warehouseCode || undefined,
          sourceType: data.sourceType,
          sourceHeaderId: data.sourceHeaderId,
          customerCode: data.customerCode || undefined,
          customerAddress: data.customerAddress || undefined,
          status: data.status || 'Draft',
          carrierId: data.carrierId,
          carrierServiceType: data.carrierServiceType || undefined,
          trackingNo: data.trackingNo || undefined,
        },
      });
      toast.success(t('package.edit.success'));
      navigate(`/package/detail/${headerId}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.edit.error')
      );
    }
  };

  const handleMatchToggle = async (): Promise<void> => {
    if (!permission.canUpdate || !headerId || !header) return;

    try {
      await matchPlinesMutation.mutateAsync({
        pHeaderId: headerId,
        isMatched: !header.isMatched,
      });
      toast.success(
        header.isMatched
          ? t('package.edit.unmatchSuccess')
          : t('package.edit.matchSuccess')
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.edit.matchError')
      );
    }
  };

  const isFormDisabled = isReadOnly || updateMutation.isPending;

  return (
    <Form {...form}>
      <OpsFormPageShell
        eyebrow={
          <>
            <span>{t('package.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('package.create.breadcrumb.module')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('common.edit')}</span>
          </>
        }
        title={t('package.edit.title')}
        description={t('package.edit.description')}
        actions={
          header?.sourceType && header?.sourceHeaderId ? (
            <OpsActionButton
              type="button"
              variant={header.isMatched ? 'secondary' : 'primary'}
              onClick={handleMatchToggle}
              disabled={!permission.canUpdate || matchPlinesMutation.isPending}
            >
              {matchPlinesMutation.isPending
                ? t('common.saving')
                : header.isMatched
                  ? t('package.edit.unmatch')
                  : t('package.edit.match')}
            </OpsActionButton>
          ) : headerId ? (
            <span className="wms-ops-code-badge">#{headerId}</span>
          ) : null
        }
      >
        {!permission.canUpdate ? <PermissionNotice /> : null}

        {isLoading ? (
          <PageState tone="loading" title={t('common.loading')} compact />
        ) : null}

        {!isLoading && !header ? (
          <PageState tone="error" title={t('package.edit.notFound')} compact />
        ) : null}

        {header ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 wms-ops-form">
            <fieldset
              disabled={isFormDisabled}
              className={cn(isFormDisabled && 'pointer-events-none opacity-75')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="packingNo"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>
                        {t('package.form.packingNo')}
                        {requiredMark}
                      </FormLabel>
                      <FormControl>
                        <OpsInput {...field} />
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="packingDate"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.packingDate')}</FormLabel>
                      <FormControl>
                        <OpsInput type="date" {...field} />
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceType"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.sourceType')}</FormLabel>
                      <FormControl>
                        <OpsFieldShell>
                          <SearchableSelect<{ value: string; label: string }>
                            value={field.value || ''}
                            onValueChange={(value) => {
                              field.onChange(value || undefined);
                              form.setValue('sourceHeaderId', undefined);
                            }}
                            options={sourceTypeOptions}
                            getOptionValue={(opt) => opt.value}
                            getOptionLabel={(opt) => opt.label}
                            placeholder={t('package.form.selectSourceType')}
                            searchPlaceholder={t('common.search')}
                            emptyText={t('package.form.noSourceType')}
                            itemLimit={100}
                            className={OPS_FIELD_CLASS}
                            popoverClassName="wms-ops-lookup-popover"
                          />
                        </OpsFieldShell>
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceHeaderId"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.sourceHeaderId')}</FormLabel>
                      <FormControl>
                        <OpsFieldShell className={sourceHeaderLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                          <PagedLookupDialog<AvailableHeaderDto>
                            variant="ops"
                            open={sourceHeaderLookupOpen}
                            onOpenChange={setSourceHeaderLookupOpen}
                            title={t('package.form.sourceHeaderId')}
                            value={selectedSourceHeaderLabel || (field.value ? `#${field.value}` : '')}
                            placeholder={t('package.form.selectSourceHeader')}
                            searchPlaceholder={t('common.search')}
                            emptyText={
                              sourceType
                                ? t('package.form.noAvailableHeaders')
                                : t('package.form.selectSourceTypeFirst')
                            }
                            disabled={!sourceType}
                            triggerClassName={OPS_FIELD_CLASS}
                            queryKey={['package-edit', 'available-headers', sourceType || 'none']}
                            fetchPage={({ pageNumber, pageSize, search, signal }) =>
                              packageApi.getAvailableHeadersForMappingPaged(sourceType!, { pageNumber, pageSize, search }, { signal })
                            }
                            getKey={(headerItem) => headerItem.id.toString()}
                            getLabel={getHeaderDisplayLabel}
                            onSelect={(headerItem) => {
                              field.onChange(headerItem.id);
                              form.clearErrors('sourceHeaderId');
                              setSelectedSourceHeaderLabel(getHeaderDisplayLabel(headerItem));
                            }}
                          />
                        </OpsFieldShell>
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warehouseCode"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.warehouseCode')}</FormLabel>
                      <FormControl>
                        <OpsFieldShell className={warehouseLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                          <PagedLookupDialog<Warehouse>
                            variant="ops"
                            open={warehouseLookupOpen}
                            onOpenChange={setWarehouseLookupOpen}
                            title={t('package.form.selectWarehouse')}
                            value={selectedWarehouseLabel || field.value}
                            placeholder={t('package.form.selectWarehouse')}
                            searchPlaceholder={t('common.search')}
                            emptyText={t('common.notFound')}
                            triggerClassName={OPS_FIELD_CLASS}
                            queryKey={['package-edit', 'warehouse']}
                            fetchPage={({ pageNumber, pageSize, search, signal }) =>
                              lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                            }
                            getKey={(warehouse) => warehouse.id.toString()}
                            getLabel={(warehouse) => `${warehouse.depoIsmi} (${warehouse.depoKodu})`}
                            onSelect={(warehouse) => {
                              field.onChange(warehouse.depoKodu.toString());
                              form.clearErrors('warehouseCode');
                              setSelectedWarehouseLabel(`${warehouse.depoIsmi} (${warehouse.depoKodu})`);
                            }}
                          />
                        </OpsFieldShell>
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerCode"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.customerCode')}</FormLabel>
                      <FormControl>
                        <OpsFieldShell className={customerLookupOpen ? 'wms-ops-field-shell--active' : undefined}>
                          <PagedLookupDialog<Customer>
                            variant="ops"
                            open={customerLookupOpen}
                            onOpenChange={setCustomerLookupOpen}
                            title={t('package.form.selectCustomer')}
                            value={selectedCustomerLabel || field.value}
                            placeholder={t('package.form.selectCustomer')}
                            searchPlaceholder={t('common.search')}
                            emptyText={t('common.notFound')}
                            triggerClassName={OPS_FIELD_CLASS}
                            queryKey={['package-edit', 'customer']}
                            fetchPage={({ pageNumber, pageSize, search, signal }) =>
                              lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })
                            }
                            getKey={(customer) => customer.id.toString()}
                            getLabel={(customer) => `${customer.cariIsim} (${customer.cariKod})`}
                            onSelect={(customer) => {
                              field.onChange(customer.cariKod);
                              form.clearErrors('customerCode');
                              setSelectedCustomerLabel(`${customer.cariIsim} (${customer.cariKod})`);
                            }}
                          />
                        </OpsFieldShell>
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.status')}</FormLabel>
                      <OpsFieldShell>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                            <SelectItem value="Draft">{t('package.status.draft')}</SelectItem>
                            <SelectItem value="Packing">{t('package.status.packing')}</SelectItem>
                            <SelectItem value="Packed">{t('package.status.packed')}</SelectItem>
                            <SelectItem value="Shipped">{t('package.status.shipped')}</SelectItem>
                            <SelectItem value="Cancelled">{t('package.status.cancelled')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </OpsFieldShell>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carrierId"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.carrierId')}</FormLabel>
                      <FormControl>
                        <OpsFieldShell>
                          <SearchableSelect<{ value: number; label: string }>
                            value={field.value?.toString() || ''}
                            onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : undefined)}
                            options={cargoCompanyOptions}
                            getOptionValue={(opt) => opt.value.toString()}
                            getOptionLabel={(opt) => opt.label}
                            placeholder={t('package.form.selectCarrier')}
                            searchPlaceholder={t('common.search')}
                            emptyText={t('package.form.noCarrier')}
                            itemLimit={100}
                            className={OPS_FIELD_CLASS}
                            popoverClassName="wms-ops-lookup-popover"
                          />
                        </OpsFieldShell>
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carrierServiceType"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.carrierServiceType')}</FormLabel>
                      <FormControl>
                        <OpsInput {...field} />
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackingNo"
                  render={({ field }) => (
                    <FormItem className={formItemClass}>
                      <FormLabel>{t('package.form.trackingNo')}</FormLabel>
                      <FormControl>
                        <OpsInput {...field} />
                      </FormControl>
                      {fieldMessage}
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="customerAddress"
                render={({ field }) => (
                  <FormItem className={formItemClass}>
                    <FormLabel className="wms-ops-notes-label">
                      {t('package.form.customerAddress')}
                    </FormLabel>
                    <FormControl>
                      <OpsTextarea {...field} rows={3} />
                    </FormControl>
                    {fieldMessage}
                  </FormItem>
                )}
              />
            </fieldset>

            <div className="wms-ops-actions flex justify-between gap-4 border-t pt-6">
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => navigate('/package/list')}
              >
                <ChevronLeft className="size-3.5" aria-hidden />
                {t('common.cancel')}
              </OpsActionButton>
              <OpsActionButton
                type="submit"
                variant="primary"
                disabled={isFormDisabled}
              >
                {updateMutation.isPending ? t('common.saving') : t('common.save')}
              </OpsActionButton>
            </div>
          </form>
        ) : null}
      </OpsFormPageShell>
    </Form>
  );
}
