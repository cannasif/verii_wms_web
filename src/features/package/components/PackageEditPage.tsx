import { type ReactElement, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUIStore } from '@/stores/ui-store';
import { usePHeader } from '../hooks/usePHeader';
import { useUpdatePHeader } from '../hooks/useUpdatePHeader';
import { useMatchPlines } from '../hooks/useMatchPlines';
import { useCustomers } from '@/features/goods-receipt/hooks/useCustomers';
import { useWarehouses } from '@/features/goods-receipt/hooks/useWarehouses';
import { SearchableSelect } from '@/features/goods-receipt/components/steps/components/SearchableSelect';
import { useAvailableHeaders } from '../hooks/useAvailableHeaders';
import { pHeaderFormSchema, CargoCompany, type PHeaderFormData, type AvailableHeaderDto } from '../types/package';
import { FormPageShell } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Customer, Warehouse } from '@/features/goods-receipt/types/goods-receipt';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';

export function PackageEditPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.package');
  const headerId = id ? parseInt(id, 10) : undefined;
  const { data: header, isLoading } = usePHeader(headerId);
  const updateMutation = useUpdatePHeader();
  const matchPlinesMutation = useMatchPlines();
  const { data: customers, isLoading: isLoadingCustomers } = useCustomers();
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouses();

  const cargoCompanyOptions = useMemo(() => {
    return Object.entries(CargoCompany)
      .filter(([key]) => isNaN(Number(key)))
      .map(([key, value]) => ({
        value: value as number,
        label: t(`package.cargoCompany.${key}`, key),
      }));
  }, [t]);

  const schema = useMemo(() => pHeaderFormSchema(t), [t]);

  const form = useForm<PHeaderFormData>({
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

  return (
    <div className="space-y-6 crm-page">
      <FormPageShell
        title={t('package.edit.title')}
        description={t('package.edit.description')}
        isLoading={isLoading}
        isError={!isLoading && !header}
        loadingTitle={t('common.loading')}
        errorTitle={t('package.edit.notFound')}
        actions={
          header?.sourceType && header?.sourceHeaderId ? (
            <Button
              variant={header.isMatched ? 'destructive' : 'default'}
              onClick={async () => {
                if (!permission.canUpdate) return;
                if (!headerId) return;
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
              }}
              disabled={!permission.canUpdate || matchPlinesMutation.isPending}
            >
              {matchPlinesMutation.isPending
                ? t('common.saving')
                : header.isMatched
                  ? t('package.edit.unmatch')
                  : t('package.edit.match')}
            </Button>
          ) : undefined
        }
      >
        {header ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 crm-page">
              <fieldset disabled={isReadOnly} className={isReadOnly ? 'pointer-events-none opacity-75' : undefined}>
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
                        <Input {...field} />
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.status')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
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
                <Button type="button" variant="outline" onClick={() => navigate(`/package/detail/${headerId}`)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isReadOnly || updateMutation.isPending}>
                  {updateMutation.isPending ? t('common.saving') : t('common.save')}
                </Button>
              </div>
              </fieldset>
            </form>
          </Form>
        ) : null}
      </FormPageShell>
    </div>
  );
}
