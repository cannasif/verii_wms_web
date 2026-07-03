import { type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MasterDataOpsFlagChip } from '@/features/shared';
import type { DashboardActivityItem } from '../hooks/useDashboardMetrics';

export function DashboardOpsHero({
  eyebrow,
  title,
  subtitle,
  operatorLabel,
  operatorValue,
  branchLabel,
  branchValue,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  operatorLabel: string;
  operatorValue: string;
  branchLabel: string;
  branchValue: string;
}): ReactElement {
  return (
    <header className="wms-ops-dashboard-hero">
      <span className="wms-ops-dashboard-hero__frame" aria-hidden>
        <span className="wms-ops-dashboard-hero__corner wms-ops-dashboard-hero__corner--tl" />
        <span className="wms-ops-dashboard-hero__corner wms-ops-dashboard-hero__corner--tr" />
        <span className="wms-ops-dashboard-hero__corner wms-ops-dashboard-hero__corner--bl" />
        <span className="wms-ops-dashboard-hero__corner wms-ops-dashboard-hero__corner--br" />
        <span className="wms-ops-dashboard-hero__glow" />
      </span>
      <div className="wms-ops-dashboard-hero__content">
        <p className="wms-ops-dashboard-hero__eyebrow">{eyebrow}</p>
        <h1 className="wms-ops-dashboard-hero__title">{title}</h1>
        <p className="wms-ops-dashboard-hero__subtitle">{subtitle}</p>
        <div className="wms-ops-dashboard-hero__meta">
          <div className="wms-ops-dashboard-hero__meta-item">
            <span className="wms-ops-dashboard-hero__meta-label">{operatorLabel}</span>
            <span className="wms-ops-dashboard-hero__meta-value">{operatorValue}</span>
          </div>
          <div className="wms-ops-dashboard-hero__meta-item">
            <span className="wms-ops-dashboard-hero__meta-label">{branchLabel}</span>
            <span className="wms-ops-dashboard-hero__meta-value">{branchValue}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export function DashboardOpsStatusBar({
  pulseLabel,
  pulseValue,
  tasksLabel,
  tasksValue,
  hint,
}: {
  pulseLabel: string;
  pulseValue: string;
  tasksLabel: string;
  tasksValue: string;
  hint: string;
}): ReactElement {
  return (
    <div className="wms-ops-dashboard-status" aria-live="polite">
      <div className="wms-ops-dashboard-status__line">
        <span className="wms-ops-dashboard-status__prompt" aria-hidden>{'> '}</span>
        <span className="wms-ops-dashboard-status__label">{pulseLabel}: {pulseValue}</span>
        <span className="wms-ops-dashboard-status__sep" aria-hidden>{' | '}</span>
        <span className="wms-ops-dashboard-status__ready">
          {tasksLabel}: {tasksValue}
          <span className="wms-ops-dashboard-status__cursor" aria-hidden>_</span>
        </span>
      </div>
      <p className="wms-ops-dashboard-status__hint">{hint}</p>
    </div>
  );
}

export function DashboardOpsPanel({
  children,
  className,
  withCorners = true,
}: {
  children: ReactNode;
  className?: string;
  withCorners?: boolean;
}): ReactElement {
  return (
    <div className={cn('wms-ops-dashboard-panel', className)}>
      {withCorners ? (
        <span className="wms-ops-dashboard-panel__frame" aria-hidden>
          <span className="wms-ops-dashboard-panel__corner wms-ops-dashboard-panel__corner--tl" />
          <span className="wms-ops-dashboard-panel__corner wms-ops-dashboard-panel__corner--tr" />
          <span className="wms-ops-dashboard-panel__corner wms-ops-dashboard-panel__corner--bl" />
          <span className="wms-ops-dashboard-panel__corner wms-ops-dashboard-panel__corner--br" />
        </span>
      ) : null}
      <div className="wms-ops-dashboard-panel__content">{children}</div>
    </div>
  );
}

export function DashboardOpsMetricTile({
  label,
  value,
  hint,
  tone = 'default',
  isLoading = false,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  tone?: 'default' | 'accent' | 'warn' | 'success';
  isLoading?: boolean;
}): ReactElement {
  return (
    <article className={cn('wms-ops-dashboard-metric', tone !== 'default' && `wms-ops-dashboard-metric--${tone}`)}>
      <span className="wms-ops-dashboard-metric__label">{label}</span>
      <div className="wms-ops-dashboard-metric__value">
        {isLoading ? '…' : value}
      </div>
      <p className="wms-ops-dashboard-metric__hint">{hint}</p>
    </article>
  );
}

export function DashboardOpsSection({
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
    <section className="wms-ops-dashboard-section">
      <span className="wms-ops-dashboard-section__frame" aria-hidden>
        <span className="wms-ops-dashboard-section__corner wms-ops-dashboard-section__corner--tl" />
        <span className="wms-ops-dashboard-section__corner wms-ops-dashboard-section__corner--tr" />
        <span className="wms-ops-dashboard-section__corner wms-ops-dashboard-section__corner--bl" />
        <span className="wms-ops-dashboard-section__corner wms-ops-dashboard-section__corner--br" />
      </span>
      <header className="wms-ops-dashboard-section__header">
        <div className="wms-ops-pt-terminal__prompt">
          <span className="wms-ops-subtitle-prefix" aria-hidden>{'> '}</span>
          <h2 className="wms-ops-pt-terminal__title text-sm">{title}</h2>
        </div>
        <div className="wms-ops-dashboard-section__meta">
          <span className="wms-ops-code-badge">{sectionCode}</span>
          <p className="wms-ops-pt-terminal__meta text-xs">{description}</p>
        </div>
      </header>
      <div className="wms-ops-dashboard-section__body">{children}</div>
    </section>
  );
}

export function DashboardOpsActivityFeed({
  items,
  emptyText,
  kindLabels,
  statusLabels,
  formatTimestamp,
}: {
  items: DashboardActivityItem[];
  emptyText: string;
  kindLabels: Record<DashboardActivityItem['kind'], string>;
  statusLabels: Record<DashboardActivityItem['statusKey'], string>;
  formatTimestamp: (value: string) => string;
}): ReactElement {
  if (items.length === 0) {
    return <p className="wms-ops-dashboard-activity__empty">{emptyText}</p>;
  }

  return (
    <div className="wms-ops-dashboard-activity-panel">
      <ul className="wms-ops-dashboard-activity">
      {items.map((item) => (
        <li key={item.id} className="wms-ops-dashboard-activity__row">
          <div className="wms-ops-dashboard-activity__rail" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <MasterDataOpsFlagChip tone="info">{kindLabels[item.kind]}</MasterDataOpsFlagChip>
              <MasterDataOpsFlagChip tone={item.statusKey === 'completed' ? 'success' : item.statusKey === 'pending' ? 'warn' : 'default'}>
                {statusLabels[item.statusKey]}
              </MasterDataOpsFlagChip>
            </div>
            <p className="wms-ops-dashboard-activity__title">{item.title}</p>
            <p className="wms-ops-dashboard-activity__subtitle">{item.subtitle}</p>
            <p className="wms-ops-dashboard-activity__time">{formatTimestamp(item.timestamp)}</p>
          </div>
        </li>
      ))}
      </ul>
    </div>
  );
}

export function DashboardOpsQuickLink({
  index,
  moduleCode,
  title,
  description,
  href,
  icon: Icon,
  openLabel,
}: {
  index: number;
  moduleCode: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  openLabel: string;
}): ReactElement {
  return (
    <Link to={href} className="wms-ops-dashboard-module group">
      <span className="wms-ops-dashboard-module__frame" aria-hidden>
        <span className="wms-ops-dashboard-module__corner wms-ops-dashboard-module__corner--tl" />
        <span className="wms-ops-dashboard-module__corner wms-ops-dashboard-module__corner--tr" />
        <span className="wms-ops-dashboard-module__corner wms-ops-dashboard-module__corner--bl" />
        <span className="wms-ops-dashboard-module__corner wms-ops-dashboard-module__corner--br" />
        <span className="wms-ops-dashboard-module__scan" />
      </span>
      <div className="wms-ops-dashboard-module__head">
        <span className="wms-ops-dashboard-module__index">{String(index).padStart(2, '0')}</span>
        <span className="wms-ops-code-badge">{moduleCode}</span>
      </div>
      <div className="wms-ops-dashboard-module__body">
        <span className="wms-ops-dashboard-module__icon" aria-hidden>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="wms-ops-dashboard-module__title">{title}</h3>
          <p className="wms-ops-dashboard-module__desc">{description}</p>
        </div>
      </div>
      <div className="wms-ops-dashboard-module__action">
        <span>{openLabel}</span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </div>
    </Link>
  );
}
