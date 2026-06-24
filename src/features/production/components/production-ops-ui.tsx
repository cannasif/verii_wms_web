import { type ReactElement, type ReactNode } from 'react';
import { Info } from 'lucide-react';
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
    <MasterDataOpsResultPanel tone={toneMap[tone]}>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 whitespace-pre-line text-sm leading-relaxed opacity-95">{body}</div>
    </MasterDataOpsResultPanel>
  );
}

export function ProductionOpsCallout({ title, body }: { title: string; body: string }): ReactElement {
  return (
    <div className="wms-ops-hint-banner flex-col !items-start gap-2">
      <div className="flex gap-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <div className="min-w-0">
          <div className="font-semibold">{title}</div>
          <div className="mt-1 text-sm leading-relaxed opacity-90">{body}</div>
        </div>
      </div>
    </div>
  );
}

export function ProductionRequiredMark(): ReactElement {
  return <span className="ml-1 text-rose-500">*</span>;
}
