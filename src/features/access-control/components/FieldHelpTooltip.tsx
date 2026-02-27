import { type ReactElement, useEffect, useRef, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FieldHelpTooltipProps {
  text: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function FieldHelpTooltip({ text, side = 'top', className }: FieldHelpTooltipProps): ReactElement {
  const [open, setOpen] = useState(false);
  const hoverDelayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hoverDelayTimerRef.current !== null) {
        window.clearTimeout(hoverDelayTimerRef.current);
      }
    };
  }, []);

  const openWithDelay = (): void => {
    if (hoverDelayTimerRef.current !== null) {
      window.clearTimeout(hoverDelayTimerRef.current);
    }
    hoverDelayTimerRef.current = window.setTimeout(() => setOpen(true), 160);
  };

  const closeImmediately = (): void => {
    if (hoverDelayTimerRef.current !== null) {
      window.clearTimeout(hoverDelayTimerRef.current);
      hoverDelayTimerRef.current = null;
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          role="img"
          aria-label={text}
          tabIndex={0}
          onMouseEnter={openWithDelay}
          onMouseLeave={closeImmediately}
          onFocus={() => setOpen(true)}
          onBlur={closeImmediately}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeImmediately();
            }
          }}
          className={cn(
            'inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-help ml-1 shrink-0',
            className
          )}
        >
          <CircleHelp size={14} strokeWidth={2} />
        </span>
      </PopoverTrigger>
      <PopoverContent side={side} align="center" sideOffset={6} className="pointer-events-none max-w-sm px-3 py-1.5 text-sm">
        <p className="leading-5">{text}</p>
      </PopoverContent>
    </Popover>
  );
}
