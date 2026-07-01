import { type ReactElement } from 'react';
import { CircleHelp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FieldHelpTooltipProps {
  text: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  variant?: 'default' | 'ops';
}

export function FieldHelpTooltip({
  text,
  side = 'top',
  className,
  variant = 'default',
}: FieldHelpTooltipProps): ReactElement {
  const isOps = variant === 'ops';

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label={text}
            tabIndex={0}
            data-no-drag-scroll="true"
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-help',
              isOps
                ? 'wms-ops-field-help ml-0.5 text-[color-mix(in_oklab,var(--wms-ops-accent)_72%,#94a3b8)] hover:text-[var(--wms-ops-accent)]'
                : 'ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
              className,
            )}
          >
            <CircleHelp size={14} strokeWidth={2} />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          sideOffset={6}
          className={cn('max-w-sm px-3 py-1.5', isOps ? 'wms-ops-field-help-tooltip text-xs' : 'text-sm')}
        >
          <p className="leading-5">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
