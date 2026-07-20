import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/components/theme-provider';

export function RouteErrorPage() {
  const { t } = useTranslation();
  const { skin } = useTheme();
  const isPremium = skin === 'premium';
  const error = useRouteError();

  let title = t('routeError.title');
  let description = t('routeError.description');

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    description = typeof error.data === 'string' && error.data.trim().length > 0
      ? error.data
      : description;
  } else if (error instanceof Error && error.message.trim().length > 0) {
    description = error.message;
  }

  return (
    <div className="wms-ops-route-error">
      <div className="wms-ops-route-error__card">
        <p className="wms-ops-route-error__code">
          {isPremium
            ? t('routeError.premiumLabel', { defaultValue: 'Bir sorun oluştu' })
            : '// SYS_ERR'}
        </p>
        <h1 className="wms-ops-route-error__title">{title}</h1>
        <p className="wms-ops-route-error__description">{description}</p>
        <div className="wms-ops-route-error__actions">
          <button
            type="button"
            className="wms-ops-route-error__btn wms-ops-route-error__btn--primary"
            onClick={() => window.location.reload()}
          >
            {t('routeError.refresh')}
          </button>
          <button
            type="button"
            className="wms-ops-route-error__btn wms-ops-route-error__btn--secondary"
            onClick={() => window.location.assign('/')}
          >
            {t('routeError.home')}
          </button>
        </div>
      </div>
    </div>
  );
}
