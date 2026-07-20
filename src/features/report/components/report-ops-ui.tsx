import { type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { WmsIcon, type WmsIconData } from '@/components/shared';
import { cn } from '@/lib/utils';

export function ReportsOpsStatusBar({
  moduleCount,
  modulesLabel,
  statusLabel,
  hint,
}: {
  moduleCount: number;
  modulesLabel: string;
  statusLabel: string;
  hint: string;
}): ReactElement {
  return (
    <div className="wms-ops-reports-status" aria-live="polite">
      <div className="wms-ops-reports-status__line">
        <span className="wms-ops-reports-status__prompt" aria-hidden>
          {'> '}
        </span>
        <span className="wms-ops-reports-status__label">
          {modulesLabel}: {String(moduleCount).padStart(2, '0')}
        </span>
        <span className="wms-ops-reports-status__sep" aria-hidden>
          {' | '}
        </span>
        <span className="wms-ops-reports-status__ready">
          {statusLabel}
          <span className="wms-ops-reports-status__cursor" aria-hidden>
            _
          </span>
        </span>
      </div>
      <p className="wms-ops-reports-status__hint">{hint}</p>
    </div>
  );
}

export function ReportsOpsSection({
  title,
  description,
  sectionCode,
  children,
}: {
  title: string;
  description: string;
  sectionCode: string;
  children: ReactNode;
}): ReactElement {
  return (
    <section className="wms-ops-reports-section">
      <header className="wms-ops-reports-section__header">
        <div className="wms-ops-pt-terminal__prompt">
          <span className="wms-ops-subtitle-prefix" aria-hidden>
            {'> '}
          </span>
          <h2 className="wms-ops-pt-terminal__title text-sm">{title}</h2>
        </div>
        <div className="wms-ops-reports-section__meta">
          <span className="wms-ops-reports-section__code">{sectionCode}</span>
          <p className="wms-ops-pt-terminal__meta text-xs">{description}</p>
        </div>
      </header>
      <div className="wms-ops-reports-section__grid">{children}</div>
    </section>
  );
}

export function ReportsOpsModuleCard({
  index,
  moduleCode,
  title,
  description,
  badge,
  href,
  icon,
  openLabel,
  routePrefix,
}: {
  index: number;
  moduleCode: string;
  title: string;
  description: string;
  badge: string;
  href: string;
  icon: WmsIconData;
  openLabel: string;
  routePrefix: string;
}): ReactElement {
  return (
    <Link to={href} className={cn('wms-ops-reports-module group')}>
      <span className="wms-ops-reports-module__frame" aria-hidden>
        <span className="wms-ops-reports-module__corner wms-ops-reports-module__corner--tl wms-ops-reports-module__glitch" />
        <span className="wms-ops-reports-module__corner wms-ops-reports-module__corner--tr wms-ops-reports-module__glitch" />
        <span className="wms-ops-reports-module__corner wms-ops-reports-module__corner--bl wms-ops-reports-module__glitch" />
        <span className="wms-ops-reports-module__corner wms-ops-reports-module__corner--br wms-ops-reports-module__glitch" />
        <span className="wms-ops-reports-module__scan" />
      </span>

      <div className="wms-ops-reports-module__head">
        <span className="wms-ops-reports-module__index wms-ops-reports-module__glitch">{String(index).padStart(2, '0')}</span>
        <span className="wms-ops-code-badge wms-ops-reports-module__badge">{badge}</span>
      </div>

      <div className="wms-ops-reports-module__body">
        <span className="wms-ops-reports-module__icon wms-ops-reports-module__glitch" aria-hidden>
          <WmsIcon icon={icon} size={20} />
        </span>
        <div className="min-w-0">
          <h3 className="wms-ops-reports-module__title wms-ops-reports-module__glitch">{title}</h3>
          <p className="wms-ops-reports-module__desc">{description}</p>
        </div>
      </div>

      <div className="wms-ops-reports-module__route">
        <span className="wms-ops-reports-module__route-prefix">{routePrefix}</span>
        <span className="wms-ops-reports-module__route-code wms-ops-reports-module__glitch">{moduleCode}</span>
      </div>

      <div className="wms-ops-reports-module__action">
        <span>{openLabel}</span>
        <WmsIcon icon={ArrowRight02Icon} size={16} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
