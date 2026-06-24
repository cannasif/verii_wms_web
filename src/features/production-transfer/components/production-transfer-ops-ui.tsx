import { type ReactElement, type ReactNode, useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

function PtCollapsibleTerminalBase({
  title,
  body,
  children,
  defaultOpen = true,
  compact = false,
  className,
}: {
  title: string;
  body?: string;
  children?: ReactNode;
  defaultOpen?: boolean;
  compact?: boolean;
  className?: string;
}): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const hasBody = Boolean(body?.trim());
  const hasChildren = Boolean(children);

  return (
    <div
      className={cn(
        'wms-ops-pt-terminal wms-ops-pt-terminal--collapsible border',
        compact && 'wms-ops-pt-terminal--compact',
        className,
      )}
    >
      <button
        type="button"
        className="wms-ops-pt-terminal__toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="wms-ops-subtitle-prefix" aria-hidden>{'> '}</span>
        <span className="wms-ops-pt-terminal__title">{title}</span>
        <span className="wms-ops-pt-terminal__toggle-meta">
          {open
            ? t('productionTransfer.create.workflow.collapse', { defaultValue: 'Gizle' })
            : t('productionTransfer.create.workflow.expand', { defaultValue: 'Göster' })}
        </span>
        <ChevronDown className={cn('wms-ops-pt-terminal__chevron size-4', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (hasBody || hasChildren) ? (
        <div className="wms-ops-pt-terminal__content">
          {hasBody ? (
            <div className="wms-ops-pt-terminal__prose">
              <p className="wms-ops-pt-terminal__body">{body}</p>
            </div>
          ) : null}
          {children ? <div className="wms-ops-pt-terminal__panel">{children}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

export function PtTerminalBlock({
  title,
  body,
  children,
  className,
  defaultOpen = true,
}: {
  title: string;
  body?: string;
  children?: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}): ReactElement {
  return (
    <PtCollapsibleTerminalBase
      title={title}
      body={body}
      defaultOpen={defaultOpen}
      className={className}
    >
      {children}
    </PtCollapsibleTerminalBase>
  );
}

export function PtInfoCallout({
  title,
  body,
  defaultOpen = true,
}: {
  title: string;
  body: string;
  defaultOpen?: boolean;
}): ReactElement {
  return <PtCollapsibleTerminalBase title={title} body={body} defaultOpen={defaultOpen} />;
}

export function PtCollapsibleWorkflow({
  title,
  body,
  steps,
  defaultOpen = true,
}: {
  title: string;
  body: string;
  steps: Array<{ eyebrow: string; title: string; body: string }>;
  defaultOpen?: boolean;
}): ReactElement {
  return (
    <PtCollapsibleTerminalBase title={title} body={body} defaultOpen={defaultOpen}>
      <PtStepGrid steps={steps} />
    </PtCollapsibleTerminalBase>
  );
}

export function PtSection({
  title,
  subtitle,
  actions,
  children,
  className,
  variant = 'default',
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'terminal';
}): ReactElement {
  const isTerminal = variant === 'terminal';

  return (
    <section className={cn('wms-ops-receiving-area border', isTerminal && 'wms-ops-pt-terminal-section', className)}>
      <div className="wms-ops-receiving-area__header flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="min-w-0 space-y-1">
          {isTerminal ? (
            <div className="wms-ops-pt-terminal__prompt">
              <span className="wms-ops-subtitle-prefix" aria-hidden>{'> '}</span>
              <h3 className="wms-ops-pt-terminal__title">{title}</h3>
            </div>
          ) : (
            <h3 className="wms-ops-receiving-area__title">{title}</h3>
          )}
          {subtitle ? (
            <p className={cn(isTerminal ? 'wms-ops-pt-terminal__meta' : 'wms-ops-receiving-area__meta')}>{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="p-4 sm:px-5 sm:pb-5 sm:pt-4">{children}</div>
    </section>
  );
}

export function PtFormField({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <div className={cn('wms-ops-form-item space-y-2', className)}>
      <label className="text-[0.68rem] font-semibold uppercase tracking-[0.1em]">{label}</label>
      {children}
    </div>
  );
}

export function PtStepGrid({
  steps,
}: {
  steps: Array<{ eyebrow: string; title: string; body: string }>;
}): ReactElement {
  return (
    <div className="grid w-full gap-2 md:grid-cols-3">
      {steps.map((step) => (
        <div key={step.eyebrow} className="wms-ops-pt-step border">
          <div className="wms-ops-pt-step__eyebrow">{step.eyebrow}</div>
          <div className="wms-ops-pt-step__title">{step.title}</div>
          <div className="wms-ops-pt-step__body">{step.body}</div>
        </div>
      ))}
    </div>
  );
}

export function PtStatGrid({
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

export function PtGuideItem({
  title,
  body,
  defaultOpen = false,
}: {
  title: string;
  body: string;
  defaultOpen?: boolean;
}): ReactElement {
  return <PtCollapsibleTerminalBase title={title} body={body} defaultOpen={defaultOpen} compact />;
}

export function PtLineCard({
  index,
  title,
  hint,
  onRemove,
  removeLabel,
  children,
}: {
  index: number;
  title: string;
  hint: string;
  onRemove: () => void;
  removeLabel: string;
  children: ReactNode;
}): ReactElement {
  const lineNo = String(index).padStart(2, '0');

  return (
    <article className="wms-ops-pt-line border">
      <div className="wms-ops-pt-line__toolbar">
        <div className="wms-ops-pt-line__identity">
          <span className="wms-ops-pt-line__index" aria-hidden>{lineNo}</span>
          <div className="min-w-0">
            <h4 className="wms-ops-pt-line__title">{title}</h4>
            <p className="wms-ops-pt-line__hint">{hint}</p>
          </div>
        </div>
        <button
          type="button"
          className="wms-ops-pt-line__remove"
          onClick={onRemove}
          aria-label={removeLabel}
          title={removeLabel}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      </div>
      <div className="wms-ops-pt-line__body space-y-4">{children}</div>
    </article>
  );
}

export function PtDetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <div className={cn('wms-ops-pt-detail-field', className)}>
      <div className="wms-ops-pt-detail-field__label">{label}</div>
      <div className="wms-ops-pt-detail-field__value">{value}</div>
    </div>
  );
}
