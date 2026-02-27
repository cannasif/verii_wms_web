import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { smtpSettingsApi } from '../api/smtpSettingsApi';

interface SendTestMailVars {
  to?: string;
}

export function useSendTestMailMutation() {
  const { t } = useTranslation('mail-settings');

  return useMutation<boolean, Error, SendTestMailVars>({
    mutationFn: (vars: SendTestMailVars) => smtpSettingsApi.sendTest(vars.to),
    onSuccess: () => {
      toast.success(t('TestMail.Success'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('SaveFailed'));
    },
  });
}
