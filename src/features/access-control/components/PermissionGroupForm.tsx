import { type ReactElement, useEffect, useRef, useLayoutEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { PermissionDefinitionMultiSelect } from './PermissionDefinitionMultiSelect';
import { FieldHelpTooltip } from './FieldHelpTooltip';
import { createPermissionGroupSchema, type CreatePermissionGroupSchema } from '../schemas/permission-group-schema';
import type { PermissionGroupDto } from '../types/access-control.types';
import { isZodFieldRequired } from '@/lib/zod-required';
import { OpsCircuitToggleField, OpsInput, OpsTextarea } from '@/components/shared';
import {
  AccessControlOpsDialogContent,
  AccessControlOpsDialogFooter,
  AccessControlOpsDialogHeader,
  AccessControlOpsFormField,
} from './access-control-ops-ui';

interface PermissionGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePermissionGroupSchema) => void | Promise<void>;
  item?: PermissionGroupDto | null;
  isLoading?: boolean;
}

export function PermissionGroupForm({
  open,
  onOpenChange,
  onSubmit,
  item,
  isLoading = false,
}: PermissionGroupFormProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);

  const form = useForm<CreatePermissionGroupSchema>({
    resolver: zodResolver(createPermissionGroupSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      isSystemAdmin: false,
      isActive: true,
      permissionDefinitionIds: [],
    },
  });
  const isFormValid = form.formState.isValid;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => firstInputRef.current?.focus({ preventScroll: true }), 0);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        description: item.description ?? '',
        isSystemAdmin: item.isSystemAdmin,
        isActive: item.isActive,
        permissionDefinitionIds: item.permissionDefinitionIds ?? [],
      });
    } else {
      form.reset({
        name: '',
        description: '',
        isSystemAdmin: false,
        isActive: true,
        permissionDefinitionIds: [],
      });
    }
  }, [item, form, open]);

  useLayoutEffect(() => {
    if (!open) return;
    const el = scrollContainerRef.current;
    const saved = scrollTopRef.current;
    if (el && saved > 0 && el.scrollTop === 0) {
      el.scrollTop = saved;
    }
  });

  const handleSubmit = async (data: CreatePermissionGroupSchema): Promise<void> => {
    await onSubmit(data);
    if (!isLoading) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AccessControlOpsDialogContent size="full">
        <div className="flex flex-col max-h-[min(92dvh,900px)] min-h-0 overflow-hidden">
          <AccessControlOpsDialogHeader
            title={item ? t('permissionGroups.form.editTitle') : t('permissionGroups.form.addTitle')}
            description={item ? t('permissionGroups.form.editDescription') : t('permissionGroups.form.addDescription')}
          />

          <div
            ref={scrollContainerRef}
            className="wms-ops-form flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 py-4"
            onScroll={(e) => { scrollTopRef.current = e.currentTarget.scrollTop; }}
          >
            <Form {...form}>
            <form id="permission-group-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  (() => {
                    const { ref, ...fieldProps } = field;
                    return (
                  <FormItem>
                    <AccessControlOpsFormField label={(
                      <span className="inline-flex items-center">
                      {t('permissionGroups.form.name')}
                      {isZodFieldRequired(createPermissionGroupSchema, 'name') && <span className="text-red-500">*</span>}
                      <FieldHelpTooltip text={t('help.permissionGroup.name')} variant="ops" />
                      </span>
                    )}>
                    <FormControl>
                      <OpsInput
                        ref={(el) => {
                          ref(el);
                          firstInputRef.current = el;
                        }}
                        {...fieldProps}
                        placeholder={t('permissionGroups.form.namePlaceholder')}
                        maxLength={100}
                      />
                    </FormControl>
                    </AccessControlOpsFormField>
                    <FormMessage />
                  </FormItem>
                    );
                  })()
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <AccessControlOpsFormField label={t('permissionGroups.form.description')}>
                    <FormControl>
                      <OpsTextarea {...field} value={field.value ?? ''} placeholder={t('permissionGroups.form.descriptionPlaceholder')} maxLength={500} className="min-h-[80px]" />
                    </FormControl>
                    </AccessControlOpsFormField>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <OpsCircuitToggleField
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        title={t('permissionGroups.form.isActive')}
                        description={<FieldHelpTooltip text={t('help.permissionGroup.isActive')} variant="ops" />}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="permissionDefinitionIds"
                render={({ field }) => (
                  <FormItem>
                    <AccessControlOpsFormField label={(
                      <span className="inline-flex items-center">
                        {t('permissionGroups.form.permissions')}
                        <FieldHelpTooltip text={t('help.permissionGroup.permissions')} variant="ops" />
                      </span>
                    )}>
                    <FormControl>
                      <PermissionDefinitionMultiSelect value={field.value} onChange={field.onChange} disabled={isLoading} />
                    </FormControl>
                    </AccessControlOpsFormField>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            formId="permission-group-form"
            leading={<FieldHelpTooltip text={t('help.permissionGroup.save')} side="top" variant="ops" />}
          />
        </div>
      </AccessControlOpsDialogContent>
    </Dialog>
  );
}
