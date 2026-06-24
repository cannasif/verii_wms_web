import { type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DialogContent } from '@/components/ui/dialog';
import { SelectTrigger } from '@/components/ui/select';
import { OpsFieldShell } from '@/components/shared/OpsFieldShell';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';

export const HAK_EDIS_ORDER_COLUMN_WIDTHS: Record<string, number> = {
  siparisNo: 10,
  orderDate: 9,
  customer: 13,
  hakEdisRequired: 6,
  transferAll: 6,
  orderDetail: 11,
  remaining: 7,
  available: 8,
  allocated: 7,
  ready: 7,
  status: 13,
  evaluatedAt: 9,
  actions: 3,
};

export const HAK_EDIS_ORDER_SUMMARY_COLUMN_WIDTHS: Record<string, number> = {
  siparisNo: 11,
  orderDate: 9,
  customer: 12,
  flags: 9,
  expectedTotalQty: 9,
  unplannedNeedQty: 8,
  hakEdisFlow: 9,
  returnFlow: 8,
  shipmentFlow: 10,
  warehouse: 10,
  status: 11,
  lastEvaluationDate: 10,
};

function hakEdisStatusTone(status: string): string {
  if (status === 'Completed' || status === 'ReadyForShipment' || status === 'Ready' || status === 'ShipmentCreated') {
    return 'wms-ops-status-badge--done';
  }
  if (
    status === 'InHakEdisFlow'
    || status === 'TransferToHakEdis'
    || status === 'AtHakEdis'
    || status === 'InProgress'
    || status === 'ReplenishmentToIntermediate'
    || status === 'ReplenishmentToOrderWarehouse'
    || status === 'ReturnFromHakEdis'
  ) {
    return 'wms-ops-status-badge--active';
  }
  if (status === 'Blocked' || status === 'Cancelled') {
    return 'wms-ops-status-badge--danger';
  }
  return 'wms-ops-status-badge--pending';
}

export const HAK_EDIS_PENDING_COLUMN_WIDTHS: Record<string, number> = {
  siparisNo: 10,
  customer: 11,
  stock: 12,
  warehouseFlow: 8,
  quantity: 5,
  currentStage: 10,
  pendingAction: 14,
  documents: 12,
  updatedAt: 10,
  actions: 3,
};

export function hakEdisOpsStatusBadge(status: string, label: string, options?: { inline?: boolean }): ReactElement {
  return (
    <span
      className={cn(
        'wms-ops-status-badge wms-ops-bilginoglu-status-badge inline-flex',
        !options?.inline && 'mx-auto',
        hakEdisStatusTone(status),
      )}
      title={label}
    >
      {label}
    </span>
  );
}

export function HakEdisOpsDialogContent({
  children,
  className,
  size = 'detail',
}: {
  children: ReactNode;
  className?: string;
  size?: 'detail' | 'bulk';
}): ReactElement {
  return (
    <DialogContent
      className={cn(
        'wms-ops-form wms-ops-detail-dialog wms-ops-bilginoglu-detail',
        'flex max-h-[min(92dvh,100%)] w-[96vw] max-w-[96vw] flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none backdrop-blur-none',
        'data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100',
        'max-sm:top-3 max-sm:max-h-[calc(100dvh-1.5rem)] max-sm:translate-y-0',
        size === 'bulk'
          ? 'wms-ops-bilginoglu-detail--bulk sm:max-w-[min(92vw,56rem)] lg:max-w-[min(90vw,56rem)]'
          : 'wms-ops-bilginoglu-detail--order sm:max-w-[min(92vw,72rem)] lg:max-w-[min(90vw,76rem)] xl:max-w-[88rem]',
        className,
      )}
    >
      {children}
    </DialogContent>
  );
}

export function HakEdisOpsSyncButton({
  loading,
  disabled,
  onClick,
  children,
}: {
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}): ReactElement {
  return (
    <button
      type="button"
      className={cn('wms-ops-action-btn wms-ops-sync-btn', loading && 'wms-ops-sync-btn--loading')}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
    >
      <span className="wms-ops-sync-btn__scan" aria-hidden />
      <span className="wms-ops-sync-btn__label">{children}</span>
    </button>
  );
}

export function HakEdisPageSection({ children, className }: { children: ReactNode; className?: string }): ReactElement {
  return <div className={cn('wms-ops-bilginoglu-page-section', className)}>{children}</div>;
}

export function HakEdisNeedCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'info' | 'warn' | 'danger';
}): ReactElement {
  return (
    <article className={cn('wms-ops-stat-card wms-ops-bilginoglu-metric text-left', `wms-ops-bilginoglu-metric--${tone}`)}>
      <div className="wms-ops-stat-card__label">{label}</div>
      <div className="wms-ops-stat-card__value">{value}</div>
    </article>
  );
}

