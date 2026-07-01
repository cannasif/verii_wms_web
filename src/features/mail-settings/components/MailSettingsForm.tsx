import { type ReactElement, useEffect } from 'react';
import { type Resolver, type SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  smtpSettingsFormSchema,
  type SmtpSettingsFormSchema,
  type SmtpSettingsDto,
} from '../types/smtpSettings';
import { useSendTestMailMutation } from '../hooks/useSendTestMailMutation';
import { AccessControlOpsFormField, AccessControlOpsSection } from '@/features/access-control';
import { OpsActionButton, OpsCircuitToggleField, OpsInput } from '@/components/shared';

interface MailSettingsFormProps {
  data: SmtpSettingsDto | undefined;
  isLoading: boolean;
  onSubmit: (data: SmtpSettingsFormSchema) => void | Promise<void>;
  isSubmitting: boolean;
}

export function MailSettingsForm({
  data,
  isLoading,
  onSubmit,
  isSubmitting,
}: MailSettingsFormProps): ReactElement {
  const { t } = useTranslation(['mail-settings', 'common']);
  const testMailMutation = useSendTestMailMutation();

  const form = useForm<SmtpSettingsFormSchema>({
    resolver: zodResolver(smtpSettingsFormSchema) as Resolver<SmtpSettingsFormSchema>,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      host: '',
      port: 587,
      enableSsl: true,
      username: '',
      password: '',
      fromEmail: '',
      fromName: '',
      timeout: 30,
    },
  });
  const isFormValid = form.formState.isValid;

  useEffect(() => {
    if (data) {
      form.reset({
        host: data.host,
        port: data.port,
        enableSsl: data.enableSsl,
        username: data.username,
        password: '',
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        timeout: data.timeout,
      });
    }
  }, [data, form]);

  const handleSubmit: SubmitHandler<SmtpSettingsFormSchema> = (values) => {
    onSubmit(values);
  };

  if (isLoading) {
    return <div className="wms-ops-form-hint py-4 text-sm">{t('common.loading')}</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <AccessControlOpsSection title={t('PageTitle')} subtitle={t('PageDescription')}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <AccessControlOpsFormField label={`${t('Fields.Host')} *`}>
                    <FormControl>
                      <OpsInput type="text" placeholder="smtp.gmail.com" {...field} />
                    </FormControl>
                  </AccessControlOpsFormField>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <AccessControlOpsFormField label={t('Fields.Port')}>
                    <FormControl>
                      <OpsInput
                        type="number"
                        min={1}
                        max={65535}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                      />
                    </FormControl>
                  </AccessControlOpsFormField>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <AccessControlOpsFormField label={`${t('Fields.Username')} *`}>
                    <FormControl>
                      <OpsInput type="text" {...field} />
                    </FormControl>
                  </AccessControlOpsFormField>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <AccessControlOpsFormField label={t('Fields.Password')}>
                    <FormControl>
                      <OpsInput type="password" placeholder={t('Fields.PasswordPlaceholder')} {...field} />
                    </FormControl>
                  </AccessControlOpsFormField>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromEmail"
              render={({ field }) => (
                <FormItem>
                  <AccessControlOpsFormField label={`${t('Fields.FromEmail')} *`}>
                    <FormControl>
                      <OpsInput type="email" {...field} />
                    </FormControl>
                  </AccessControlOpsFormField>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromName"
              render={({ field }) => (
                <FormItem>
                  <AccessControlOpsFormField label={`${t('Fields.FromName')} *`}>
                    <FormControl>
                      <OpsInput type="text" readOnly disabled {...field} />
                    </FormControl>
                  </AccessControlOpsFormField>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeout"
              render={({ field }) => (
                <FormItem>
                  <AccessControlOpsFormField label={t('Fields.Timeout')}>
                    <FormControl>
                      <OpsInput
                        type="number"
                        min={1}
                        max={300}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
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
            name="enableSsl"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormControl>
                  <OpsCircuitToggleField
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    title={t('Fields.EnableSsl')}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </AccessControlOpsSection>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <OpsActionButton
            type="button"
            variant="secondary"
            onClick={() => testMailMutation.mutate({})}
            disabled={isSubmitting || testMailMutation.isPending}
          >
            {testMailMutation.isPending ? t('TestMail.Sending') : t('TestMail.Send')}
          </OpsActionButton>
          <OpsActionButton type="submit" variant="primary" disabled={isSubmitting || !isFormValid}>
            {isSubmitting ? t('common.saving') : t('Save')}
          </OpsActionButton>
        </div>
      </form>
    </Form>
  );
}
