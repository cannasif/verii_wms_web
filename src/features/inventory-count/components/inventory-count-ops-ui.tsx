import { type ReactElement, type ReactNode } from 'react';
import { Info, Trash2 } from 'lucide-react';
import type { TFunction } from 'i18next';
import { cn } from '@/lib/utils';
import { MasterDataOpsFormField, MasterDataOpsResultPanel } from '@/features/shared';

export function getInventoryCountTypeLabel(t: TFunction, value?: string | null): string {
  switch (value) {
    case 'General':
      return t('inventoryCount.create.options.countType.general');
    case 'Warehouse':
      return t('inventoryCount.create.options.countType.warehouse');
    case 'Stock':
      return t('inventoryCount.create.options.countType.stock');
    case 'Rack':
      return t('inventoryCount.create.options.countType.rack');
    case 'Cell':
      return t('inventoryCount.create.options.countType.cell');
    case 'Combined':
      return t('inventoryCount.create.options.countType.combined');
    default:
      return value || '-';
  }
}

export function getInventoryCountModeLabel(t: TFunction, value?: string | null): string {
  switch (value) {
    case 'Blind':
      return t('inventoryCount.create.options.countMode.blind');
    case 'Open':
      return t('inventoryCount.create.options.countMode.open');
    default:
      return value || '-';
  }
}

export function getInventoryCountStatusLabel(t: TFunction, value?: string | null): string {
  const key = value || 'Draft';
  return t(`inventoryCount.status.${key}`, { defaultValue: key });
}

export function InventoryCountOpsSectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactElement;
}): ReactElement {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
      <div className="min-w-0 space-y-1">
        <div className="wms-ops-pt-terminal__prompt">
          <span className="wms-ops-subtitle-prefix" aria-hidden>
            {'> '}
          </span>
          <h3 className="wms-ops-pt-terminal__title text-sm">{title}</h3>
        </div>
        {description ? <p className="wms-ops-pt-terminal__meta text-xs">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function InventoryCountOpsField({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <MasterDataOpsFormField label={label} className={className}>
      {children}
    </MasterDataOpsFormField>
  );
}

export function InventoryCountOpsCallout({
  title,
  body,
  tone = 'info',
}: {
  title: string;
  body: ReactNode;
  tone?: 'info' | 'success' | 'warn';
}): ReactElement {
  const toneMap = {
    info: 'default',
    success: 'success',
    warn: 'warn',
  } as const;

  return (
    <MasterDataOpsResultPanel tone={toneMap[tone]} className="wms-ops-inventory-count-callout">
      {tone === 'info' ? (
        <div className="flex gap-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--wms-ops-accent)] opacity-90" aria-hidden />
          <div className="min-w-0 wms-ops-kkd-form-banner__content">
            <div className="wms-ops-kkd-form-banner__title">{title}</div>
            <div>{body}</div>
          </div>
        </div>
      ) : (
        <>
          <div className="wms-ops-kkd-form-banner__title">{title}</div>
          <div className="wms-ops-kkd-form-banner__content">{body}</div>
        </>
      )}
    </MasterDataOpsResultPanel>
  );
}

export function InventoryCountOpsBadge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'info' | 'active' | 'warn' | 'danger';
}): ReactElement {
  return (
    <span
      className={cn(
        'wms-ops-code-badge wms-ops-kkd-flag-chip',
        tone === 'info' && 'wms-ops-kkd-flag-chip--info',
        tone === 'active' && 'wms-ops-kkd-flag-chip--success',
        tone === 'warn' && 'wms-ops-kkd-flag-chip--warn',
        tone === 'danger' && 'wms-ops-kkd-flag-chip--danger',
      )}
    >
      {children}
    </span>
  );
}

export function inventoryCountStatusTone(status?: string | null): 'default' | 'info' | 'active' | 'warn' | 'danger' {
  if (status === 'Recount' || status === 'Review') return 'danger';
  if (status === 'Counted' || status === 'Completed') return 'active';
  if (status === 'Counting') return 'info';
  if (status === 'Draft') return 'default';
  return 'warn';
}

export function InventoryCountOpsStat({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}): ReactElement {
  return (
    <div className="wms-ops-inventory-count-stat">
      <div className="wms-ops-inventory-count-stat__label">{label}</div>
      <div className="wms-ops-inventory-count-stat__value">{value}</div>
    </div>
  );
}

export function InventoryCountOpsStatGrid({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 2 | 3;
}): ReactElement {
  return (
    <div className={cn('wms-ops-inventory-count-stat-grid', columns === 3 ? 'wms-ops-inventory-count-stat-grid--cols-3' : 'wms-ops-inventory-count-stat-grid--cols-2')}>
      {children}
    </div>
  );
}

export function InventoryCountOpsLineCard({
  active,
  isDifference,
  onClick,
  children,
}: {
  active: boolean;
  isDifference?: boolean;
  onClick: () => void;
  children: ReactNode;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'wms-ops-inventory-count-line-card',
        active && 'wms-ops-inventory-count-line-card--active',
        isDifference && !active && 'wms-ops-inventory-count-line-card--difference',
      )}
    >
      {children}
    </button>
  );
}

export function InventoryCountOpsScopePanel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactElement;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="wms-ops-inventory-count-scope-panel">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="wms-ops-inventory-count-scope-panel__title">{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function InventoryCountOpsDeleteButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}): ReactElement {
  return (
    <button
      type="button"
      className="wms-ops-production-icon-btn"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Trash2 className="size-3.5" aria-hidden />
    </button>
  );
}

export function InventoryCountOpsEmpty({ children }: { children: ReactNode }): ReactElement {
  return <div className="wms-ops-inventory-count-empty">{children}</div>;
}
