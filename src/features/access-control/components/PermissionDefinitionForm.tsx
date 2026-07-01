import { type ReactElement, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  createPermissionDefinitionSchema,
  type CreatePermissionDefinitionSchema,
} from '../schemas/permission-definition-schema';
import type { PermissionDefinitionDto } from '../types/access-control.types';
import { FieldHelpTooltip } from './FieldHelpTooltip';
import { PERMISSION_CODE_CATALOG, getRoutesForPermissionCode, getPermissionDisplayMeta } from '../utils/permission-config';
import {
  AccessControlOpsDialogContent,
  AccessControlOpsDialogFooter,
  AccessControlOpsDialogHeader,
  AccessControlOpsFormField,
} from './access-control-ops-ui';
import { MasterDataOpsFlagChip } from '@/features/shared';
import { isZodFieldRequired } from '@/lib/zod-required';
import { OpsCircuitToggleField, OpsInput, OpsTextarea } from '@/components/shared';

interface PermissionDefinitionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePermissionDefinitionSchema) => void | Promise<void>;
  item?: PermissionDefinitionDto | null;
  isLoading?: boolean;
  usedCodes?: string[];
}

export function PermissionDefinitionForm({
  open,
  onOpenChange,
  onSubmit,
  item,
  isLoading = false,
  usedCodes = [],
}: PermissionDefinitionFormProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);

  const form = useForm<CreatePermissionDefinitionSchema>({
    resolver: zodResolver(createPermissionDefinitionSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      name: '',
      description: '',
      isActive: true,
      availableOnWeb: true,
      availableOnMobile: false,
    },
  });
  const isFormValid = form.formState.isValid;

  useEffect(() => {
    if (item) {
      form.reset({
        code: item.code,
        name: item.name,
        description: item.description ?? '',
        isActive: item.isActive,
        availableOnWeb: item.availableOnWeb,
        availableOnMobile: item.availableOnMobile,
      });
    } else {
      form.reset({
        code: '',
        name: '',
        description: '',
        isActive: true,
        availableOnWeb: true,
        availableOnMobile: false,
      });
    }
  }, [item, form, open]);

  const permissionCodeOptions: ComboboxOption[] = useMemo(() => {
    const usedSet = new Set(usedCodes.map((code) => code.toLowerCase()));
    const currentCode = item?.code?.toLowerCase();

    return PERMISSION_CODE_CATALOG.filter((code) => {
      const lowerCode = code.toLowerCase();
      if (currentCode && lowerCode === currentCode) return true;
      return !usedSet.has(lowerCode);
    }).map((code) => {
      const meta = getPermissionDisplayMeta(code);
      const title = meta ? t(meta.key, meta.fallback) : code;
      return { value: code, label: `${title} (${code})` };
    });
  }, [t, usedCodes, item?.code]);

  const handleSubmit = async (data: CreatePermissionDefinitionSchema): Promise<void> => {
    await onSubmit(data);
    if (!isLoading) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AccessControlOpsDialogContent size="lg">
        <AccessControlOpsDialogHeader
          title={item ? t('permissionDefinitions.form.editTitle') : t('permissionDefinitions.form.addTitle')}
          description={item ? t('permissionDefinitions.form.editDescription') : t('permissionDefinitions.form.addDescription')}
        />
        <div className="wms-ops-form max-h-[min(68dvh,720px)] overflow-y-auto px-5 py-4">
          <Form {...form}>
            <form id="permission-definition-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <AccessControlOpsFormField label={(
                      <span className="inline-flex items-center">
                      {t('permissionDefinitions.form.code')}
                      {isZodFieldRequired(createPermissionDefinitionSchema, 'code') && <span className="text-red-500">*</span>}
                      <FieldHelpTooltip text={t('help.permissionDefinition.code')} variant="ops" />
                      </span>
                    )}>
                    <FormControl>
                      <Combobox
                        options={permissionCodeOptions}
                        value={field.value}
                        variant="ops"
                        modal
                        onValueChange={(value) => {
                          field.onChange(value);
                          const meta = getPermissionDisplayMeta(value);
                          const title = meta ? t(meta.key, meta.fallback) : '';
                          if (!form.getValues('name') && title) {
                            form.setValue('name', title, { shouldDirty: true });
                          }
                        }}
                        placeholder={t('permissionDefinitions.form.codePlaceholder')}
                        searchPlaceholder={t('permissionDefinitions.form.codeSearchPlaceholder')}
                        emptyText={t('permissionDefinitions.form.codeEmpty')}
                      />
                    </FormControl>
                    </AccessControlOpsFormField>
                    <FormMessage />
                    {field.value ? (
                      <div className="pt-3">
                        <div className="wms-ops-form-hint text-xs">
                          {t('permissionDefinitions.form.affectedRoutes'
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {getRoutesForPermissionCode(field.value).length === 0 ? (
                            <span className="wms-ops-form-hint text-xs">
                              {t('permissionDefinitions.form.affectedRoutesNone'
                              )}
                            </span>
                          ) : (
                            getRoutesForPermissionCode(field.value).map((route) => (
                              <MasterDataOpsFlagChip key={route}>
                                {route}
                              </MasterDataOpsFlagChip>
                            ))
                          )}
                        </div>
                      </div>
                    ) : null}
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <AccessControlOpsFormField label={(
                      <span className="inline-flex items-center">
                      {t('permissionDefinitions.form.name')}
                      {isZodFieldRequired(createPermissionDefinitionSchema, 'name') && <span className="text-red-500">*</span>}
                      <FieldHelpTooltip text={t('help.permissionDefinition.name')} variant="ops" />
                      </span>
                    )}>
                    <FormControl>
                      <OpsInput {...field} placeholder={t('permissionDefinitions.form.namePlaceholder')} maxLength={150} />
                    </FormControl>
                    </AccessControlOpsFormField>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <AccessControlOpsFormField label={(
                      <span className="inline-flex items-center">
                      {t('permissionDefinitions.form.description')}
                      <FieldHelpTooltip text={t('help.permissionDefinition.description')} variant="ops" />
                      </span>
                    )}>
                    <FormControl>
                      <OpsTextarea {...field} value={field.value ?? ''} placeholder={t('permissionDefinitions.form.descriptionPlaceholder')} maxLength={500} className="min-h-[80px]" />
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
                  name="availableOnWeb"
                  render={({ field }) => (
                  <FormItem>
                      <FormControl>
                        <OpsCircuitToggleField
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          title="Web"
                          description={t('permissionDefinitions.form.webHelp')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="availableOnMobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <OpsCircuitToggleField
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          title="Mobile"
                          description={t('permissionDefinitions.form.mobileHelp')}
                        />
                      </FormControl>
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
          saveDisabled={!isFormValid}
          saveType="submit"
          formId="permission-definition-form"
          leading={<FieldHelpTooltip text={t('help.permissionDefinition.save')} side="top" variant="ops" />}
        />
      </AccessControlOpsDialogContent>
    </Dialog>
  );
}
