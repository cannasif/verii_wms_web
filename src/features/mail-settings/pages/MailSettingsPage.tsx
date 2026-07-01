import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { OpsFormPageShell } from '@/components/shared';
import { ADMIN_OPS_PAGE_CLASS } from '@/features/access-control';
import { MailSettingsForm } from '../components/MailSettingsForm';
import { useSmtpSettingsQuery } from '../hooks/useSmtpSettingsQuery';
import { useUpdateSmtpSettingsMutation } from '../hooks/useUpdateSmtpSettingsMutation';
import type { SmtpSettingsFormSchema } from '../types/smtpSettings';

function MailSettingsOpsEyebrow(): ReactElement {
  const { t } = useTranslation(['mail-settings', 'access-control']);

  return (
    <>
      <span>{t('sidebar.accessControl', { ns: 'access-control', defaultValue: 'Access Control' })}</span>
      <span className="mx-2 opacity-60">/</span>
      <span>{t('PageTitle')}</span>
    </>
  );
}

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
    <OpsFormPageShell
      className={ADMIN_OPS_PAGE_CLASS}
      eyebrow={<MailSettingsOpsEyebrow />}
      title={t('PageTitle')}
      description={t('PageDescription')}
    >
      <MailSettingsForm
        data={data}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </OpsFormPageShell>
  );
}
