import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';
import { OpsToggleField } from './OpsToggleField';

interface HeaderQuantityPolicyFieldsProps {
  permissionCode: string;
  variant?: 'default' | 'ops';
}

export function HeaderQuantityPolicyFields({
  permissionCode,
  variant = 'default',
}: HeaderQuantityPolicyFieldsProps): ReactElement {
  const { t } = useTranslation();
  const form = useFormContext();
  const permissionAccess = usePermissionAccess();
  const canOverride = permissionAccess.can(permissionCode);
  const isOps = variant === 'ops';

  const renderField = (
    name: 'allowLessQuantityBasedOnOrder' | 'allowMoreQuantityBasedOnOrder',
    titleKey: string,
    descriptionKey: string,
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {isOps ? (
            <OpsToggleField
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
              disabled={!canOverride}
              title={t(titleKey)}
              description={t(descriptionKey)}
            />
          ) : (
            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <input
                  type="checkbox"
                  checked={Boolean(field.value)}
                  onChange={(event) => field.onChange(event.target.checked)}
                  disabled={!canOverride}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{t(titleKey)}</FormLabel>
                <p className="text-sm text-muted-foreground">
                  {t(descriptionKey)}
                </p>
              </div>
            </div>
          )}
        </FormItem>
      )}
    />
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {renderField(
        'allowLessQuantityBasedOnOrder',
        'parameters.form.allowLessQuantity',
        'parameters.form.allowLessQuantityDescription',
      )}
      {renderField(
        'allowMoreQuantityBasedOnOrder',
        'parameters.form.allowMoreQuantity',
        'parameters.form.allowMoreQuantityDescription',
      )}
    </div>
  );
}
