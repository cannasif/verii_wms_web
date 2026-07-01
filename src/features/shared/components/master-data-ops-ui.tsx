import { type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { PagedDataGridColumn } from '@/components/shared';
import { DialogContent } from '@/components/ui/dialog';
import { OpsSelect } from '@/components/shared/OpsSelect';
import { cn } from '@/lib/utils';

export const MASTER_DATA_OPS_TABLE_COL = 'wms-ops-table-center-col';

export function masterDataOpsGridColumn<TKey extends string>(
  key: TKey,
  label: string,
  sortable = true,
): PagedDataGridColumn<TKey> {
  return {
    key,
    label,
    sortable,
    headClassName: MASTER_DATA_OPS_TABLE_COL,
    cellClassName: MASTER_DATA_OPS_TABLE_COL,
  };
}

export function MasterDataOpsEyebrow({
  group,
  page,
}: {
  group: ReactNode;
  page: ReactNode;
}): ReactElement {
  const { t } = useTranslation('common');

  return (
    <>
      <span>{t('sidebar.masterDataGroup')}</span>
      <span className="mx-2 opacity-60">/</span>
      <span>{group}</span>
      <span className="mx-2 opacity-60">/</span>
      <span>{page}</span>
    </>
  );
}

export function MasterDataOpsErpEyebrow({ page }: { page: ReactNode }): ReactElement {
  const { t } = useTranslation('common');
  return <MasterDataOpsEyebrow group={t('sidebar.erp')} page={page} />;
}

export function MasterDataOpsParameterEyebrow({ code }: { code: string }): ReactElement {
  const { t } = useTranslation('common');
  return <MasterDataOpsEyebrow group={t('sidebar.parameters')} page={code.toUpperCase()} />;
}

export function MasterDataOpsDialogContent({
  children,
  className,
  size = 'lg',
}: {
  children: ReactNode;
  className?: string;
  size?: 'md' | 'lg' | 'xl';
}): ReactElement {
  const sizeClass =
    size === 'xl' ? 'sm:max-w-4xl' : size === 'md' ? 'sm:max-w-xl' : 'sm:max-w-3xl';

  return (
    <DialogContent
      className={cn(
        'wms-ops-form wms-ops-erp-skin wms-ops-detail-dialog flex max-h-[90dvh] flex-col gap-0 overflow-hidden border-0 p-0 shadow-none',
        sizeClass,
        className,
      )}
    >
      {children}
    </DialogContent>
  );
}

export function MasterDataOpsSection({
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

export function MasterDataOpsFormField({
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
    <div className={cn('wms-ops-form-item space-y-2', className)}>
      <label htmlFor={htmlFor} className="wms-ops-prelabel-form-label">
        {label}
      </label>
      {children}
    </div>
  );
}

export function MasterDataOpsStatGrid({
  items,
  className,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  className?: string;
}): ReactElement {
  return (
    <div className={cn('wms-ops-stat-grid grid gap-2 md:grid-cols-3', className)}>
      {items.map((item) => (
        <div key={item.label} className="wms-ops-stat-card">
          <div className="wms-ops-stat-card__value">{item.value}</div>
          <div className="wms-ops-stat-card__label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function MasterDataOpsGuidance({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}): ReactElement {
  return (
    <div className="wms-ops-hint-banner flex-col !items-start gap-2">
      <span className="font-semibold">{title}</span>
      {lines.map((line) => (
        <p key={line} className="text-sm leading-6">
          {line}
        </p>
      ))}
    </div>
  );
}

export function MasterDataOpsResultPanel({
  tone = 'default',
  children,
  className,
}: {
  tone?: 'default' | 'success' | 'danger' | 'warn';
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <div className={cn('wms-ops-kkd-result-panel', `wms-ops-kkd-result-panel--${tone}`, className)}>
      {children}
    </div>
  );
}

export function MasterDataOpsEmptyState({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <MasterDataOpsResultPanel className={cn('text-center text-sm', className)}>
      {children}
    </MasterDataOpsResultPanel>
  );
}

export function MasterDataOpsFlagChip({
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

export function MasterDataOpsSelect({
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
    <OpsSelect value={value} onValueChange={onValueChange} placeholder={placeholder} disabled={disabled}>
      {children}
    </OpsSelect>
  );
}
