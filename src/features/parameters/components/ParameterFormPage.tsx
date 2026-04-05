import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUIStore } from '@/stores/ui-store';
import { useParameterFirst } from '../hooks/useParameterFirst';
import { useUpsertParameter } from '../hooks/useUpsertParameter';
import { parameterFormSchema } from '../types/parameter';
import { FormPageShell } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PARAMETER_TYPES, type ParameterType, type ParameterFormData } from '../types/parameter';
import { CheckCircle2, XCircle } from 'lucide-react';

type ParameterFormError = {
  response?: {
    data?: {
      exceptionMessage?: string;
      message?: string;
    };
  };
  message?: string;
};

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
          ? t('parameters.update.success')
          : t('parameters.create.success')
      );
    } catch (error: unknown) {
      console.error('Parameter update/create error:', error);
      let errorMessage = parameter
        ? t('parameters.update.error')
        : t('parameters.create.error');
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if ((error as ParameterFormError)?.response?.data) {
        const apiError = (error as ParameterFormError).response?.data;
        if (apiError) {
          errorMessage = apiError.exceptionMessage || apiError.message || errorMessage;
        }
      } else if ((error as ParameterFormError)?.message) {
        errorMessage = (error as ParameterFormError).message ?? errorMessage;
      }
      
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6 crm-page">
      <FormPageShell
        title={t(`parameters.${parameterType}.title`, parameterConfig.name)}
        description={
          parameter
            ? t('parameters.form.editDescription')
            : t('parameters.form.createDescription')
        }
        isLoading={isLoadingParameter}
        loadingTitle={t('common.loading')}
      >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 crm-page">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="allowLessQuantityBasedOnOrder"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start space-x-4 rounded-xl border border-slate-200/70 bg-white/70 p-4 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]">
                        <div className="flex-1 space-y-1">
                          <FormLabel className="text-base font-semibold">
                            {t('parameters.form.allowLessQuantity')}
                          </FormLabel>
                          <FormDescription className="text-sm">
                            {t(
                              'parameters.form.allowLessQuantityDescription'
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
                      <div className="flex items-start space-x-4 rounded-xl border border-slate-200/70 bg-white/70 p-4 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]">
                        <div className="flex-1 space-y-1">
                          <FormLabel className="text-base font-semibold">
                            {t('parameters.form.allowMoreQuantity')}
                          </FormLabel>
                          <FormDescription className="text-sm">
                            {t(
                              'parameters.form.allowMoreQuantityDescription'
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
                      <div className="flex items-start space-x-4 rounded-xl border border-slate-200/70 bg-white/70 p-4 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]">
                        <div className="flex-1 space-y-1">
                          <FormLabel className="text-base font-semibold">
                            {t('parameters.form.requireApproval')}
                          </FormLabel>
                          <FormDescription className="text-sm">
                            {t(
                              'parameters.form.requireApprovalDescription'
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
                      <div className="flex items-start space-x-4 rounded-xl border border-slate-200/70 bg-white/70 p-4 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]">
                        <div className="flex-1 space-y-1">
                          <FormLabel className="text-base font-semibold">
                            {t('parameters.form.requireAllOrderItemsCollected')}
                          </FormLabel>
                          <FormDescription className="text-sm">
                            {t(
                              'parameters.form.requireAllOrderItemsCollectedDescription'
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
                      ? t('parameters.form.updateButton')
                      : t('parameters.form.createButton')}
                </Button>
              </div>
            </form>
          </Form>
      </FormPageShell>
    </div>
  );
}
