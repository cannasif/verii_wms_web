import { type ReactElement } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OpsActionButton } from './OpsActionButton';
import { OpsLoadingState } from './OpsLoadingState';

type PageStateTone = 'loading' | 'error' | 'empty';

interface PageStateProps {
  tone: PageStateTone;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

const stateConfig: Record<Exclude<PageStateTone, 'loading'>, { icon: typeof AlertCircle; iconClassName: string }> = {
  error: { icon: AlertCircle, iconClassName: 'text-destructive' },
  empty: { icon: Inbox, iconClassName: 'text-muted-foreground' },
};

export function PageState({
  tone,
  title,
  description,
  actionLabel,
  onAction,
  className,
  compact = false,
}: PageStateProps): ReactElement {
  if (tone === 'loading') {
    return (
      <div
        className={cn(
          'wms-ops-page-state wms-ops-page-state--loading',
          compact && 'wms-ops-page-state--compact',
          className,
        )}
      >
        <OpsLoadingState message={title} compact={compact} />
        {description ? <p className="wms-ops-page-state__description">{description}</p> : null}
      </div>
    );
  }

  const { icon: Icon, iconClassName } = stateConfig[tone];

  return (
    <div
      className={cn(
        'wms-ops-form wms-ops-page-state text-center',
        compact && 'wms-ops-page-state--compact',
        tone === 'error' &&
          'border-[color-mix(in_oklab,hsl(var(--destructive))_32%,var(--wms-ops-card-border))]',
        className,
      )}
    >
      <div
        className={cn(
          'wms-ops-page-state__icon flex items-center justify-center border border-[color-mix(in_oklab,var(--wms-ops-accent)_28%,transparent)] bg-[var(--wms-ops-field-bg)]',
          compact ? 'h-9 w-9' : 'h-11 w-11',
        )}
      >
        <Icon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5', iconClassName)} />
      </div>
      <div className="space-y-1.5">
        <p
          className={cn(
            'wms-ops-page-state__title font-semibold text-foreground',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {title}
        </p>
        {description ? <p className="wms-ops-page-state__description">{description}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <OpsActionButton variant={tone === 'error' ? 'primary' : 'secondary'} onClick={onAction}>
          {actionLabel}
        </OpsActionButton>
      ) : null}
    </div>
  );
}
