import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUIStore } from '@/stores/ui-store';
import { useParameterFirst } from '../hooks/useParameterFirst';
import { useUpsertParameter } from '../hooks/useUpsertParameter';
import { parameterFormSchema } from '../types/parameter';
import {
  OpsActionButton,
  OpsFormPageShell,
  OpsToggleField,
  PageState,
} from '@/components/shared';
import { MasterDataOpsParameterEyebrow } from '@/features/shared';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { toast } from 'sonner';
import { PARAMETER_TYPES, type ParameterType, type ParameterFormData } from '../types/parameter';

type ParameterFormError = {
  response?: {
    data?: {
      exceptionMessage?: string;
      message?: string;
    };
  };
  message?: string;
};

const DEFAULT_VALUES: ParameterFormData = {
  allowLessQuantityBasedOnOrder: false,
  allowMoreQuantityBasedOnOrder: false,
  requireApprovalBeforeErp: false,
  requireAllOrderItemsCollected: false,
};

export function ParameterFormPage(): ReactElement {
  const { t } = useTranslation();
  const { type } = useParams<{ type: ParameterType }>();
  const { setPageTitle } = useUIStore();

  const parameterType = type as ParameterType;
  const parameterConfig = PARAMETER_TYPES[parameterType];

  const { data: parameter, isLoading: isLoadingParameter } = useParameterFirst(parameterType);
  const upsertMutation = useUpsertParameter(parameterType, parameter?.id);

  const form = useForm<ParameterFormData>({
    resolver: zodResolver(parameterFormSchema(t)),
    defaultValues: DEFAULT_VALUES,
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
      return;
    }

    form.reset(DEFAULT_VALUES);
  }, [parameter, parameterType, isLoadingParameter, form.reset]);

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
          : t('parameters.create.success'),
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

  const pageTitle = t(`parameters.${parameterType}.title`, parameterConfig.name);
  const pageDescription = parameter
    ? t('parameters.form.editDescription')
    : t('parameters.form.createDescription');

  if (isLoadingParameter) {
    return (
      <PageState
        tone="loading"
        title={t('common.loading')}
        description={pageDescription}
      />
    );
  }

  return (
    <Form {...form}>
      <OpsFormPageShell
        eyebrow={<MasterDataOpsParameterEyebrow code={parameterType} />}
        title={pageTitle}
        description={pageDescription}
      >
        <div className="wms-ops-form wms-ops-erp-skin">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="allowLessQuantityBasedOnOrder"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <OpsToggleField
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      title={t('parameters.form.allowLessQuantity')}
                      description={t('parameters.form.allowLessQuantityDescription')}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowMoreQuantityBasedOnOrder"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <OpsToggleField
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      title={t('parameters.form.allowMoreQuantity')}
                      description={t('parameters.form.allowMoreQuantityDescription')}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requireApprovalBeforeErp"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <OpsToggleField
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      title={t('parameters.form.requireApproval')}
                      description={t('parameters.form.requireApprovalDescription')}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requireAllOrderItemsCollected"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <OpsToggleField
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      title={t('parameters.form.requireAllOrderItemsCollected')}
                      description={t('parameters.form.requireAllOrderItemsCollectedDescription')}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="wms-ops-actions flex justify-end border-t pt-6">
            <OpsActionButton type="submit" variant="primary" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending
                ? t('common.saving')
                : parameter
                  ? t('parameters.form.updateButton')
                  : t('parameters.form.createButton')}
            </OpsActionButton>
          </div>
        </form>
        </div>
      </OpsFormPageShell>
    </Form>
  );
}
