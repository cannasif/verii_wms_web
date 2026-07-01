import { type ReactElement } from 'react';
import { cn } from '@/lib/utils';

interface OpsLoadingStateProps {
  message: string;
  compact?: boolean;
  code?: string;
  className?: string;
}

export function OpsLoadingState({
  message,
  compact = false,
  code = 'SYNC',
  className,
}: OpsLoadingStateProps): ReactElement {
  return (
    <div
      className={cn('wms-ops-loading-state', compact && 'wms-ops-loading-state--compact', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="wms-ops-terminal-state__line">
        <span className="wms-ops-terminal-state__prompt" aria-hidden>
          {'>'}
        </span>
        <span className="wms-ops-terminal-state__tag wms-ops-loading-state__tag">RUN</span>
        <span className="wms-ops-terminal-state__code">{code}</span>
      </div>
      <div className="wms-ops-loading-state__bar" aria-hidden>
        <span className="wms-ops-loading-state__bar-scan" />
      </div>
      <div className="wms-ops-terminal-state__detail">{message}</div>
    </div>
  );
}
