import { type ReactElement } from 'react';
import { UserRound } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

interface OpsSelectedEntityCardProps {
  label: string;
  eyebrow?: string;
  status?: string;
  value: string;
  className?: string;
}

function parseEntityDisplay(value: string): { primary: string; secondary?: string } {
  const match = value.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { secondary: match[1].trim(), primary: match[2].trim() };
  }

  return { primary: value.trim() };
}

export function OpsSelectedEntityCard({
  label,
  eyebrow,
  status,
  value,
  className,
}: OpsSelectedEntityCardProps): ReactElement {
  const { skin } = useTheme();
  const { primary, secondary } = parseEntityDisplay(value);
  // Premium'da terminal tarzı eyebrow (CARI_REF) yerine okunaklı tam ad gösterilir.
  const eyebrowText = skin === 'premium' ? label : (eyebrow ?? label);

  return (
    <div className={cn('wms-ops-entity-card', className)} role="status" aria-label={label}>
      <div className="wms-ops-entity-card__rail" aria-hidden />
      <div className="wms-ops-entity-card__body">
        <div className="wms-ops-entity-card__icon" aria-hidden>
          <UserRound className="size-4" />
        </div>
        <div className="wms-ops-entity-card__meta">
          <div className="wms-ops-entity-card__header">
            <span className="wms-ops-entity-card__eyebrow">{eyebrowText}</span>
            {status ? <span className="wms-ops-entity-card__status">{status}</span> : null}
          </div>
          <div className="wms-ops-entity-card__code">{primary}</div>
          {secondary ? <div className="wms-ops-entity-card__name">{secondary}</div> : null}
        </div>
      </div>
    </div>
  );
}
