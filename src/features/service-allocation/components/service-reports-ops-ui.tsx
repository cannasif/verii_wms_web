import { type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { OpsActionButton } from '@/components/shared';
import { cn } from '@/lib/utils';

interface ServiceReportKpiCardProps {
  label: string;
  value: number;
  href: string;
  actionLabel: string;
  icon: LucideIcon;
  tone?: 'default' | 'warn' | 'info' | 'success';
}

const KPI_TONE_CLASS: Record<NonNullable<ServiceReportKpiCardProps['tone']>, string> = {
  default: 'wms-ops-service-reports__kpi--default',
  warn: 'wms-ops-service-reports__kpi--warn',
  info: 'wms-ops-service-reports__kpi--info',
  success: 'wms-ops-service-reports__kpi--success',
};

export function ServiceReportKpiCard({
  label,
  value,
  href,
  actionLabel,
  icon: Icon,
  tone = 'default',
}: ServiceReportKpiCardProps): ReactElement {
  return (
    <article className={cn('wms-ops-prelabel-panel wms-ops-service-reports__kpi', KPI_TONE_CLASS[tone])}>
      <div className="wms-ops-prelabel-panel__header flex items-center justify-between gap-3 py-3">
        <div className="wms-ops-prelabel-panel__title">{label}</div>
        <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
      </div>
      <div className="wms-ops-prelabel-panel__body space-y-3 pt-0">
        <div className="wms-ops-service-reports__kpi-value">{value}</div>
        <Link to={href} className="wms-ops-service-reports__kpi-link">
          {actionLabel}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

interface ServiceReportPanelProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ServiceReportPanel({ title, children, actions, className }: ServiceReportPanelProps): ReactElement {
  return (
    <section className={cn('wms-ops-prelabel-panel min-w-0 max-w-full', className)}>
      <div className="wms-ops-prelabel-panel__header flex flex-wrap items-center justify-between gap-3">
        <div className="wms-ops-prelabel-panel__title">{title}</div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="wms-ops-prelabel-panel__body">{children}</div>
    </section>
  );
}

export interface ServiceReportTableColumn {
  key: string;
  label: string;
  className?: string;
}

interface ServiceReportTableProps<T> {
  title?: string;
  badge?: ReactNode;
  columns: ServiceReportTableColumn[];
  rows: T[];
  emptyText: string;
  rowKey: (row: T) => string | number;
  renderRow: (row: T) => ReactNode;
}

export function ServiceReportTable<T>({
  title,
  badge,
  columns,
  rows,
  emptyText,
  rowKey,
  renderRow,
}: ServiceReportTableProps<T>): ReactElement {
  return (
    <div className="wms-ops-prelabel-lines min-w-0 max-w-full">
      {title || badge ? (
        <div className="wms-ops-prelabel-lines__head">
          {title ? <div className="wms-ops-prelabel-panel__title text-[0.68rem]">{title}</div> : <span />}
          {badge ? <div className="flex flex-wrap items-center gap-2">{badge}</div> : null}
        </div>
      ) : null}
      <div className="wms-ops-prelabel-lines__table-wrap min-w-0 max-w-full">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.className}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="wms-ops-service-reports__empty-cell">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => <tr key={rowKey(row)}>{renderRow(row)}</tr>)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ServiceReportDistributionPanelProps {
  title: string;
  emptyText: string;
  items: Array<{ key: string; label: ReactNode; count: number }>;
  badgeTone?: 'pending' | 'active' | 'done';
}

export function ServiceReportDistributionPanel({
  title,
  emptyText,
  items,
  badgeTone = 'pending',
}: ServiceReportDistributionPanelProps): ReactElement {
  const badgeClass =
    badgeTone === 'done'
      ? 'wms-ops-status-badge--done'
      : badgeTone === 'active'
        ? 'wms-ops-status-badge--active'
        : 'wms-ops-status-badge--pending';

  return (
    <ServiceReportPanel title={title}>
      {items.length === 0 ? (
        <p className="wms-ops-prelabel-panel__hint">{emptyText}</p>
      ) : (
        <ul className="wms-ops-service-reports__dist-list">
          {items.map((item) => (
            <li key={item.key} className="wms-ops-service-reports__dist-row">
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <span className={cn('wms-ops-status-badge shrink-0', badgeClass)}>{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </ServiceReportPanel>
  );
}

interface ServiceReportFooterStatProps {
  label: string;
  value: number;
  href: string;
  actionLabel: string;
}

export function ServiceReportFooterStat({ label, value, href, actionLabel }: ServiceReportFooterStatProps): ReactElement {
  return (
    <article className="wms-ops-stat-card wms-ops-service-reports__footer-stat">
      <div className="wms-ops-stat-card__value">{value}</div>
      <div className="wms-ops-stat-card__label">{label}</div>
      <Link to={href} className="wms-ops-service-reports__kpi-link mt-2">
        {actionLabel}
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </article>
  );
}

export function ServiceReportPanelLink({
  to,
  label,
}: {
  to: string;
  label: string;
}): ReactElement {
  return (
    <OpsActionButton asChild type="button" variant="secondary">
      <Link to={to}>
        {label}
        <ArrowRight className="ml-2 size-4" aria-hidden />
      </Link>
    </OpsActionButton>
  );
}
