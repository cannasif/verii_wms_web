import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function WelcomePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <div className="wms-ops-welcome-page">
      <div className="wms-ops-welcome-card">
        <span className="wms-ops-welcome-card__frame" aria-hidden>
          <span className="wms-ops-welcome-card__corner wms-ops-welcome-card__corner--tl" />
          <span className="wms-ops-welcome-card__corner wms-ops-welcome-card__corner--tr" />
          <span className="wms-ops-welcome-card__corner wms-ops-welcome-card__corner--bl" />
          <span className="wms-ops-welcome-card__corner wms-ops-welcome-card__corner--br" />
        </span>
        <div className="wms-ops-welcome-card__content">
          <p className="wms-ops-welcome-card__eyebrow">
            {t('welcome.terminal.eyebrow', { defaultValue: 'WMS / TERMİNAL' })}
          </p>
          <h1 className="wms-ops-welcome-card__title">{t('welcome.title')}</h1>
          <p className="wms-ops-welcome-card__status" aria-live="polite">
            <span aria-hidden>{'> '}</span>
            {t('welcome.terminal.accessGranted', { defaultValue: 'ERİŞİM ONAYLANDI' })}
            <span className="wms-ops-welcome-card__cursor" aria-hidden>_</span>
          </p>
          <p className="wms-ops-welcome-card__subtitle">{t('welcome.subtitle')}</p>
          <Link to="/dashboard" className="wms-ops-welcome-card__cta group">
            <span>{t('welcome.goToDashboard')}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
