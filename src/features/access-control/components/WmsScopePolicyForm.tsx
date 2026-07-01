import { type ReactElement, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/ui/dialog';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { FieldHelpTooltip } from './FieldHelpTooltip';
import {
  createWmsScopePolicySchema,
  type CreateWmsScopePolicySchema,
  WMS_SCOPE_POLICY_ENTITY_TYPES,
  WMS_SCOPE_POLICY_SCOPE_TYPES,
} from '../schemas/wms-scope-policy-schema';
import type { WmsScopePolicyDto } from '../types/access-control.types';
import { OpsCircuitToggleField, OpsInput, OpsTextarea } from '@/components/shared';
import {
  AccessControlOpsDialogContent,
  AccessControlOpsDialogFooter,
  AccessControlOpsDialogHeader,
  AccessControlOpsFormField,
} from './access-control-ops-ui';

interface WmsScopePolicyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateWmsScopePolicySchema) => void | Promise<void>;
  item?: WmsScopePolicyDto | null;
  isLoading?: boolean;
  usedCodes?: string[];
}

const scopeTypeLabels: Record<string, string> = {
  unrestricted: 'Tam Erişim',
  branch: 'Şube Bazlı',
  warehouse: 'Depo Bazlı',
  'assigned-only': 'Sadece Atanan Kayıtlar',
};

