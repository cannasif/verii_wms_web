import { type ReactElement } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { OpsActionButton } from '../OpsActionButton';
import { cn } from '@/lib/utils';
import type { DataTableVariant } from '../DataTableActionBar';

interface DataTableGridPaginationProps {
  variant?: DataTableVariant;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (size: number) => void;
  paginationInfoText: string;
  onPreviousPage: () => void;
  onNextPage: () => void;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  disablePaginationButtons: boolean;
  previousLabel: string;
  nextLabel: string;
  pageNumber: number;
  totalPages: number;
}

export function DataTableGridPagination({
  variant = 'default',
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  paginationInfoText,
  onPreviousPage,
  onNextPage,
  hasPreviousPage,
  hasNextPage,
  disablePaginationButtons,
  previousLabel,
  nextLabel,
  pageNumber,
  totalPages,
}: DataTableGridPaginationProps): ReactElement {
  const isOps = variant === 'ops';

  if (isOps) {
    return (
      <div className="wms-ops-grid-pagination flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <OpsActionButton type="button" variant="secondary" className="wms-ops-grid-pagination__size-btn">
                <span>{pageSize}</span>
                <ChevronDown className="size-3.5" aria-hidden />
              </OpsActionButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="wms-ops-list-dropdown w-28">
              {pageSizeOptions.map((size) => (
                <DropdownMenuItem key={size} onClick={() => onPageSizeChange(size)}>
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="wms-ops-grid-pagination__info">{paginationInfoText}</div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-end">
          <OpsActionButton
            type="button"
            variant="secondary"
            className="wms-ops-grid-pagination__nav-btn"
            onClick={onPreviousPage}
            disabled={!hasPreviousPage || disablePaginationButtons}
          >
            {previousLabel}
          </OpsActionButton>
          <span className="wms-ops-grid-pagination__page px-2">
            {pageNumber} / {Math.max(totalPages, 1)}
          </span>
          <OpsActionButton
            type="button"
            variant="secondary"
            className="wms-ops-grid-pagination__nav-btn"
            onClick={onNextPage}
            disabled={!hasNextPage || disablePaginationButtons}
          >
            {nextLabel}
          </OpsActionButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-3">
              <span>{pageSize}</span>
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-24">
            {pageSizeOptions.map((size) => (
              <DropdownMenuItem key={size} onClick={() => onPageSizeChange(size)}>
                {size}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="text-xs text-muted-foreground">{paginationInfoText}</div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPreviousPage} disabled={!hasPreviousPage || disablePaginationButtons}>
          {previousLabel}
        </Button>
        <span className={cn('px-2 text-xs text-muted-foreground')}>
          {pageNumber} / {Math.max(totalPages, 1)}
        </span>
        <Button variant="outline" size="sm" onClick={onNextPage} disabled={!hasNextPage || disablePaginationButtons}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
