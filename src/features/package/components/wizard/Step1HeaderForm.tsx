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
      { value: 'GR', label: t('package.sourceType.GR', 'Mal Kabul') },
      { value: 'WT', label: t('package.sourceType.WT', 'Depo Transferi') },
      { value: 'SH', label: t('package.sourceType.SH', 'Sevkiyat') },
      { value: 'PR', label: t('package.sourceType.PR', 'Üretim') },
      { value: 'PT', label: t('package.sourceType.PT', 'Üretim Transferi') },
      { value: 'SIT', label: t('package.sourceType.SIT', 'Yarı Mamul Çıkış Transferi') },
      { value: 'SRT', label: t('package.sourceType.SRT', 'Yarı Mamul Giriş Transferi') },
      { value: 'WI', label: t('package.sourceType.WI', 'Ambar Girişi') },
      { value: 'WO', label: t('package.sourceType.WO', 'Ambar Çıkışı') },
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
        <CardTitle>{t('package.wizard.step1.title', '1. Paketleme Başlığı')}</CardTitle>
        <CardDescription>
          {t('package.wizard.step1.description', 'Paketleme başlık bilgilerini giriniz')}
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
                      {t('package.form.packingNo', 'Paketleme No')} <span className="text-destructive">*</span>
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
                    <FormLabel>{t('package.form.packingDate', 'Paketleme Tarihi')}</FormLabel>
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
                    <FormLabel>{t('package.form.sourceType', 'Kaynak Tipi')}</FormLabel>
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
                        placeholder={t('package.form.selectSourceType', 'Kaynak Tipi Seçin')}
                        searchPlaceholder={t('common.search', 'Ara...')}
                        emptyText={t('package.form.noSourceType', 'Kaynak tipi bulunamadı')}
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
                    <FormLabel>{t('package.form.sourceHeaderId', 'Eşlenecek Header')}</FormLabel>
                    <FormControl>
                      <SearchableSelect<AvailableHeaderDto>
                        value={field.value?.toString() || ''}
                        onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : undefined)}
                        options={availableHeaders || []}
                        getOptionValue={(opt) => opt.id.toString()}
                        getOptionLabel={getHeaderDisplayLabel}
                        placeholder={t('package.form.selectSourceHeader', 'Eşlenecek Header Seçin')}
                        searchPlaceholder={t('common.search', 'Ara...')}
                        emptyText={
                          sourceType
                            ? t('package.form.noAvailableHeaders', 'Eşlenecek header bulunamadı')
                            : t('package.form.selectSourceTypeFirst', 'Önce kaynak tipi seçiniz')
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
                    <FormLabel>{t('package.form.warehouseCode', 'Depo')}</FormLabel>
                    <FormControl>
                      <SearchableSelect<Warehouse>
                        value={field.value}
                        onValueChange={field.onChange}
                        options={warehouses || []}
                        getOptionValue={(opt) => opt.depoKodu.toString()}
                        getOptionLabel={(opt) => `${opt.depoIsmi} (${opt.depoKodu})`}
                        placeholder={t('package.form.selectWarehouse', 'Depo seçiniz')}
                        searchPlaceholder={t('common.search', 'Ara...')}
                        emptyText={t('common.notFound', 'Bulunamadı')}
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
                    <FormLabel>{t('package.form.customerCode', 'Cari')}</FormLabel>
                    <FormControl>
                      <SearchableSelect<Customer>
                        value={field.value}
                        onValueChange={field.onChange}
                        options={customers || []}
                        getOptionValue={(opt) => opt.cariKod}
                        getOptionLabel={(opt) => `${opt.cariIsim} (${opt.cariKod})`}
                        placeholder={t('package.form.selectCustomer', 'Cari seçiniz')}
                        searchPlaceholder={t('common.search', 'Ara...')}
                        emptyText={t('common.notFound', 'Bulunamadı')}
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
                    <FormLabel>{t('package.form.carrierId', 'Kargo Firması')}</FormLabel>
                    <FormControl>
                      <SearchableSelect<{ value: number; label: string }>
                        value={field.value?.toString() || ''}
                        onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : undefined)}
                        options={cargoCompanyOptions}
                        getOptionValue={(opt) => opt.value.toString()}
                        getOptionLabel={(opt) => opt.label}
                        placeholder={t('package.form.selectCarrier', 'Kargo Firması Seçin')}
                        searchPlaceholder={t('common.search', 'Ara...')}
                        emptyText={t('package.form.noCarrier', 'Kargo firması bulunamadı')}
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
                    <FormLabel>{t('package.form.status', 'Durum')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Draft">{t('package.status.draft', 'Taslak')}</SelectItem>
                        <SelectItem value="Packing">{t('package.status.packing', 'Paketleniyor')}</SelectItem>
                        <SelectItem value="Packed">{t('package.status.packed', 'Paketlendi')}</SelectItem>
                        <SelectItem value="Shipped">{t('package.status.shipped', 'Gönderildi')}</SelectItem>
                        <SelectItem value="Cancelled">{t('package.status.cancelled', 'İptal Edildi')}</SelectItem>
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
                    <FormLabel>{t('package.form.carrierServiceType', 'Kargo Servis Tipi')}</FormLabel>
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
                    <FormLabel>{t('package.form.trackingNo', 'Takip No')}</FormLabel>
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
                  <FormLabel>{t('package.form.customerAddress', 'Cari Adresi')}</FormLabel>
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
                {isLoading ? t('common.saving') : t('package.wizard.saveAndContinue', 'Kaydet ve İlerle')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