export function WmsScopePolicyForm({
  open,
  onOpenChange,
  onSubmit,
  item,
  isLoading = false,
  usedCodes = [],
}: WmsScopePolicyFormProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);

  const form = useForm<CreateWmsScopePolicySchema>({
    resolver: zodResolver(createWmsScopePolicySchema),
    mode: 'onChange',
    defaultValues: {
      code: '',
      name: '',
      entityType: 'GoodsReceipt',
      description: '',
      scopeType: 'assigned-only',
      includeSelf: true,
      isActive: true,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        code: item.code,
        name: item.name,
        entityType: item.entityType,
        description: item.description ?? '',
        scopeType: item.scopeType,
        includeSelf: item.includeSelf,
        isActive: item.isActive,
      });
      return;
    }

    form.reset({
      code: '',
      name: '',
      entityType: 'GoodsReceipt',
      description: '',
      scopeType: 'assigned-only',
      includeSelf: true,
      isActive: true,
    });
  }, [form, item, open]);

  const entityTypeOptions = useMemo<ComboboxOption[]>(
    () => WMS_SCOPE_POLICY_ENTITY_TYPES.map((value) => ({ value, label: value })),
    [],
  );

  const scopeTypeOptions = useMemo<ComboboxOption[]>(
    () => WMS_SCOPE_POLICY_SCOPE_TYPES.map((value) => ({ value, label: scopeTypeLabels[value] ?? value })),
    [],
  );

  const codeOptions = useMemo<ComboboxOption[]>(() => {
    const current = item?.code?.toLowerCase();
    const used = new Set(usedCodes.map((code) => code.toLowerCase()));
    return WMS_SCOPE_POLICY_ENTITY_TYPES.flatMap((entityType) => WMS_SCOPE_POLICY_SCOPE_TYPES.map((scopeType) => {
      const normalized = scopeType.replace(/[^a-z0-9]+/gi, '-');
      const value = `scope.${entityType.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}.${normalized}`;
      return value;
    }))
      .filter((code) => current === code.toLowerCase() || !used.has(code.toLowerCase()))
      .map((value) => ({ value, label: value }));
  }, [item?.code, usedCodes]);

  const handleSubmit = async (data: CreateWmsScopePolicySchema): Promise<void> => {
    await onSubmit(data);
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AccessControlOpsDialogContent size="lg">
        <AccessControlOpsDialogHeader
          title={item ? t('wmsScopePolicies.form.editTitle') : t('wmsScopePolicies.form.addTitle')}
          description={item ? t('wmsScopePolicies.form.editDescription') : t('wmsScopePolicies.form.addDescription')}
        />
        <div className="wms-ops-form max-h-[min(68dvh,720px)] overflow-y-auto px-5 py-4">
          <Form {...form}>
            <form id="wms-scope-policy-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                    <AccessControlOpsFormField label={(
                      <span className="inline-flex items-center gap-1">
                        {t('wmsScopePolicies.form.code')}
                        <FieldHelpTooltip text={t('help.wmsScopePolicy.code')} variant="ops" />
                      </span>
                    )}>
                      <FormControl>
                        <Combobox
                          options={codeOptions}
                          value={field.value}
                          variant="ops"
                          modal
                          onValueChange={field.onChange}
                          placeholder={t('wmsScopePolicies.form.codePlaceholder')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('wmsScopePolicies.form.codeEmpty')}
                        />
                      </FormControl>
                    </AccessControlOpsFormField>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                    <AccessControlOpsFormField label={(
                      <span className="inline-flex items-center gap-1">
                        {t('wmsScopePolicies.form.name')}
                        <FieldHelpTooltip text={t('help.wmsScopePolicy.name')} variant="ops" />
                      </span>
                    )}>
                      <FormControl>
                        <OpsInput {...field} placeholder={t('wmsScopePolicies.form.namePlaceholder')} maxLength={150} />
                      </FormControl>
                    </AccessControlOpsFormField>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="entityType"
                  render={({ field }) => (
                    <FormItem>
                    <AccessControlOpsFormField label={(
                      <span className="inline-flex items-center gap-1">
                        {t('wmsScopePolicies.form.entityType')}
                        <FieldHelpTooltip text={t('help.wmsScopePolicy.entityType')} variant="ops" />
                      </span>
                    )}>
                      <FormControl>
                        <Combobox
                          options={entityTypeOptions}
                          value={field.value}
                          variant="ops"
                          modal
                          onValueChange={field.onChange}
                          placeholder={t('wmsScopePolicies.form.entityTypePlaceholder')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('common.noData')}
                        />
                      </FormControl>
                    </AccessControlOpsFormField>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scopeType"
                  render={({ field }) => (
                    <FormItem>
                      <AccessControlOpsFormField label={(
                        <span className="inline-flex items-center gap-1">
                          {t('wmsScopePolicies.form.scopeType')}
                          <FieldHelpTooltip text={t('help.wmsScopePolicy.scopeType')} variant="ops" />
                        </span>
                      )}>
                      <FormControl>
                        <Combobox
                          options={scopeTypeOptions}
                          value={field.value}
                          variant="ops"
                          modal
                          onValueChange={field.onChange}
                          placeholder={t('wmsScopePolicies.form.scopeTypePlaceholder')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('common.noData')}
                        />
                      </FormControl>
                      </AccessControlOpsFormField>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <AccessControlOpsFormField label={(
                      <span className="inline-flex items-center gap-1">
                        {t('wmsScopePolicies.form.description')}
                        <FieldHelpTooltip text={t('help.wmsScopePolicy.description')} variant="ops" />
                      </span>
                    )}>
                    <FormControl>
                      <OpsTextarea
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder={t('wmsScopePolicies.form.descriptionPlaceholder')}
                        rows={3}
                        maxLength={500}
                      />
                    </FormControl>
                    </AccessControlOpsFormField>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="includeSelf"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <OpsCircuitToggleField
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          title={t('wmsScopePolicies.form.includeSelf')}
                          description={t('wmsScopePolicies.form.includeSelfHint')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <OpsCircuitToggleField
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          title={t('wmsScopePolicies.form.isActive')}
                          description={t('wmsScopePolicies.form.isActiveHint')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        <AccessControlOpsDialogFooter
          onCancel={() => onOpenChange(false)}
          cancelLabel={t('common.cancel')}
          saveLabel={t('common.save')}
          isLoading={isLoading}
          saveType="submit"
          formId="wms-scope-policy-form"
        />
      </AccessControlOpsDialogContent>
    </Dialog>
  );
}
