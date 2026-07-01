import { type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OpsActionButton } from '@/components/shared';
import {
  MasterDataOpsDialogContent,
  MasterDataOpsFlagChip,
  MasterDataOpsFormField,
  MasterDataOpsSection,
  MasterDataOpsStatGrid,
} from '@/features/shared';
import { cn } from '@/lib/utils';

export const ACCESS_CONTROL_OPS_PAGE_CLASS = 'wms-ops-access-control-page';

export const USER_MANAGEMENT_OPS_PAGE_CLASS = 'wms-ops-user-management-page wms-ops-access-control-page';

export const ADMIN_OPS_PAGE_CLASS = 'wms-ops-admin-page wms-ops-access-control-page';

export function AccessControlOpsEyebrow({ page }: { page: ReactNode }): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);

  return (
    <>
      <span>{t('sidebar.accessControl')}</span>
      <span className="mx-2 opacity-60">/</span>
      <span>{page}</span>
    </>
  );
}

export const ACCESS_CONTROL_OPS_DEFAULT_WIDTHS: Record<string, number> = {
  code: 16,
  name: 22,
  platforms: 9,
  isActive: 8,
  updatedDate: 11,
  isSystemAdmin: 10,
  permissionCount: 10,
  entityType: 12,
  scopeType: 12,
  includeSelf: 8,
  actions: 5,
};

export function AccessControlOpsDialogContent({
  children,
  className,
  size = 'lg',
}: {
  children: ReactNode;
  className?: string;
  size?: 'md' | 'lg' | 'xl' | 'full';
}): ReactElement {
  const dialogSize = size === 'full' ? 'xl' : size;

  return (
    <MasterDataOpsDialogContent
      className={cn(
        'wms-ops-access-control-dialog',
        size === 'full' && 'wms-ops-access-control-dialog--full',
        className,
      )}
      size={dialogSize}
    >
      {children}
    </MasterDataOpsDialogContent>
  );
}

export function AccessControlOpsDialogHeader({
  title,
  description,
}: {
  title: ReactNode;
  description?: ReactNode;
}): ReactElement {
  return (
    <DialogHeader className="wms-ops-detail-dialog__header border-b px-5 py-4">
      <DialogTitle className="wms-ops-pt-terminal__title">{title}</DialogTitle>
      {description ? (
        <DialogDescription className="wms-ops-pt-terminal__meta">{description}</DialogDescription>
      ) : null}
    </DialogHeader>
  );
}

export function AccessControlOpsDialogFooter({
  onCancel,
  onSave,
  cancelLabel,
  saveLabel,
  isLoading,
  saveDisabled,
  saveType = 'submit',
  formId,
  leading,
}: {
  onCancel: () => void;
  onSave?: () => void;
  cancelLabel: string;
  saveLabel: string;
  isLoading?: boolean;
  saveDisabled?: boolean;
  saveType?: 'button' | 'submit';
  formId?: string;
  leading?: ReactNode;
}): ReactElement {
  return (
    <DialogFooter className="wms-ops-actions wms-ops-detail-dialog__footer border-t px-5 py-4">
      {leading}
      <OpsActionButton type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
        {cancelLabel}
      </OpsActionButton>
      <OpsActionButton
        type={saveType}
        variant="primary"
        form={formId}
        onClick={saveType === 'button' ? onSave : undefined}
        disabled={isLoading || saveDisabled}
      >
        {isLoading ? `${saveLabel}…` : saveLabel}
      </OpsActionButton>
    </DialogFooter>
  );
}

export function AccessControlOpsFormField({
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
    <MasterDataOpsFormField label={label} className={className} htmlFor={htmlFor}>
      {children}
    </MasterDataOpsFormField>
  );
}

export function AccessControlOpsSection({
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
    <MasterDataOpsSection title={title} subtitle={subtitle} actions={actions} className={className}>
      {children}
    </MasterDataOpsSection>
  );
}

export function AccessControlOpsStatGrid({
  items,
  className,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  className?: string;
}): ReactElement {
  return <MasterDataOpsStatGrid items={items} className={className} />;
}

export function AccessControlOpsActionSummary({
  title,
  description,
  items,
}: {
  title: ReactNode;
  description?: ReactNode;
  items: Array<{ label: string; value: number }>;
}): ReactElement {
  return (
    <div className="wms-ops-access-control-summary border p-3">
      <div className="font-mono text-[0.6875rem] uppercase tracking-wider text-[color:var(--wms-ops-accent)]">
        {title}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <MasterDataOpsFlagChip key={item.label}>
            {item.label}: {item.value}
          </MasterDataOpsFlagChip>
        ))}
      </div>
      {description ? (
        <p className="mt-2 text-[0.6875rem] leading-snug opacity-70">{description}</p>
      ) : null}
    </div>
  );
}

export function AccessControlOpsMultiSelectPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <div className={cn('wms-ops-access-control-multiselect space-y-3', className)}>
      {children}
    </div>
  );
}

export function AccessControlOpsCheckbox({
  id,
  checked,
  onCheckedChange,
  disabled,
  label,
  description,
  className,
  compact = false,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label: ReactNode;
  description?: ReactNode;
  className?: string;
  compact?: boolean;
}): ReactElement {
  return (
    <div className={cn('wms-ops-access-control-checkbox flex items-start gap-2.5', compact && 'items-center', className)}>
      <button
        type="button"
        role="checkbox"
        id={id}
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        className={cn(
          'wms-ops-access-control-terminal-checkbox mt-0.5 shrink-0',
          checked && 'wms-ops-access-control-terminal-checkbox--checked',
          disabled && 'opacity-50',
        )}
        onClick={() => {
          if (!disabled) onCheckedChange(!checked);
        }}
      >
        <span className="wms-ops-access-control-terminal-checkbox__corner wms-ops-access-control-terminal-checkbox__corner--tl" aria-hidden />
        <span className="wms-ops-access-control-terminal-checkbox__corner wms-ops-access-control-terminal-checkbox__corner--tr" aria-hidden />
        <span className="wms-ops-access-control-terminal-checkbox__corner wms-ops-access-control-terminal-checkbox__corner--bl" aria-hidden />
        <span className="wms-ops-access-control-terminal-checkbox__corner wms-ops-access-control-terminal-checkbox__corner--br" aria-hidden />
        <span className="wms-ops-access-control-terminal-checkbox__mark" aria-hidden>{checked ? '×' : ''}</span>
      </button>
      <label id={`${id}-label`} htmlFor={id} className="wms-ops-access-control-checkbox__label min-w-0 cursor-pointer">
        <span className={cn('block', compact && 'text-sm')}>{label}</span>
        {description ? (
          <span className="wms-ops-access-control-checkbox__hint mt-0.5 block">{description}</span>
        ) : null}
      </label>
    </div>
  );
}

export function AccessControlOpsScrollList({
  children,
  className,
  emptyText,
  isEmpty,
}: {
  children: ReactNode;
  className?: string;
  emptyText?: ReactNode;
  isEmpty?: boolean;
}): ReactElement {
  return (
    <div className={cn('wms-ops-access-control-scroll-list', className)}>
      {isEmpty ? (
        <p className="wms-ops-access-control-scroll-list__empty">{emptyText}</p>
      ) : (
        children
      )}
    </div>
  );
}

export function AccessControlOpsGroupLabel({ children }: { children: ReactNode }): ReactElement {
  return <div className="wms-ops-access-control-group-label">{children}</div>;
}
