import { type ChangeEvent, type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import { Box, Search, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { OpsFieldShell } from '@/components/shared/OpsFieldShell';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { MasterDataOpsEmptyState, MasterDataOpsFormField, MasterDataOpsResultPanel } from '@/features/shared';
import { cn } from '@/lib/utils';

export const PURCHASE_OPS_SHELL_CLASS = 'wms-ops-erp-skin wms-ops-purchase-page';

export function PurchaseOpsField({
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

export function PurchaseOpsDialogFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <DialogFooter className={cn('wms-ops-purchase-dialog__footer shrink-0 border-t px-5 py-4', className)}>
      {children}
    </DialogFooter>
  );
}

export function PurchaseOpsEmptyLines({
  title,
  description,
}: {
  title: string;
  description: string;
}): ReactElement {
  return (
    <MasterDataOpsEmptyState className="wms-ops-purchase-empty-lines flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 py-12">
      <div className="wms-ops-purchase-empty-lines__title">{title}</div>
      <p className="max-w-md text-xs leading-6">{description}</p>
    </MasterDataOpsEmptyState>
  );
}

export function PurchaseOpsLinePreview({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}): ReactElement {
  return (
    <MasterDataOpsResultPanel className="wms-ops-purchase-line-preview flex flex-wrap items-center justify-between gap-3">
      <span className="wms-ops-purchase-line-preview__label">{label}</span>
      <strong className="wms-ops-purchase-line-preview__value">{value}</strong>
    </MasterDataOpsResultPanel>
  );
}

export function PurchaseOpsSummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
}): ReactElement {
  return (
    <div className={cn('wms-ops-purchase-summary-row flex justify-between gap-4', emphasis && 'wms-ops-purchase-summary-row--emphasis')}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function PurchaseOpsIconAction({
  label,
  onClick,
  tone = 'default',
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: 'default' | 'success' | 'danger';
  children: ReactNode;
}): ReactElement {
  return (
    <button
      type="button"
      className={cn(
        'wms-ops-purchase-icon-action',
        tone === 'success' && 'wms-ops-purchase-icon-action--success',
        tone === 'danger' && 'wms-ops-purchase-icon-action--danger',
      )}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

export function PurchaseOpsNotesTrigger({
  title,
  description,
  badge,
  onClick,
}: {
  title: string;
  description: string;
  badge: string;
  onClick: () => void;
}): ReactElement {
  return (
    <button type="button" className="wms-ops-purchase-notes-trigger" onClick={onClick}>
      <span className="wms-ops-purchase-notes-trigger__copy">
        <span className="wms-ops-purchase-notes-trigger__title">{title}</span>
        <span className="wms-ops-purchase-notes-trigger__description">{description}</span>
      </span>
      <span className="wms-ops-purchase-notes-trigger__badge">{badge}</span>
    </button>
  );
}

export function PurchaseOpsSelectedStock({
  productCode,
  productName,
  unit,
}: {
  productCode: string;
  productName: string;
  unit?: string | null;
}): ReactElement {
  return (
    <div className="wms-ops-entity-card wms-ops-purchase-selected-stock" role="group" aria-label={`${productCode} ${productName}`}>
      <div className="wms-ops-entity-card__rail" aria-hidden />
      <div className="wms-ops-entity-card__body">
        <div className="wms-ops-entity-card__icon" aria-hidden>
          <Box className="size-4" />
        </div>
        <div className="wms-ops-entity-card__meta">
          <div className="wms-ops-entity-card__header">
            <span className="wms-ops-entity-card__eyebrow">{productCode}</span>
            {unit ? <span className="wms-ops-entity-card__status">{unit}</span> : null}
          </div>
          <div className="wms-ops-entity-card__code">{productName}</div>
        </div>
      </div>
    </div>
  );
}

export function PurchaseOpsListIconButton({
  label,
  onClick,
  disabled,
  tone = 'default',
  children,
}: {
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  tone?: 'default' | 'start' | 'approve' | 'danger';
  children: ReactNode;
}): ReactElement {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'wms-ops-grid-icon-btn',
        tone === 'start' && 'wms-ops-grid-icon-btn--start',
        tone === 'approve' && 'wms-ops-grid-icon-btn--approve',
        tone === 'danger' && 'wms-ops-grid-icon-btn--danger',
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

export function PurchaseOpsRfqSearchField({
  value,
  onChange,
  onKeyDown,
  placeholder,
}: {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
}): ReactElement {
  return (
    <OpsFieldShell className="wms-ops-purchase-rfq-search">
      <Search className="wms-ops-purchase-rfq-search__icon" aria-hidden />
      <Input
        className={`${OPS_FIELD_CLASS} wms-ops-purchase-rfq-search__input`}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
      />
    </OpsFieldShell>
  );
}

export function PurchaseOpsRfqSupplierPicker({
  title,
  description,
  actionLabel,
  onClick,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}): ReactElement {
  return (
    <div className="wms-ops-purchase-rfq-picker-panel">
      <div className="wms-ops-purchase-rfq-picker-panel__copy">
        <span className="wms-ops-purchase-rfq-picker__title">{title}</span>
        <span className="wms-ops-purchase-rfq-picker__description">{description}</span>
      </div>
      <button type="button" className="wms-ops-purchase-rfq-picker__cta" onClick={onClick}>
        <Users className="size-4 shrink-0" aria-hidden />
        <span>{actionLabel}</span>
      </button>
    </div>
  );
}

export function PurchaseOpsTerminalCheckbox({
  checked,
  onCheckedChange,
  disabled,
  'aria-label': ariaLabel,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}): ReactElement {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        'wms-ops-access-control-terminal-checkbox shrink-0',
        checked && 'wms-ops-access-control-terminal-checkbox--checked',
        disabled && 'opacity-50',
        className,
      )}
      onClick={(event) => {
        event.stopPropagation();
        if (!disabled) onCheckedChange(!checked);
      }}
    >
      <span className="wms-ops-access-control-terminal-checkbox__corner wms-ops-access-control-terminal-checkbox__corner--tl" aria-hidden />
      <span className="wms-ops-access-control-terminal-checkbox__corner wms-ops-access-control-terminal-checkbox__corner--tr" aria-hidden />
      <span className="wms-ops-access-control-terminal-checkbox__corner wms-ops-access-control-terminal-checkbox__corner--bl" aria-hidden />
      <span className="wms-ops-access-control-terminal-checkbox__corner wms-ops-access-control-terminal-checkbox__corner--br" aria-hidden />
      <span className="wms-ops-access-control-terminal-checkbox__fill" aria-hidden />
    </button>
  );
}

export function PurchaseOpsRfqSelectedSupplier({
  label,
  email,
  onRemove,
}: {
  label: string;
  email?: string | null;
  onRemove: () => void;
}): ReactElement {
  const separatorIndex = label.indexOf(' - ');
  const code = separatorIndex >= 0 ? label.slice(0, separatorIndex) : label;
  const name = separatorIndex >= 0 ? label.slice(separatorIndex + 3) : label;

  return (
    <div className="wms-ops-purchase-rfq-selected-card" role="group" aria-label={label}>
      <div className="wms-ops-entity-card__rail" aria-hidden />
      <div className="wms-ops-purchase-rfq-selected-card__body">
        <div className="wms-ops-entity-card__icon" aria-hidden>
          <Users className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="wms-ops-purchase-rfq-selected-card__header">
            <span className="wms-ops-entity-card__eyebrow">{code}</span>
          </div>
          <div className="wms-ops-purchase-rfq-selected-card__name">{name}</div>
          <div className="wms-ops-purchase-rfq-selected-card__meta">{email || 'E-posta yok'}</div>
        </div>
        <button
          type="button"
          className="wms-ops-purchase-rfq-selected-card__remove"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label="Tedarikçiyi çıkar"
        >
          <X className="size-3.5" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  );
}
