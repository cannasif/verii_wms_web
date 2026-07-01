import { type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OpsFieldShell } from '@/components/shared/OpsFieldShell';
import { OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { cn } from '@/lib/utils';
import i18n, { getLocaleForFormatting } from '@/lib/i18n';
import { localizeStatus, resolveStatusCategory } from '@/lib/localize-status';
import type { TFunction } from 'i18next';

export const KKD_CRUD_DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  departmentCode: 10,
  departmentName: 18,
  roleCode: 10,
  roleName: 16,
  employeeCode: 10,
  firstName: 12,
  lastName: 12,
  customerCode: 10,
  groupCode: 10,
  groupName: 14,
  updatedDate: 11,
  isActive: 8,
  actions: 5,
};

export const KKD_DISTRIBUTION_LIST_COLUMN_WIDTHS: Record<string, number> = {
  documentNo: 11,
  documentDate: 12,
  customerCode: 14,
  employee: 16,
  warehouseId: 12,
  status: 10,
  sourceChannel: 10,
  lineCount: 8,
  totalQuantity: 9,
  erpStatus: 10,
};

export const KKD_VALIDATION_LOG_COLUMN_WIDTHS: Record<string, number> = {
  createdDate: 12,
  employee: 14,
  customerCode: 10,
  stock: 16,
  groupCode: 9,
  attemptedQuantity: 8,
  reasonCode: 10,
  reasonMessage: 18,
  actions: 5,
};

export const KKD_MATRIX_COLUMN_WIDTHS: Record<string, number> = {
  departmentName: 16,
  roleName: 16,
  groupCode: 11,
  groupName: 18,
  initialIssueQuantity: 10,
  initialFrequencyDays: 16,
  initialAllowBulkIssue: 14,
  initialQuantityPerFrequency: 16,
  additionalAfterMonthsQuantity: 10,
  threeMonthFrequencyDays: 16,
  threeMonthAllowBulkIssue: 14,
  threeMonthQuantityPerFrequency: 16,
  routineQuantity: 10,
  routinePeriodType: 10,
  routinePeriodInterval: 12,
  routineFrequencyDays: 16,
  routineAllowBulkIssue: 14,
  routineQuantityPerFrequency: 16,
  isMandatory: 10,
  isActive: 10,
  actions: 6,
};

export const KKD_MATRIX_TABLE_MIN_WIDTH_CLASS = 'wms-ops-kkd-matrix-grid min-w-[112rem]';

export const KKD_OVERRIDE_COLUMN_WIDTHS: Record<string, number> = {
  employeeCode: 10,
  employeeName: 14,
  groupCode: 9,
  groupName: 14,
  extraQuantity: 9,
  consumedQuantity: 9,
  validFrom: 10,
  validTo: 10,
  reason: 16,
  isActive: 8,
  actions: 5,
};

export const KKD_REPORT_COLUMN_WIDTHS: Record<string, number> = {
  departmentCode: KKD_CRUD_DEFAULT_COLUMN_WIDTHS.departmentCode,
  departmentName: KKD_CRUD_DEFAULT_COLUMN_WIDTHS.departmentName,
  roleCode: KKD_CRUD_DEFAULT_COLUMN_WIDTHS.roleCode,
  roleName: KKD_CRUD_DEFAULT_COLUMN_WIDTHS.roleName,
  groupCode: KKD_CRUD_DEFAULT_COLUMN_WIDTHS.groupCode,
  groupName: KKD_CRUD_DEFAULT_COLUMN_WIDTHS.groupName,
  employeeCount: 10,
  distributionCount: 10,
  totalQuantity: 10,
  lastUsageDate: 12,
  actions: 5,
};

export function KkdOpsDialogContent({
  children,
  className,
  size = 'lg',
}: {
  children: ReactNode;
  className?: string;
  size?: 'md' | 'lg' | 'xl' | 'full';
}): ReactElement {
  const sizeClass =
    size === 'md'
      ? 'w-[min(96vw,28rem)] sm:max-w-xl'
      : size === 'xl'
        ? 'w-[min(96vw,56rem)] sm:max-w-4xl lg:max-w-5xl'
        : size === 'full'
          ? 'w-[min(96vw,72rem)] sm:max-w-[72rem]'
          : 'w-[min(96vw,48rem)] sm:max-w-3xl';

  return (
    <DialogContent
      className={cn(
        'wms-ops-form wms-ops-detail-dialog wms-ops-kkd-dialog flex max-h-[min(90dvh,920px)] flex-col gap-0 overflow-hidden border-0 p-0 shadow-none',
        sizeClass,
        className,
      )}
    >
      {children}
    </DialogContent>
  );
}

