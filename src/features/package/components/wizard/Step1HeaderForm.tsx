import { type ReactElement, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCustomers } from '@/features/goods-receipt/hooks/useCustomers';
import { useWarehouses } from '@/features/goods-receipt/hooks/useWarehouses';
import { SearchableSelect } from '@/features/goods-receipt/components/steps/components/SearchableSelect';
import { useAvailableHeaders } from '../../hooks/useAvailableHeaders';
import { pHeaderFormSchema, CargoCompany, type PHeaderFormData, type PHeaderDto, type AvailableHeaderDto } from '../../types/package';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { Customer, Warehouse } from '@/features/goods-receipt/types/goods-receipt';

interface Step1HeaderFormProps {
  initialData?: PHeaderDto;
  onSubmit: (data: PHeaderFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function Step1HeaderForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: Step1HeaderFormProps): ReactElement {
  const { t } = useTranslation();
  const { data: customers, isLoading: isLoadingCustomers } = useCustomers();
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouses();

  const schema = useMemo(() => pHeaderFormSchema(t), [t]);

  const cargoCompanyOptions = useMemo(() => {
    return Object.entries(CargoCompany)
      .filter(([key]) => isNaN(Number(key)))
      .map(([key, value]) => ({
        value: value as number,
        label: t(`package.cargoCompany.${key}`, key),
      }));
  }, [t]);

  const form = useForm<PHeaderFormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          packingNo: initialData.packingNo,
          packingDate: initialData.packingDate ? initialData.packingDate.split('T')[0] : new Date().toISOString().split('T')[0],
          warehouseCode: initialData.warehouseCode || '',
          sourceType: initialData.sourceType,
          sourceHeaderId: initialData.sourceHeaderId,
          customerCode: initialData.customerCode || '',
          customerAddress: initialData.customerAddress || '',
          status: initialData.status || 'Draft',
          carrierId: initialData.carrierId,
          carrierServiceType: initialData.carrierServiceType || '',
          trackingNo: initialData.trackingNo || '',
        }
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
  const { data: availableHeaders, isLoading: isLoadingHeaders } = useAvailableHeaders(sourceType);

  useEffect(() => {
    if (!sourceType) {
      form.setValue('sourceHeaderId', undefined);
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
    <Card>
      <CardHeader>
        <CardTitle>{t('package.wizard.step1.title')}</CardTitle>
        <CardDescription>
          {t('package.wizard.step1.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 crm-page">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="packingNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('package.form.packingNo')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="PKG-2025-000001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="packingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('package.form.packingDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sourceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('package.form.sourceType')}</FormLabel>
                    <FormControl>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sourceHeaderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('package.form.sourceHeaderId')}</FormLabel>
                    <FormControl>
                      <SearchableSelect<AvailableHeaderDto>
                        value={field.value?.toString() || ''}
                        onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : undefined)}
                        options={availableHeaders || []}
                        getOptionValue={(opt) => opt.id.toString()}
                        getOptionLabel={getHeaderDisplayLabel}
                        placeholder={t('package.form.selectSourceHeader')}
                        searchPlaceholder={t('common.search')}
                        emptyText={
                          sourceType
                            ? t('package.form.noAvailableHeaders')
                            : t('package.form.selectSourceTypeFirst')
                        }
                        isLoading={isLoadingHeaders}
                        disabled={!sourceType}
                        itemLimit={100}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouseCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('package.form.warehouseCode')}</FormLabel>
                    <FormControl>
                      <SearchableSelect<Warehouse>
                        value={field.value}
                        onValueChange={field.onChange}
                        options={warehouses || []}
                        getOptionValue={(opt) => opt.depoKodu.toString()}
                        getOptionLabel={(opt) => `${opt.depoIsmi} (${opt.depoKodu})`}
                        placeholder={t('package.form.selectWarehouse')}
                        searchPlaceholder={t('common.search')}
                        emptyText={t('common.notFound')}
                        isLoading={isLoadingWarehouses}
                        itemLimit={100}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('package.form.customerCode')}</FormLabel>
                    <FormControl>
                      <SearchableSelect<Customer>
                        value={field.value}
                        onValueChange={field.onChange}
                        options={customers || []}
                        getOptionValue={(opt) => opt.cariKod}
                        getOptionLabel={(opt) => `${opt.cariIsim} (${opt.cariKod})`}
                        placeholder={t('package.form.selectCustomer')}
                        searchPlaceholder={t('common.search')}
                        emptyText={t('common.notFound')}
                        isLoading={isLoadingCustomers}
                        itemLimit={100}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carrierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('package.form.carrierId')}</FormLabel>
                    <FormControl>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('package.form.status')}</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carrierServiceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('package.form.carrierServiceType')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trackingNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('package.form.trackingNo')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customerAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('package.form.customerAddress')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? t('common.saving') : t('package.wizard.saveAndContinue')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

