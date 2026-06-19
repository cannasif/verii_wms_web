import { type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DataTableGridCellProps {
  title?: string;
  children: ReactNode;
  centered?: boolean;
  className?: string;
}

export function DataTableGridCell({
  title,
  children,
  centered = true,
  className,
}: DataTableGridCellProps): ReactElement {
  return (
    <div
      className={cn('wms-ops-grid-cell', centered && 'wms-ops-grid-cell--center', className)}
      title={title}
    >
      <div className="wms-ops-grid-cell__inner">{children}</div>
    </div>
  );
}
