import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { MailSettingsForm } from '../components/MailSettingsForm';
import { useSmtpSettingsQuery } from '../hooks/useSmtpSettingsQuery';
import { useUpdateSmtpSettingsMutation } from '../hooks/useUpdateSmtpSettingsMutation';
import type { SmtpSettingsFormSchema } from '../types/smtpSettings';

export function MailSettingsPage(): ReactElement {
  const { t } = useTranslation('mail-settings');
  const { setPageTitle } = useUIStore();
  const { data, isLoading } = useSmtpSettingsQuery();
  const updateMutation = useUpdateSmtpSettingsMutation();

  useEffect(() => {
    setPageTitle(t('PageTitle'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const handleSubmit = async (values: SmtpSettingsFormSchema): Promise<void> => {
    await updateMutation.mutateAsync({
      host: values.host,
      port: values.port,
      enableSsl: values.enableSsl,
      username: values.username,
      ...(values.password ? { password: values.password } : {}),
      fromEmail: values.fromEmail,
      fromName: values.fromName,
      timeout: values.timeout,
    });
  };

  return (
    <div className="space-y-6 crm-page">
      <div>
        <h1 className="text-2xl font-bold">
          {t('PageTitle')}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('PageDescription')}
        </p>
      </div>
      <MailSettingsForm
        data={data}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
