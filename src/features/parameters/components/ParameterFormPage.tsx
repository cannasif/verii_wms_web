import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUIStore } from '@/stores/ui-store';
import { useParameterFirst } from '../hooks/useParameterFirst';
import { useUpsertParameter } from '../hooks/useUpsertParameter';
import { parameterFormSchema } from '../types/parameter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PARAMETER_TYPES, type ParameterType, type ParameterFormData } from '../types/parameter';
import { CheckCircle2, XCircle } from 'lucide-react';

export function ParameterFormPage(): ReactElement {
  const { t } = useTranslation();
  const { type } = useParams<{ type: ParameterType }>();
  const { setPageTitle } = useUIStore();

  const parameterType = type as ParameterType;
  const parameterConfig = PARAMETER_TYPES[parameterType];

  const { data: parameter, isLoading: isLoadingParameter } = useParameterFirst(parameterType);
  const upsertMutation = useUpsertParameter(parameterType);

  const form = useForm<ParameterFormData>({
    resolver: zodResolver(parameterFormSchema(t)),
    defaultValues: {
      allowLessQuantityBasedOnOrder: false,
      allowMoreQuantityBasedOnOrder: false,
      requireApprovalBeforeErp: false,
      requireAllOrderItemsCollected: false,
    },
  });

  useEffect(() => {
    if (isLoadingParameter) {
      return;
    }

    if (parameter) {
      form.reset({
        allowLessQuantityBasedOnOrder: parameter.allowLessQuantityBasedOnOrder,
        allowMoreQuantityBasedOnOrder: parameter.allowMoreQuantityBasedOnOrder,
        requireApprovalBeforeErp: parameter.requireApprovalBeforeErp,
        requireAllOrderItemsCollected: parameter.requireAllOrderItemsCollected ?? false,
      });
    } else {
      form.reset({
        allowLessQuantityBasedOnOrder: false,
        allowMoreQuantityBasedOnOrder: false,
        requireApprovalBeforeErp: false,
        requireAllOrderItemsCollected: false,
      });
    }
  }, [parameter, form, parameterType, isLoadingParameter]);

  useEffect(() => {
    const title = t(`parameters.${parameterType}.title`, parameterConfig.name);
    setPageTitle(title);
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle, parameterType, parameterConfig]);

  const onSubmit = async (data: ParameterFormData): Promise<void> => {
    try {
      await upsertMutation.mutateAsync(data);
      toast.success(
        parameter
          ? t('parameters.update.success', 'Parametre başarıyla güncellendi')
          : t('parameters.create.success', 'Parametre başarıyla oluşturuldu')
      );
    } catch (error: any) {
      console.error('Parameter update/create error:', error);
      let errorMessage = parameter
        ? t('parameters.update.error', 'Parametre güncellenirken bir hata oluştu')
        : t('parameters.create.error', 'Parametre oluşturulurken bir hata oluştu');
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.response?.data) {
        const apiError = error.response.data;
        errorMessage = apiError.exceptionMessage || apiError.message || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  if (isLoadingParameter) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <CardTitle>{t(`parameters.${parameterType}.title`, parameterConfig.name)}</CardTitle>
          <CardDescription>
            {parameter
              ? t('parameters.form.editDescription', 'Mevcut parametre ayarlarını düzenleyebilirsiniz')
              : t('parameters.form.createDescription', 'Yeni parametre ayarlarını oluşturabilirsiniz')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 crm-page">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="allowLessQuantityBasedOnOrder"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start space-x-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex-1 space-y-1">
                          <FormLabel className="text-base font-semibold">
                            {t('parameters.form.allowLessQuantity', 'Emre İstinaden Az Miktar')}
                          </FormLabel>
                          <FormDescription className="text-sm">
                            {t(
                              'parameters.form.allowLessQuantityDescription',
                              'Siparişe göre daha az miktar girilmesine izin verir. Bu seçenek aktif olduğunda, sipariş miktarından daha az miktar girişi yapılabilir.'
                            )}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            {field.value ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-400" />
                            )}
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="allowMoreQuantityBasedOnOrder"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start space-x-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex-1 space-y-1">
                          <FormLabel className="text-base font-semibold">
                            {t('parameters.form.allowMoreQuantity', 'Emre İstinaden Fazla Miktar')}
                          </FormLabel>
                          <FormDescription className="text-sm">
                            {t(
                              'parameters.form.allowMoreQuantityDescription',
                              'Siparişe göre daha fazla miktar girilmesine izin verir. Bu seçenek aktif olduğunda, sipariş miktarından daha fazla miktar girişi yapılabilir.'
                            )}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            {field.value ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-400" />
                            )}
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="requireApprovalBeforeErp"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start space-x-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex-1 space-y-1">
                          <FormLabel className="text-base font-semibold">
                            {t('parameters.form.requireApproval', 'ERP Öncesi Onay')}
                          </FormLabel>
                          <FormDescription className="text-sm">
                            {t(
                              'parameters.form.requireApprovalDescription',
                              "ERP sistemine gönderilmeden önce onay gerektirir. Bu seçenek aktif olduğunda, işlemler ERP'ye gönderilmeden önce onay sürecinden geçer."
                            )}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            {field.value ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-400" />
                            )}
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="requireAllOrderItemsCollected"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start space-x-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex-1 space-y-1">
                          <FormLabel className="text-base font-semibold">
                            {t('parameters.form.requireAllOrderItemsCollected', 'Emirdeki Tüm Kalemlere Toplama Yapılmış Olmalı')}
                          </FormLabel>
                          <FormDescription className="text-sm">
                            {t(
                              'parameters.form.requireAllOrderItemsCollectedDescription',
                              'Bu parametre aktif olduğunda, emirdeki tüm kalemlere toplama yapılmış olması zorunludur.'
                            )}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            {field.value ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-400" />
                            )}
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button
                  type="submit"
                  disabled={upsertMutation.isPending}
                  className="min-w-[120px]"
                >
                  {upsertMutation.isPending
                    ? t('common.saving')
                    : parameter
                      ? t('parameters.form.updateButton', 'Güncelle')
                      : t('parameters.form.createButton', 'Kaydet')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

