import { type ReactElement, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface OpsListPageShellProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function OpsListPageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: OpsListPageShellProps): ReactElement {
  return (
    <div className={cn('wms-ops-list wms-ops-form space-y-5', className)}>
      {eyebrow ? (
        <header className="wms-ops-header">
          <div className="wms-ops-eyebrow font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
            {eyebrow}
          </div>
        </header>
      ) : null}

      <Card className="wms-ops-form-card overflow-hidden rounded-2xl border py-0 shadow-none">
        <div className="wms-ops-card-toolbar flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
          <div className="wms-ops-card-heading min-w-0 space-y-1">
            <h1 className="wms-ops-title">
              <span className="wms-ops-title-main wms-ops-title-main--toolbar">{title}</span>
            </h1>
            {description ? (
              <p className="wms-ops-subtitle font-mono text-sm">
                <span className="wms-ops-subtitle-prefix" aria-hidden>
                  {'> '}
                </span>
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="wms-ops-card-toolbar-actions w-full sm:w-auto sm:shrink-0">{actions}</div> : null}
        </div>
        <CardContent className="px-4 py-6 sm:px-6">{children}</CardContent>
      </Card>
    </div>
  );
}
