import { type ReactElement, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { PremiumEyebrow } from './PremiumEyebrow';

interface OpsFormPageShellProps {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actionsLeading?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function OpsFormPageShell({
  eyebrow,
  title,
  description,
  actionsLeading,
  actions,
  children,
  className,
}: OpsFormPageShellProps): ReactElement {
  const { skin } = useTheme();
  const isPremium = skin === 'premium';
  const toolbarLeading =
    actionsLeading ??
    (title || description ? (
      <div className="wms-ops-card-heading min-w-0 space-y-1">
        {title ? (
          <h1 className="wms-ops-title">
            <span className="wms-ops-title-main wms-ops-title-main--toolbar">{title}</span>
          </h1>
        ) : null}
        {description ? (
          <p className="wms-ops-subtitle font-mono text-sm">
            <span className="wms-ops-subtitle-prefix" aria-hidden>
              {'> '}
            </span>
            {description}
          </p>
        ) : null}
      </div>
    ) : null);

  return (
    <div className={cn('wms-ops-form space-y-5', className)}>
      <header className="wms-ops-header">
        {isPremium ? (
          <PremiumEyebrow eyebrow={eyebrow} />
        ) : (
          <div className="wms-ops-eyebrow font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
            {eyebrow}
          </div>
        )}
      </header>

      <Card className="wms-ops-form-card overflow-hidden rounded-none border py-0 shadow-none">
        {toolbarLeading || actions ? (
          <div className="wms-ops-card-toolbar flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
            <div className="min-w-0 flex-1">{toolbarLeading}</div>
            {actions ? <div className="wms-ops-card-toolbar-actions w-full sm:w-auto sm:shrink-0">{actions}</div> : null}
          </div>
        ) : null}
        <CardContent className="px-4 py-6 sm:px-6">{children}</CardContent>
      </Card>
    </div>
  );
}
