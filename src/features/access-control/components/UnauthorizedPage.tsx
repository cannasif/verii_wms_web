import { type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsListPageShell } from '@/components/shared';
import { ACCESS_CONTROL_OPS_PAGE_CLASS, AccessControlOpsEyebrow } from './access-control-ops-ui';

export function UnauthorizedPage(): ReactElement {
  const { t } = useTranslation('access-control');
  const navigate = useNavigate();

  return (
    <OpsListPageShell
      className={ACCESS_CONTROL_OPS_PAGE_CLASS}
      eyebrow={<AccessControlOpsEyebrow page={t('unauthorized.title')} />}
      title={t('unauthorized.title')}
      description={t('unauthorized.description')}
      actions={(
        <OpsActionButton type="button" onClick={() => navigate('/')}>
          {t('unauthorized.action')}
        </OpsActionButton>
      )}
    >
      <div className="wms-ops-form-hint py-8 text-center">{t('unauthorized.description')}</div>
    </OpsListPageShell>
  );
}
