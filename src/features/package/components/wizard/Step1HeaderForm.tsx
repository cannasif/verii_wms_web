import { type ReactElement, useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import {
  OpsActionButton,
  OpsFieldShell,
  OpsFormMessage,
  OpsInput,
  OpsTextarea,
} from '@/components/shared';
import { OPS_FIELD_CLASS, OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { SearchableSelect } from '@/features/shared';
import { packageApi } from '../../api/package-api';
import { pHeaderFormSchema, CargoCompany, type PHeaderFormData, type PHeaderFormInput, type PHeaderDto, type AvailableHeaderDto } from '../../types/package';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { lookupApi } from '@/features/shared/api/lookup-api';
import type { Customer, Warehouse } from '@/features/shared';

interface Step1HeaderFormProps {
  initialData?: PHeaderDto;
  onSubmit: (data: PHeaderFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'default' | 'ops';
}

const mapHeaderToFormValues = (data: PHeaderDto): PHeaderFormInput => ({
  packingNo: data.packingNo,
  packingDate: data.packingDate ? data.packingDate.split('T')[0] : new Date().toISOString().split('T')[0],
  warehouseCode: data.warehouseCode || '',
  sourceType: data.sourceType ?? undefined,
  sourceHeaderId: data.sourceHeaderId ?? undefined,
  customerCode: data.customerCode || '',
  customerAddress: data.customerAddress || '',
  status: data.status || 'Draft',
  carrierId: data.carrierId ?? undefined,
  carrierServiceType: data.carrierServiceType || '',
  trackingNo: data.trackingNo || '',
});

export function Step1HeaderForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  variant = 'default',
}: Step1HeaderFormProps): ReactElement {
  const { t } = useTranslation(['package', 'common']);
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);
  const [warehouseLookupOpen, setWarehouseLookupOpen] = useState(false);
  const [sourceHeaderLookupOpen, setSourceHeaderLookupOpen] = useState(false);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
  const [selectedWarehouseLabel, setSelectedWarehouseLabel] = useState('');
  const [selectedSourceHeaderLabel, setSelectedSourceHeaderLabel] = useState('');

  const schema = useMemo(() => pHeaderFormSchema(t), [t]);

  const isOps = variant === 'ops';
  const requiredMark = isOps ? <span className="wms-ops-required"> *</span> : <span className="text-destructive">*</span>;
  const formItemClass = isOps ? 'wms-ops-form-item' : undefined;
  const fieldMessage = isOps ? <OpsFormMessage /> : <FormMessage />;

  const cargoCompanyOptions = useMemo(() => {
    return Object.entries(CargoCompany)
      .filter(([key]) => isNaN(Number(key)))
      .map(([key, value]) => ({
        value: value as number,
        label: t(`package.cargoCompany.${key}`, key),
      }));
  }, [t]);

  const form = useForm<PHeaderFormInput, unknown, PHeaderFormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? mapHeaderToFormValues(initialData)
      : {
          packingNo: '',
          packingDate: new Date().toISOString().split('T')[0],
          warehouseCode: '',
          sourceType: undefined,
          sourceHeaderId: undefined,
          customerCode: '',
          customerAddress: '',
          status: 'Draft',
          carrierId: undefined,
          carrierServiceType: '',
          trackingNo: '',
        },
  });

  const sourceType = form.watch('sourceType');

  useEffect(() => {
    if (!initialData) return;
    form.reset(mapHeaderToFormValues(initialData));
    if (initialData.customerCode) {
      setSelectedCustomerLabel(
        initialData.customerName
          ? `${initialData.customerName} (${initialData.customerCode})`
          : initialData.customerCode
      );
    }
    if (initialData.warehouseCode) {
      setSelectedWarehouseLabel(initialData.warehouseCode);
    }
    if (initialData.sourceHeaderId) {
      setSelectedSourceHeaderLabel(`#${initialData.sourceHeaderId}`);
    }
  }, [initialData, form]);

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

  const getHeaderDisplayLabel = (header: AvailableHeaderDto): string => {
    const parts = [`#${header.id}`];
    if (header.documentNo) {
      parts.push(header.documentNo);
    }
    if (header.customerName) {
      parts.push(header.customerName);
    }
    return parts.join(' - ');
  };

  const handleSubmit = async (data: PHeaderFormData): Promise<void> => {
    await onSubmit(data);
  };

  return (
    <Card className={cn(isOps && 'wms-ops-order-step')}>
      <CardHeader>
        <CardTitle className={cn(isOps && 'wms-ops-panel-empty__title')}>
          {t('package.wizard.step1.title')}
        </CardTitle>
        {!isOps ? (
          <CardDescription>
            {t('package.wizard.step1.description')}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className={cn('space-y-6', isOps && 'wms-ops-form')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="packingNo"
                render={({ field }) => (
                  <FormItem className={formItemClass}>
                    <FormLabel>
                      {t('package.form.packingNo')} {requiredMark}
                    </FormLabel>
                    <FormControl>
                      {isOps ? (
                        <OpsInput {...field} placeholder={t('package.form.packingNo')} />
                      ) : (
                        <Input {...field} placeholder={t('package.form.packingNo')} />
                      )}
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
                      {isOps ? (
                        <OpsInput type="date" {...field} />
                      ) : (
                        <Input type="date" {...field} />
                      )}
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
                      {isOps ? (
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
                      ) : (
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
                        />
                      )}
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
                      {isOps ? (
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
                            queryKey={['package', 'available-headers', sourceType || 'none']}
                            fetchPage={({ pageNumber, pageSize, search, signal }) =>
                              packageApi.getAvailableHeadersForMappingPaged(sourceType!, { pageNumber, pageSize, search }, { signal })
                            }
                            getKey={(header) => header.id.toString()}
                            getLabel={getHeaderDisplayLabel}
                            onSelect={(header) => {
                              field.onChange(header.id);
                              form.clearErrors('sourceHeaderId');
                              setSelectedSourceHeaderLabel(getHeaderDisplayLabel(header));
                            }}
                          />
                        </OpsFieldShell>
                      ) : (
                        <PagedLookupDialog<AvailableHeaderDto>
                          open={sourceHeaderLookupOpen}
                          onOpenChange={setSourceHeaderLookupOpen}
                          title={t('package.form.sourceHeaderId')}
                          description={sourceType ? t(`package.sourceType.${sourceType}`) : t('package.form.selectSourceTypeFirst')}
                          value={selectedSourceHeaderLabel || (field.value ? `#${field.value}` : '')}
                          placeholder={t('package.form.selectSourceHeader')}
                          searchPlaceholder={t('common.search')}
                          emptyText={
                            sourceType
                              ? t('package.form.noAvailableHeaders')
                              : t('package.form.selectSourceTypeFirst')
                          }
                          disabled={!sourceType}
                          queryKey={['package', 'available-headers', sourceType || 'none']}
                          fetchPage={({ pageNumber, pageSize, search, signal }) =>
                            packageApi.getAvailableHeadersForMappingPaged(sourceType!, { pageNumber, pageSize, search }, { signal })
                          }
                          getKey={(header) => header.id.toString()}
                          getLabel={getHeaderDisplayLabel}
                          onSelect={(header) => {
                            field.onChange(header.id);
                            setSelectedSourceHeaderLabel(getHeaderDisplayLabel(header));
                          }}
                        />
                      )}
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
                      {isOps ? (
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
                            queryKey={['package', 'warehouse']}
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
                      ) : (
                        <PagedLookupDialog<Warehouse>
                          open={warehouseLookupOpen}
                          onOpenChange={setWarehouseLookupOpen}
                          title={t('package.form.selectWarehouse')}
                          description={t('package.form.warehouseCode')}
                          value={selectedWarehouseLabel || field.value}
                          placeholder={t('package.form.selectWarehouse')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('common.notFound')}
                          queryKey={['package', 'warehouse']}
                          fetchPage={({ pageNumber, pageSize, search, signal }) =>
                            lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })
                          }
                          getKey={(warehouse) => warehouse.id.toString()}
                          getLabel={(warehouse) => `${warehouse.depoIsmi} (${warehouse.depoKodu})`}
                          onSelect={(warehouse) => {
                            field.onChange(warehouse.depoKodu.toString());
                            setSelectedWarehouseLabel(`${warehouse.depoIsmi} (${warehouse.depoKodu})`);
                          }}
                        />
                      )}
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
                      {isOps ? (
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
                            queryKey={['package', 'customer']}
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
                      ) : (
                        <PagedLookupDialog<Customer>
                          open={customerLookupOpen}
                          onOpenChange={setCustomerLookupOpen}
                          title={t('package.form.selectCustomer')}
                          description={t('package.form.customerCode')}
                          value={selectedCustomerLabel || field.value}
                          placeholder={t('package.form.selectCustomer')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('common.notFound')}
                          queryKey={['package', 'customer']}
                          fetchPage={({ pageNumber, pageSize, search, signal }) =>
                            lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })
                          }
                          getKey={(customer) => customer.id.toString()}
                          getLabel={(customer) => `${customer.cariIsim} (${customer.cariKod})`}
                          onSelect={(customer) => {
                            field.onChange(customer.cariKod);
                            setSelectedCustomerLabel(`${customer.cariIsim} (${customer.cariKod})`);
                          }}
                        />
                      )}
                    </FormControl>
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
                      {isOps ? (
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
                      ) : (
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
                        />
                      )}
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
                    {isOps ? (
                      <OpsFieldShell>
                        <Select value={field.value} onValueChange={field.onChange} disabled>
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
                    ) : (
                      <Select value={field.value} onValueChange={field.onChange} disabled>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Draft">{t('package.status.draft')}</SelectItem>
                          <SelectItem value="Packing">{t('package.status.packing')}</SelectItem>
                          <SelectItem value="Packed">{t('package.status.packed')}</SelectItem>
                          <SelectItem value="Shipped">{t('package.status.shipped')}</SelectItem>
                          <SelectItem value="Cancelled">{t('package.status.cancelled')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
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
                      {isOps ? (
                        <OpsInput {...field} />
                      ) : (
                        <Input {...field} />
                      )}
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
                      {isOps ? (
                        <OpsInput {...field} />
                      ) : (
                        <Input {...field} />
                      )}
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
                  <FormLabel className={isOps ? 'wms-ops-notes-label' : undefined}>
                    {t('package.form.customerAddress')}
                  </FormLabel>
                  <FormControl>
                    {isOps ? (
                      <OpsTextarea {...field} rows={3} />
                    ) : (
                      <Textarea {...field} rows={3} />
                    )}
                  </FormControl>
                  {fieldMessage}
                </FormItem>
              )}
            />

            <div className={cn('flex justify-end gap-2', isOps && 'wms-ops-actions')}>
              {isOps ? (
                <>
                  <OpsActionButton type="button" variant="secondary" onClick={onCancel}>
                    {t('common.cancel')}
                  </OpsActionButton>
                  <OpsActionButton type="submit" variant="primary" disabled={isLoading}>
                    {isLoading ? t('common.saving') : t('package.wizard.saveAndContinue')}
                  </OpsActionButton>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={onCancel}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? t('common.saving') : t('package.wizard.saveAndContinue')}
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
