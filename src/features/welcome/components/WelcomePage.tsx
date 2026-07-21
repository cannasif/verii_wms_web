import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { useTheme } from '@/components/theme-provider';
import { WmsIcon } from '@/components/shared';

export function WelcomePage(): ReactElement {
  const { t } = useTranslation();
  const { skin } = useTheme();
  const isPremium = skin === 'premium';

  return (
    <div className="wms-ops-welcome-page">
      <div className="wms-ops-welcome-card">
        <span className="wms-ops-welcome-card__frame" aria-hidden>
          <span className="wms-ops-welcome-card__corner wms-ops-welcome-card__corner--tl" />
          <span className="wms-ops-welcome-card__corner wms-ops-welcome-card__corner--tr" />
          <span className="wms-ops-welcome-card__corner wms-ops-welcome-card__corner--bl" />
          <span className="wms-ops-welcome-card__corner wms-ops-welcome-card__corner--br" />
        </span>
        <span className="wms-ops-welcome-card__sheen" aria-hidden />
        <div className="wms-ops-welcome-card__content">
          <p className="wms-ops-welcome-card__eyebrow">
            {isPremium
              ? t('welcome.premium.eyebrow', { defaultValue: 'Operasyon Merkezi' })
              : t('welcome.terminal.eyebrow', { defaultValue: 'WMS / TERMİNAL' })}
          </p>
          <h1 className="wms-ops-welcome-card__title">{t('welcome.title')}</h1>
          <p className="wms-ops-welcome-card__status" aria-live="polite">
            {isPremium ? null : <span aria-hidden>{'> '}</span>}
            {isPremium
              ? t('welcome.premium.accessGranted', { defaultValue: 'Giriş başarılı' })
              : t('welcome.terminal.accessGranted', { defaultValue: 'ERİŞİM ONAYLANDI' })}
            {isPremium ? null : <span className="wms-ops-welcome-card__cursor" aria-hidden>_</span>}
          </p>
          <p className="wms-ops-welcome-card__subtitle">
            {isPremium
              ? t('welcome.premium.subtitle', {
                  defaultValue: 'Depo operasyonlarınıza kaldığınız yerden devam edin.',
                })
              : t('welcome.subtitle')}
          </p>
          <Link to="/dashboard" className="wms-ops-welcome-card__cta group">
            <span>
              {isPremium
                ? t('welcome.premium.goToDashboard', { defaultValue: 'Panele devam et' })
                : t('welcome.goToDashboard')}
            </span>
            <WmsIcon icon={ArrowRight02Icon} size={16} className="wms-ops-welcome-card__cta-icon" />
          </Link>
        </div>
      </div>
    </div>
  );
}
