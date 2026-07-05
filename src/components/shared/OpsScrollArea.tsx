import { type ComponentProps, type ReactElement } from 'react';
import { cn } from '@/lib/utils';

interface OpsScrollAreaProps extends ComponentProps<'div'> {
  axis?: 'y' | 'x' | 'both';
}

export function OpsScrollArea({
  axis = 'both',
  className,
  children,
  ...props
}: OpsScrollAreaProps): ReactElement {
  return (
    <div
      className={cn(
        'wms-ops-scrollbar',
        axis === 'y' && 'overflow-y-auto overflow-x-hidden',
        axis === 'x' && 'overflow-x-auto overflow-y-hidden',
        axis === 'both' && 'overflow-auto',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
