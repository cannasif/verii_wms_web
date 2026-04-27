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
  const openDelayTimerRef = useRef<number | null>(null);
  const closeDelayTimerRef = useRef<number | null>(null);
  const isPointerOverTriggerRef = useRef(false);
  const isPointerOverContentRef = useRef(false);

  useEffect(() => {
    return () => {
      if (openDelayTimerRef.current !== null) {
        window.clearTimeout(openDelayTimerRef.current);
      }
      if (closeDelayTimerRef.current !== null) {
        window.clearTimeout(closeDelayTimerRef.current);
      }
    };
  }, []);

  const clearTimers = (): void => {
    if (openDelayTimerRef.current !== null) {
      window.clearTimeout(openDelayTimerRef.current);
      openDelayTimerRef.current = null;
    }
    if (closeDelayTimerRef.current !== null) {
      window.clearTimeout(closeDelayTimerRef.current);
      closeDelayTimerRef.current = null;
    }
  };

  const openWithDelay = (): void => {
    clearTimers();
    openDelayTimerRef.current = window.setTimeout(() => {
      setOpen(true);
      openDelayTimerRef.current = null;
    }, 140);
  };

  const closeWithDelay = (): void => {
    clearTimers();
    closeDelayTimerRef.current = window.setTimeout(() => {
      if (isPointerOverTriggerRef.current || isPointerOverContentRef.current) {
        closeDelayTimerRef.current = null;
        return;
      }
      setOpen(false);
      closeDelayTimerRef.current = null;
    }, 180);
  };

  const closeImmediately = (): void => {
    clearTimers();
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && (isPointerOverTriggerRef.current || isPointerOverContentRef.current)) {
          return;
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <span
          role="img"
          aria-label={text}
          tabIndex={0}
          onMouseEnter={() => {
            isPointerOverTriggerRef.current = true;
            openWithDelay();
          }}
          onMouseLeave={() => {
            isPointerOverTriggerRef.current = false;
            closeWithDelay();
          }}
          onFocus={() => {
            clearTimers();
            setOpen(true);
          }}
          onBlur={closeWithDelay}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeImmediately();
            }
          }}
          className={cn(
            'inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-help ml-1 shrink-0',
            className
          )}
          data-no-drag-scroll="true"
        >
          <CircleHelp size={14} strokeWidth={2} />
        </span>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align="center"
        sideOffset={6}
        onMouseEnter={() => {
          isPointerOverContentRef.current = true;
          clearTimers();
          setOpen(true);
        }}
        onMouseLeave={() => {
          isPointerOverContentRef.current = false;
          closeWithDelay();
        }}
        onInteractOutside={(event) => {
          if (isPointerOverTriggerRef.current || isPointerOverContentRef.current) {
            event.preventDefault();
          }
        }}
        className="max-w-sm px-3 py-1.5 text-sm"
      >
        <p className="leading-5">{text}</p>
      </PopoverContent>
    </Popover>
  );
}