export function KkdOpsSection({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <section className={cn('wms-ops-receiving-area wms-ops-pt-terminal-section border', className)}>
      <div className="wms-ops-receiving-area__header flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="min-w-0 space-y-1">
          <div className="wms-ops-pt-terminal__prompt">
            <span className="wms-ops-subtitle-prefix" aria-hidden>
              {'> '}
            </span>
            <h3 className="wms-ops-pt-terminal__title">{title}</h3>
          </div>
          {subtitle ? <p className="wms-ops-pt-terminal__meta">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="wms-ops-form p-4 sm:px-5 sm:pb-5 sm:pt-4">{children}</div>
    </section>
  );
}

export function KkdOpsFormField({
  label,
  children,
  className,
  htmlFor,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}): ReactElement {
  return (
    <div className={cn('wms-ops-form-item', className)}>
      <label className="wms-ops-prelabel-form-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function KkdOpsFormBanner({
  children,
  tone = 'info',
  title,
  className,
}: {
  children: ReactNode;
  tone?: 'info' | 'warn';
  title?: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <div
      className={cn(
        'wms-ops-kkd-form-banner md:col-span-2',
        `wms-ops-kkd-form-banner--${tone}`,
        className,
      )}
    >
      {title ? <div className="wms-ops-kkd-form-banner__title">{title}</div> : null}
      <div className="wms-ops-kkd-form-banner__content">{children}</div>
    </div>
  );
}

export function KkdOpsCollapsibleGuide({
  title,
  children,
  tone = 'info',
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  tone?: 'info' | 'warn';
  className?: string;
}): ReactElement {
  return (
    <details
      className={cn(
        'wms-ops-kkd-form-guide group',
        `wms-ops-kkd-form-guide--${tone}`,
        className,
      )}
    >
      <summary className="wms-ops-kkd-form-guide__summary">
        <ChevronRight className="wms-ops-kkd-form-guide__chevron size-3.5 shrink-0" aria-hidden />
        <span>{title}</span>
      </summary>
      <div className="wms-ops-kkd-form-guide__body">{children}</div>
    </details>
  );
}

export function KkdMetricGrid({ children }: { children: ReactNode }): ReactElement {
  return <div className="wms-ops-kkd-metrics">{children}</div>;
}

export function KkdOpsSelect({
  value,
  onValueChange,
  placeholder,
  children,
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: ReactNode;
  disabled?: boolean;
}): ReactElement {
  return (
    <OpsFieldShell>
      <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="wms-ops-list-field-trigger h-9 w-full min-w-0 border-0 bg-transparent shadow-none ring-0 focus:ring-0 focus-visible:ring-0">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
          {children}
        </SelectContent>
      </Select>
    </OpsFieldShell>
  );
}

export function KkdReportDetailFacts({
  items,
}: {
  items: Array<{
    label: string;
    value: string;
    tone?: 'default' | 'success' | 'info' | 'warn' | 'danger';
  }>;
}): ReactElement {
  return (
    <div className="wms-ops-kkd-report-facts">
      {items.map((item) => (
        <div
          key={item.label}
          className="wms-ops-kkd-report-fact"
          title={`${item.label}: ${item.value}`}
        >
          <div className="wms-ops-kkd-report-fact__meta">
            <span className="wms-ops-kkd-report-fact__label">{item.label}</span>
            <span className="wms-ops-kkd-report-fact__sep" aria-hidden>
              :
            </span>
          </div>
          <span
            className={cn(
              'wms-ops-kkd-report-fact__value',
              item.tone && `wms-ops-kkd-report-fact__value--${item.tone}`,
            )}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function KkdSummaryMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}): ReactElement {
  return (
    <article className="wms-ops-stat-card wms-ops-kkd-summary-metric text-left">
      <div className="flex items-start gap-3">
        <span className="wms-ops-kkd-summary-metric__icon" aria-hidden>
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

export function KkdQuickLinkCard({
  title,
  description,
  href,
  icon,
  linkLabel,
}: {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  linkLabel: string;
}): ReactElement {
  return (
    <article className="wms-ops-kkd-quick-link">
      <div className="flex items-start gap-3">
        <span className="wms-ops-kkd-quick-link__icon" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="wms-ops-kkd-quick-link__title">{title}</h2>
          <p className="wms-ops-kkd-quick-link__desc">{description}</p>
        </div>
      </div>
      <Link to={href} className="wms-ops-kkd-quick-link__action">
        <span>{linkLabel}</span>
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </article>
  );
}

export function KkdStepItem({ index, children }: { index: number; children: ReactNode }): ReactElement {
  return (
    <div className="wms-ops-kkd-step">
      <span className="wms-ops-kkd-step__index" aria-hidden>
        {String(index + 1).padStart(2, '0')}
      </span>
      <p className="wms-ops-kkd-step__text">{children}</p>
    </div>
  );
}

export function KkdEmployeeSummaryPanel({ children }: { children: ReactNode }): ReactElement {
  return <div className="wms-ops-kkd-employee-panel">{children}</div>;
}

export function KkdFlagChip({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'info' | 'success' | 'warn';
}): ReactElement {
  return (
    <span className={cn('wms-ops-code-badge wms-ops-kkd-flag-chip', tone !== 'default' && `wms-ops-kkd-flag-chip--${tone}`)}>
      {children}
    </span>
  );
}

export function KkdResultPanel({
  tone = 'default',
  children,
}: {
  tone?: 'default' | 'success' | 'danger' | 'warn';
  children: ReactNode;
}): ReactElement {
  return (
    <div className={cn('wms-ops-kkd-result-panel', `wms-ops-kkd-result-panel--${tone}`)}>
      {children}
    </div>
  );
}

export function kkdOpsStatusBadge(label: string, tone: 'active' | 'pending' | 'done' | 'danger' = 'pending'): ReactElement {
  return (
    <span
      className={cn(
        'wms-ops-status-badge wms-ops-kkd-status-badge inline-flex max-w-full items-center justify-center whitespace-nowrap',
        tone === 'active' && 'wms-ops-status-badge--active',
        tone === 'pending' && 'wms-ops-status-badge--pending',
        tone === 'done' && 'wms-ops-status-badge--done',
        tone === 'danger' && 'wms-ops-status-badge--danger',
      )}
      title={label}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

export function kkdDistributionStatusBadge(
  status: string | null | undefined,
  t: TFunction<'common'>,
): ReactElement {
  const label = localizeStatus(status, t);
  const category = resolveStatusCategory(status);
  const tone =
    category === 'completed'
      ? 'done'
      : category === 'draft'
        ? 'pending'
        : category === 'processing' || category === 'approved'
          ? 'active'
          : category === 'cancelled' || category === 'rejected'
            ? 'danger'
            : 'pending';

  return kkdOpsStatusBadge(label, tone);
}

export function renderKkdYesNoCell(value: unknown): ReactElement {
  const yes = Boolean(value);
  return kkdOpsStatusBadge(
    yes ? i18n.t('common.yes', { ns: 'common' }) : i18n.t('common.no', { ns: 'common' }),
    yes ? 'done' : 'pending',
  );
}

export function renderKkdPeriodTypeCell(value: unknown): ReactElement | string {
  if (value == null || value === '') return '-';
  const raw = String(value);
  const key = `periodTypes.${raw}`;
  const translated = i18n.t(key, { ns: 'kkd', defaultValue: raw });
  return translated === key ? raw : translated;
}

export function renderKkdTextChip(value: unknown, tone: 'default' | 'info' = 'default'): ReactElement | string {
  if (value == null || value === '') return '-';
  return <KkdFlagChip tone={tone}>{String(value)}</KkdFlagChip>;
}

export function renderKkdActiveCell(value: unknown): ReactElement {
  const active = Boolean(value);
  return kkdOpsStatusBadge(
    active ? i18n.t('common.active', { ns: 'common' }) : i18n.t('common.passive', { ns: 'common' }),
    active ? 'active' : 'pending',
  );
}

export function renderKkdGenericCell(value: unknown): ReactElement | string | null {
  if (typeof value === 'boolean') {
    return renderKkdActiveCell(value);
  }
  if (typeof value === 'string' && value.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value).toLocaleDateString(getLocaleForFormatting(i18n.language));
  }
  if (value == null || value === '') return '-';
  return String(value);
}

export function renderKkdLegacyBadge(value: unknown): ReactElement | string {
  if (typeof value === 'boolean') {
    return (
      <Badge variant={value ? 'default' : 'secondary'} className="wms-ops-code-badge rounded-none">
        {value ? i18n.t('common.active', { ns: 'common' }) : i18n.t('common.passive', { ns: 'common' })}
      </Badge>
    );
  }
  return renderKkdGenericCell(value) ?? '-';
}
