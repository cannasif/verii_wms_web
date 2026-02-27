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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Customer, Warehouse } from '@/features/goods-receipt/types/goods-receipt';

export function PackageEditPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
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
    setPageTitle(t('package.edit.title', 'Paketleme Düzenle'));
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
      toast.success(t('package.edit.success', 'Paketleme başarıyla güncellendi'));
      navigate(`/package/detail/${headerId}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.edit.error', 'Paketleme güncellenirken bir hata oluştu')
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!header) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{t('package.edit.notFound', 'Paketleme bulunamadı')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <div className="crm-toolbar flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t('package.edit.title', 'Paketleme Düzenle')}</CardTitle>
              <CardDescription>
                {t('package.edit.description', 'Paketleme bilgilerini düzenleyin')}
              </CardDescription>
            </div>
            {header?.sourceType && header?.sourceHeaderId && (
              <Button
                variant={header.isMatched ? 'destructive' : 'default'}
                onClick={async () => {
                  if (!headerId) return;
                  try {
                    await matchPlinesMutation.mutateAsync({
                      pHeaderId: headerId,
                      isMatched: !header.isMatched,
                    });
                    toast.success(
                      header.isMatched
                        ? t('package.edit.unmatchSuccess', 'Bağlantı başarıyla kesildi')
                        : t('package.edit.matchSuccess', 'Eşleme başarıyla yapıldı')
                    );
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : t('package.edit.matchError', 'Eşleme işlemi sırasında bir hata oluştu')
                    );
                  }
                }}
                disabled={matchPlinesMutation.isPending}
              >
                {matchPlinesMutation.isPending
                  ? t('common.saving', 'Kaydediliyor...')
                  : header.isMatched
                    ? t('package.edit.unmatch', 'Bağlantıyı Kes')
                    : t('package.edit.match', 'Eşle')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 crm-page">
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.status', 'Durum')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
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
                <Button type="button" variant="outline" onClick={() => navigate(`/package/detail/${headerId}`)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

