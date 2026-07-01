import { Fragment, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Info, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { OpsCircuitToggle, OpsCircuitToggleField } from '@/components/shared';
import { MasterDataOpsFormField, MasterDataOpsResultPanel } from '@/features/shared';

export function ProductionOpsSectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
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

export function ProductionOpsField({
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

export function ProductionOpsSummaryStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}): ReactElement {
  return (
    <div className="wms-ops-stat-card">
      <div className="wms-ops-stat-card__value tabular-nums">{value}</div>
      <div className="wms-ops-stat-card__label">{label}</div>
    </div>
  );
}

export function ProductionOpsHintCard({
  title,
  body,
  tone = 'emerald',
}: {
  title: string;
  body: string;
  tone?: 'emerald' | 'sky' | 'amber';
}): ReactElement {
  const toneMap = {
    emerald: 'success',
    sky: 'default',
    amber: 'warn',
  } as const;

  return (
    <MasterDataOpsResultPanel tone={toneMap[tone]} className="wms-ops-production-hint">
      <div className="wms-ops-kkd-form-banner__title">{title}</div>
      <div className="wms-ops-kkd-form-banner__content whitespace-pre-line">{body}</div>
    </MasterDataOpsResultPanel>
  );
}

export function ProductionOpsCallout({ title, body }: { title: string; body: string }): ReactElement {
  return (
    <div className="wms-ops-kkd-form-banner wms-ops-kkd-form-banner--info">
      <div className="flex gap-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--wms-ops-accent)] opacity-90" aria-hidden />
        <div className="min-w-0 wms-ops-kkd-form-banner__content">
          <div className="wms-ops-kkd-form-banner__title">{title}</div>
          <p>{body}</p>
        </div>
      </div>
    </div>
  );
}

export function ProductionOpsReadinessMissing({
  title,
  items,
}: {
  title: string;
  items: string[];
}): ReactElement {
  return (
    <div className="wms-ops-kkd-form-banner wms-ops-kkd-form-banner--warn">
      <div className="wms-ops-kkd-form-banner__title">{title}</div>
      <ul className="wms-ops-kkd-form-banner__content mt-1 list-none space-y-0.5 p-0">
        {items.map((item) => (
          <li key={item}>{`• ${item}`}</li>
        ))}
      </ul>
    </div>
  );
}

export function ProductionOpsBadge({
  children,
  className,
  tone = 'default',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'default' | 'info' | 'active';
}): ReactElement {
  return (
    <span
      className={cn(
        'wms-ops-code-badge wms-ops-kkd-flag-chip',
        tone === 'info' && 'wms-ops-kkd-flag-chip--info',
        tone === 'active' && 'wms-ops-kkd-flag-chip--success',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProductionOpsDeleteButton({
  label,
  onClick,
  disabled,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}): ReactElement {
  return (
    <button
      type="button"
      className={cn('wms-ops-production-icon-btn', className)}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Trash2 className="size-3.5" aria-hidden />
    </button>
  );
}

const productionLineGridVariantClass = {
  output: 'wms-ops-production-line-grid--output',
  consumption: 'wms-ops-production-line-grid--consumption',
  'planner-output': 'wms-ops-production-line-grid--planner-output',
  'planner-consumption': 'wms-ops-production-line-grid--planner-consumption',
} as const;

export type ProductionPlanLineGridVariant = keyof typeof productionLineGridVariantClass;

export function ProductionPlanLineGrid({
  variant,
  children,
  className,
}: {
  variant: ProductionPlanLineGridVariant;
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <div className={cn('wms-ops-production-line-grid', productionLineGridVariantClass[variant], className)}>
      {children}
    </div>
  );
}

export function ProductionPlanLineGridHeader({ children }: { children: ReactNode }): ReactElement {
  return <div className="wms-ops-production-line-grid__header">{children}</div>;
}

export function ProductionPlanLineGridHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactElement {
  return <div className={cn('wms-ops-production-line-grid__head', className)}>{children}</div>;
}

export function ProductionPlanLineGridBody({ children }: { children: ReactNode }): ReactElement {
  return <div className="wms-ops-production-line-grid__body">{children}</div>;
}

export function ProductionPlanLineGridRow({ children }: { children: ReactNode }): ReactElement {
  return <div className="wms-ops-production-line-grid__row">{children}</div>;
}

export function ProductionPlanLineGridCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactElement {
  return <div className={cn('wms-ops-production-line-grid__cell', className)}>{children}</div>;
}

export const PRODUCTION_PLAN_LINE_PAGE_SIZE = 5;

export function ProductionOpsCircuitToggle({
  checked,
  onCheckedChange,
  disabled,
  compact = false,
  'aria-label': ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
  'aria-label'?: string;
}): ReactElement {
  return (
    <OpsCircuitToggle
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      compact={compact}
      aria-label={ariaLabel}
    />
  );
}

export function ProductionOpsCircuitToggleField({
  checked,
  onCheckedChange,
  title,
  description,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}): ReactElement {
  return (
    <OpsCircuitToggleField
      checked={checked}
      onCheckedChange={onCheckedChange}
      title={title}
      description={description}
      disabled={disabled}
    />
  );
}

function ProductionPlanLineGridPagination({
  page,
  pageCount,
  onPrevious,
  onNext,
}: {
  page: number;
  pageCount: number;
  onPrevious: () => void;
  onNext: () => void;
}): ReactElement {
  const { t } = useTranslation();

  return (
    <div className="wms-ops-production-line-grid__pager">
      <button
        type="button"
        className="wms-ops-production-line-grid__pager-btn"
        onClick={onPrevious}
        disabled={page <= 0}
        aria-label={t('common.previous')}
      >
        <ChevronLeft className="size-3.5" aria-hidden />
        <span>{t('common.previous')}</span>
      </button>
      <span className="wms-ops-production-line-grid__pager-meta">
        {t('production.create.linePage', {
          current: page + 1,
          total: pageCount,
          defaultValue: '{{current}} / {{total}}',
        })}
      </span>
      <button
        type="button"
        className="wms-ops-production-line-grid__pager-btn"
        onClick={onNext}
        disabled={page >= pageCount - 1}
        aria-label={t('common.next')}
      >
        <span>{t('common.next')}</span>
        <ChevronRight className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

export function ProductionPlanLinePaginatedBody<T>({
  items,
  pageSize = PRODUCTION_PLAN_LINE_PAGE_SIZE,
  renderRow,
  getRowKey,
}: {
  items: T[];
  pageSize?: number;
  renderRow: (item: T) => ReactNode;
  getRowKey: (item: T) => string;
}): ReactElement {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount, items.length]);

  const start = safePage * pageSize;
  const visibleItems = items.slice(start, start + pageSize);
  const showPager = items.length > pageSize;

  return (
    <>
      <ProductionPlanLineGridBody>
        {visibleItems.map((item) => (
          <Fragment key={getRowKey(item)}>{renderRow(item)}</Fragment>
        ))}
      </ProductionPlanLineGridBody>
      {showPager ? (
        <ProductionPlanLineGridPagination
          page={safePage}
          pageCount={pageCount}
          onPrevious={() => setPage((current) => Math.max(0, current - 1))}
          onNext={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
        />
      ) : null}
    </>
  );
}

export function ProductionRequiredMark(): ReactElement {
  return <span className="ml-1 text-rose-500">*</span>;
}