export function HakEdisMetricGrid({ children }: { children: ReactNode }): ReactElement {
  return <div className="wms-ops-bilginoglu-metrics">{children}</div>;
}

export function HakEdisSummaryMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}): ReactElement {
  return (
    <article className="wms-ops-stat-card wms-ops-bilginoglu-summary-metric text-left">
      <div className="flex items-start gap-3">
        <span className="wms-ops-bilginoglu-summary-metric__icon" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0">
          <div className="wms-ops-stat-card__label">{label}</div>
          <div className="wms-ops-stat-card__value">{value}</div>
        </div>
      </div>
    </article>
  );
}

export function HakEdisDetailPanel({
  title,
  children,
  actions,
  className,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <section className={cn('wms-ops-detail-panel overflow-hidden', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 max-sm:flex-col max-sm:items-stretch">
        <h3 className="wms-ops-detail-section-title">{title}</h3>
        {actions ? <div className="wms-ops-detail-panel__actions">{actions}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function HakEdisDetailRow({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <div className="wms-ops-detail-row">
      <span className="wms-ops-detail-row__label">{label}</span>
      <span className="wms-ops-detail-row__value">{children}</span>
    </div>
  );
}

export function HakEdisOpsTableShell({
  children,
  className,
  tall,
}: {
  children: ReactNode;
  className?: string;
  tall?: boolean;
}): ReactElement {
  return (
    <div className={cn('wms-ops-prelabel-lines', tall && 'wms-ops-prelabel-lines--tall', className)}>
      <div className="wms-ops-prelabel-lines__table-wrap">{children}</div>
    </div>
  );
}

export function HakEdisFlagChip({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: 'default' | 'info' | 'success' | 'warn';
  className?: string;
}): ReactElement {
  const toneClass =
    tone === 'success'
      ? 'wms-ops-flag-badge wms-ops-flag-badge--on'
      : tone === 'warn'
        ? 'wms-ops-flag-badge wms-ops-flag-badge--warn'
        : tone === 'info'
          ? 'wms-ops-code-badge'
          : 'wms-ops-code-badge';

  return <span className={cn(toneClass, 'inline-flex max-w-full whitespace-normal', className)}>{children}</span>;
}

export function HakEdisHintBanner({ children }: { children: ReactNode }): ReactElement {
  return <div className="wms-ops-hint-banner">{children}</div>;
}

export function HakEdisViewNav({
  active,
  openLabel,
  completedLabel,
  openHref,
  completedHref,
}: {
  active: 'open' | 'completed';
  openLabel: string;
  completedLabel: string;
  openHref: string;
  completedHref: string;
}): ReactElement {
  return (
    <nav className="wms-ops-bilginoglu-view-nav" aria-label={openLabel}>
      <Link to={openHref} className={cn('wms-ops-bilginoglu-view-nav__item', active === 'open' && 'is-active')}>
        <span className="wms-ops-bilginoglu-view-nav__code" aria-hidden>01</span>
        <span className="wms-ops-bilginoglu-view-nav__label">{openLabel}</span>
      </Link>
      <Link to={completedHref} className={cn('wms-ops-bilginoglu-view-nav__item', active === 'completed' && 'is-active')}>
        <span className="wms-ops-bilginoglu-view-nav__code" aria-hidden>02</span>
        <span className="wms-ops-bilginoglu-view-nav__label">{completedLabel}</span>
      </Link>
    </nav>
  );
}

export function HakEdisFlowMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'info' | 'warn' | 'danger';
}): ReactElement {
  return (
    <article className={cn('wms-ops-bilginoglu-flow-metric', `wms-ops-bilginoglu-flow-metric--${tone}`)}>
      <div className="wms-ops-bilginoglu-flow-metric__label">{label}</div>
      <div className="wms-ops-bilginoglu-flow-metric__value">{value}</div>
    </article>
  );
}

export function HakEdisReportKpiStrip({ children }: { children: ReactNode }): ReactElement {
  return <div className="wms-ops-bilginoglu-report-strip">{children}</div>;
}

export function HakEdisReportCellFacts({
  items,
}: {
  items: Array<{
    label: string;
    value: string;
    tone?: 'default' | 'success' | 'info' | 'warn' | 'danger';
  }>;
}): ReactElement {
  return (
    <div className="wms-ops-bilginoglu-report-facts">
      {items.map((item) => (
        <div
          key={item.label}
          className="wms-ops-bilginoglu-report-fact"
          title={`${item.label}: ${item.value}`}
        >
          <span className="wms-ops-bilginoglu-report-fact__label">{item.label}</span>
          <span className="wms-ops-bilginoglu-report-fact__sep" aria-hidden>
            :
          </span>
          <span
            className={cn(
              'wms-ops-bilginoglu-report-fact__value',
              item.tone && `wms-ops-bilginoglu-report-fact__value--${item.tone}`,
            )}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HakEdisWarehouseFlow({ from, to }: { from: string; to: string }): ReactElement {
  return (
    <span className="wms-ops-bilginoglu-warehouse-flow" title={`${from} → ${to}`}>
      <span className="wms-ops-code-badge">{from}</span>
      <span className="wms-ops-bilginoglu-warehouse-flow__arrow" aria-hidden>
        →
      </span>
      <span className="wms-ops-code-badge">{to}</span>
    </span>
  );
}

export function HakEdisOpsEmptyState({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}): ReactElement {
  return (
    <div className="wms-ops-bilginoglu-empty-state">
      {icon}
      <span>{children}</span>
    </div>
  );
}

export function HakEdisStepCard({
  title,
  meta,
  badge,
  note,
}: {
  title: string;
  meta: string;
  badge: ReactNode;
  note?: string | null;
}): ReactElement {
  return (
    <article className="wms-ops-bilginoglu-step-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="wms-ops-bilginoglu-step-card__title">{title}</span>
        {badge}
      </div>
      <div className="wms-ops-bilginoglu-step-card__meta">{meta}</div>
      {note ? <div className="wms-ops-bilginoglu-step-card__note">{note}</div> : null}
    </article>
  );
}

export function HakEdisPlanChip({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}): ReactElement {
  return (
    <button
      type="button"
      className={cn('wms-ops-bilginoglu-plan-chip', selected && 'is-selected')}
      onClick={onSelect}
    >
      {children}
    </button>
  );
}

export const HAK_EDIS_SETTINGS_COLUMN_WIDTHS: Record<string, number> = {
  branch: 8,
  warehouse: 14,
  shelf: 14,
  operation: 16,
  type: 8,
  warehouseChain: 22,
  status: 10,
  description: 18,
  actions: 5,
};

export function hakEdisPendingStageBadge(label: string): ReactElement {
  return (
    <span
      className="wms-ops-status-badge wms-ops-status-badge--active wms-ops-bilginoglu-pending-stage-badge inline-flex min-w-0 max-w-full truncate"
      title={label}
    >
      {label}
    </span>
  );
}

export function hakEdisPendingActionBadge(label: string): ReactElement {
  return (
    <span
      className="wms-ops-status-badge wms-ops-status-badge--pending wms-ops-bilginoglu-pending-action-badge inline-flex min-w-0 max-w-full truncate"
      title={label}
    >
      {label}
    </span>
  );
}

export function HakEdisOpsSelectTrigger({
  className,
  ...props
}: ComponentProps<typeof SelectTrigger>): ReactElement {
  return (
    <OpsFieldShell>
      <SelectTrigger
        className={cn('wms-ops-field h-[2.625rem] w-full shadow-none', OPS_FIELD_CLASS, className)}
        {...props}
      />
    </OpsFieldShell>
  );
}

export function HakEdisOpsTypePicker<T extends string>({
  value,
  options,
  onChange,
  getLabel,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  getLabel: (value: T) => string;
}): ReactElement {
  return (
    <div className="wms-ops-bilginoglu-type-picker" role="radiogroup">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          className={cn('wms-ops-bilginoglu-type-picker__item', value === option && 'is-active')}
          onClick={() => onChange(option)}
        >
          {getLabel(option)}
        </button>
      ))}
    </div>
  );
}

export function hakEdisOperationTypeBadge(label: string): ReactElement {
  return (
    <span className="wms-ops-code-badge wms-ops-bilginoglu-operation-type-badge inline-flex max-w-full truncate" title={label}>
      {label}
    </span>
  );
}

export function HakEdisWarehouseChainFacts({
  items,
}: {
  items: Array<{ label: string; code?: number | null; name?: string | null }>;
}): ReactElement {
  return (
    <div className="wms-ops-bilginoglu-warehouse-chain-facts">
      {items.map((item) => (
        <div key={item.label} className="wms-ops-bilginoglu-warehouse-chain-fact">
          <span className="wms-ops-bilginoglu-warehouse-chain-fact__label">{item.label}</span>
          <span className="wms-ops-bilginoglu-warehouse-chain-fact__value">
            <span className="wms-ops-code-badge">{item.code ?? '-'}</span>
            <span className="wms-ops-bilginoglu-warehouse-chain-fact__name">{item.name ?? '-'}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
