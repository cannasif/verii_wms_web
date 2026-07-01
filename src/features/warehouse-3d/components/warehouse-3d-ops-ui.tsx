import { type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MasterDataOpsFormField } from '@/features/shared';

export function Warehouse3dOpsSectionHeader({
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

export function Warehouse3dOpsField({
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

export function Warehouse3dOpsStat({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}): ReactElement {
  return (
    <div className="wms-ops-warehouse-3d-stat">
      <div className="wms-ops-warehouse-3d-stat__label">{label}</div>
      <div className="wms-ops-warehouse-3d-stat__value">{value}</div>
    </div>
  );
}

export function Warehouse3dOpsStatGrid({
  children,
  columns = 3,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}): ReactElement {
  return (
    <div
      className={cn(
        'wms-ops-warehouse-3d-stat-grid',
        columns === 4 && 'wms-ops-warehouse-3d-stat-grid--cols-4',
        columns === 2 && 'wms-ops-warehouse-3d-stat-grid--cols-2',
        columns === 3 && 'wms-ops-warehouse-3d-stat-grid--cols-3',
      )}
    >
      {children}
    </div>
  );
}

export function Warehouse3dOpsLegend({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return <div className="wms-ops-warehouse-3d-legend">{children}</div>;
}

export function Warehouse3dOpsLegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}): ReactElement {
  return (
    <div className="wms-ops-warehouse-3d-legend__item">
      <span className="wms-ops-warehouse-3d-legend__swatch" style={{ background: color }} aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function Warehouse3dOpsChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('wms-ops-warehouse-3d-chip', active && 'wms-ops-warehouse-3d-chip--active')}
    >
      {children}
    </button>
  );
}

export function Warehouse3dOpsModeToggle({
  value,
  onChange,
  label2d,
  label3d,
}: {
  value: '2d' | '3d';
  onChange: (mode: '2d' | '3d') => void;
  label2d: string;
  label3d: string;
}): ReactElement {
  return (
    <div className="wms-ops-warehouse-3d-mode-toggle" role="group" aria-label={label3d}>
      <button
        type="button"
        className={cn('wms-ops-warehouse-3d-mode-toggle__btn', value === '2d' && 'wms-ops-warehouse-3d-mode-toggle__btn--active')}
        onClick={() => onChange('2d')}
      >
        {label2d}
      </button>
      <button
        type="button"
        className={cn('wms-ops-warehouse-3d-mode-toggle__btn', value === '3d' && 'wms-ops-warehouse-3d-mode-toggle__btn--active')}
        onClick={() => onChange('3d')}
      >
        {label3d}
      </button>
    </div>
  );
}

export function Warehouse3dOpsViewport({
  children,
  className,
  centered = false,
  scene = false,
}: {
  children: ReactNode;
  className?: string;
  centered?: boolean;
  scene?: boolean;
}): ReactElement {
  return (
    <div
      className={cn(
        'wms-ops-warehouse-3d-viewport',
        scene && 'wms-ops-warehouse-3d-viewport--scene',
        className,
      )}
    >
      {scene ? (
        <div className="wms-ops-warehouse-3d-viewport__frame" aria-hidden>
          <span className="wms-ops-warehouse-3d-viewport__corner wms-ops-warehouse-3d-viewport__corner--tl" />
          <span className="wms-ops-warehouse-3d-viewport__corner wms-ops-warehouse-3d-viewport__corner--tr" />
          <span className="wms-ops-warehouse-3d-viewport__corner wms-ops-warehouse-3d-viewport__corner--bl" />
          <span className="wms-ops-warehouse-3d-viewport__corner wms-ops-warehouse-3d-viewport__corner--br" />
          <div className="wms-ops-warehouse-3d-viewport__scanlines" />
        </div>
      ) : null}
      {centered ? <div className="wms-ops-warehouse-3d-viewport__center">{children}</div> : children}
    </div>
  );
}

export function Warehouse3dOpsEmptyIcon({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="wms-ops-warehouse-3d-empty__icon" aria-hidden>
      {children}
    </div>
  );
}

export function Warehouse3dOpsEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactElement;
}): ReactElement {
  return (
    <div className="wms-ops-warehouse-3d-empty">
      {icon ?? null}
      <div className="wms-ops-warehouse-3d-empty__title">{title}</div>
      {description ? <div className="wms-ops-warehouse-3d-empty__description">{description}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Warehouse3dOpsControlPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="wms-ops-warehouse-3d-control-panel">
      <div className="wms-ops-warehouse-3d-control-panel__title">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function Warehouse3dOpsControlRow({
  icon,
  keys,
  label,
}: {
  icon?: ReactElement;
  keys: string;
  label: string;
}): ReactElement {
  return (
    <div className="wms-ops-warehouse-3d-control-panel__row">
      {icon ? <span className="wms-ops-warehouse-3d-control-panel__icon">{icon}</span> : null}
      <kbd className="wms-ops-warehouse-3d-control-panel__key">{keys}</kbd>
      <span className="wms-ops-warehouse-3d-control-panel__label">{label}</span>
    </div>
  );
}

export function Warehouse3dOpsDetailCard({
  title,
  subtitle,
  onClose,
  children,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <div className={cn('wms-ops-warehouse-3d-detail-card', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-[color:var(--wms-ops-card-border)] px-3 py-2.5">
        <div className="min-w-0">
          <div className="wms-ops-warehouse-3d-detail-card__title">{title}</div>
          {subtitle ? <div className="mt-1 text-xs opacity-80">{subtitle}</div> : null}
        </div>
        {onClose ? (
          <button type="button" className="wms-ops-warehouse-3d-detail-card__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        ) : null}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

export function Warehouse3dOpsDetailField({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}): ReactElement {
  return (
    <div className="wms-ops-warehouse-3d-detail-field">
      <div className="wms-ops-warehouse-3d-detail-field__label">{label}</div>
      <div className="wms-ops-warehouse-3d-detail-field__value">{value}</div>
      {hint ? <div className="wms-ops-warehouse-3d-detail-field__hint">{hint}</div> : null}
    </div>
  );
}

export function Warehouse3dOpsHud({
  children,
  position = 'top-left',
}: {
  children: ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom';
}): ReactElement {
  return (
    <div
      className={cn(
        'wms-ops-warehouse-3d-hud',
        position === 'top-right' && 'wms-ops-warehouse-3d-hud--top-right',
        position === 'bottom-left' && 'wms-ops-warehouse-3d-hud--bottom-left',
        position === 'bottom' && 'wms-ops-warehouse-3d-hud--bottom',
      )}
    >
      {children}
    </div>
  );
}

export function Warehouse3dOpsCameraBar({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return <div className="wms-ops-warehouse-3d-camera-bar">{children}</div>;
}

export function Warehouse3dOpsCameraButton({
  active,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
}): ReactElement {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn('wms-ops-warehouse-3d-camera-btn', active && 'wms-ops-warehouse-3d-camera-btn--active')}
    >
      {children}
    </button>
  );
}

export function Warehouse3dOpsStockRow({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}): ReactElement {
  return (
    <div className="wms-ops-warehouse-3d-stock-row">
      <div className="font-medium">{title}</div>
      <div className="opacity-70">{subtitle}</div>
    </div>
  );
}

export function Warehouse3dOpsRackPanel({
  slotLabel,
  count,
  onClose,
  children,
}: {
  slotLabel: string;
  count: number;
  onClose: () => void;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="wms-ops-warehouse-3d-rack-panel">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="wms-ops-warehouse-3d-rack-panel__pulse" aria-hidden />
          <span className="wms-ops-warehouse-3d-rack-panel__label">{slotLabel}</span>
          <span className="wms-ops-warehouse-3d-rack-panel__count">{count}</span>
        </div>
        <button type="button" className="wms-ops-warehouse-3d-detail-card__close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto px-4 pb-3 pt-0.5">{children}</div>
    </div>
  );
}

export function Warehouse3dOpsRackThumb({
  active,
  imageUrl,
  stockCode,
  serialNo,
  stackOrder,
  onClick,
}: {
  active: boolean;
  imageUrl: string | null;
  stockCode: string;
  serialNo: string;
  stackOrder: number;
  onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('wms-ops-warehouse-3d-rack-thumb', active && 'wms-ops-warehouse-3d-rack-thumb--active')}
    >
      <div className="wms-ops-warehouse-3d-rack-thumb__image">
        {imageUrl ? (
          <img src={imageUrl} alt={stockCode} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs opacity-50">—</div>
        )}
        <span className="wms-ops-warehouse-3d-rack-thumb__order">#{stackOrder}</span>
      </div>
      <div className="wms-ops-warehouse-3d-rack-thumb__code">{stockCode}</div>
      <div className="wms-ops-warehouse-3d-rack-thumb__serial">{serialNo}</div>
    </button>
  );
}
