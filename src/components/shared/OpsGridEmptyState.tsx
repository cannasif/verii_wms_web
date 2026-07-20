import { type ReactElement } from 'react';
import { Inbox } from 'lucide-react';

export function OpsGridEmptyState({ message }: { message: string }): ReactElement {
  return (
    <div className="wms-ops-grid-empty wms-ops-terminal-state wms-ops-terminal-state--empty" role="status">
      <div className="wms-ops-grid-empty__icon" aria-hidden>
        <Inbox className="size-5" strokeWidth={1.75} />
      </div>
      <div className="wms-ops-terminal-state__line">
        <span className="wms-ops-terminal-state__prompt" aria-hidden>
          {'>'}
        </span>
        <span className="wms-ops-terminal-state__tag">INFO</span>
        <span className="wms-ops-terminal-state__code">NO_DATA</span>
      </div>
      <div className="wms-ops-terminal-state__detail">{message}</div>
    </div>
  );
}
