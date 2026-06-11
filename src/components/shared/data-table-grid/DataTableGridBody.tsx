import { type ReactElement, type ReactNode } from 'react';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { DataTableGridColumn } from '../DataTableGrid';
import { findColumn } from './shared';

interface DataTableGridBodyProps<TRow, TKey extends string> {
  columns: DataTableGridColumn<TKey>[];
  visibleColumnKeys: TKey[];
  rows: TRow[];
  rowKey: (row: TRow) => string | number;
  renderCell: (row: TRow, columnKey: TKey) => ReactNode;
  isLoading: boolean;
  isError: boolean;
  errorText: string;
  emptyText: string;
  pageSize: number;
  colSpan: number;
  showActionsColumn: boolean;
  renderActionsCell?: (row: TRow) => ReactNode;
  actionsCellClassName: string;
  iconOnlyActions: boolean;
  rowClassName?: string | ((row: TRow) => string | undefined);
  onRowClick?: (row: TRow) => void;
  onRowDoubleClick?: (row: TRow) => void;
  handleRowClick: (row: TRow) => void;
  handleRowDoubleClick: (row: TRow) => void;
}

const ACTIONS_CELL_BASE =
  'border-l border-slate-200/70 dark:border-white/10 bg-inherit';

const ICON_ONLY_ACTIONS_CLASS =
  [
    '[&_button]:h-8',
    '[&_button]:w-8',
    '[&_button]:min-w-8',
    '[&_button]:rounded-full',
    '[&_button]:p-0',
    '[&_button]:shadow-sm',
    '[&_button]:transition-transform',
    '[&_button:hover]:scale-105',
    '[&_button_span]:sr-only',
    '[&_button_svg]:mx-auto',
    '[&_button_svg]:h-4',
    '[&_button_svg]:w-4',
    '[&_button_svg]:shrink-0',
  ].join(' ');

export function DataTableGridBody<TRow, TKey extends string>({
  columns,
  visibleColumnKeys,
  rows,
  rowKey,
  renderCell,
  isLoading,
  isError,
  errorText,
  emptyText,
  pageSize,
  colSpan,
  showActionsColumn,
  renderActionsCell,
  actionsCellClassName,
  iconOnlyActions,
  rowClassName,
  onRowClick,
  onRowDoubleClick,
  handleRowClick,
  handleRowDoubleClick,
}: DataTableGridBodyProps<TRow, TKey>): ReactElement {
  return (
    <TableBody>
      {isLoading &&
        Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
          <TableRow key={`skeleton-${i}`}>
            {visibleColumnKeys.map((key, index) => {
              const isLast = index === visibleColumnKeys.length - 1 && !showActionsColumn;
              return (
                <TableCell key={key} className={cn(!isLast && 'border-r border-slate-200/70 dark:border-white/[0.08]')}>
                  <div className="h-5 w-full max-w-[120px] animate-pulse rounded bg-slate-200/60 dark:bg-white/10" />
                </TableCell>
              );
            })}
            {showActionsColumn && (
              <TableCell className={ACTIONS_CELL_BASE}>
                <div className="ml-auto h-8 w-32 animate-pulse rounded bg-slate-200/60 dark:bg-white/10" />
              </TableCell>
            )}
          </TableRow>
        ))}

      {!isLoading && isError && (
        <TableRow>
          <TableCell colSpan={colSpan} className="py-8 text-center text-red-600">
            {errorText}
          </TableCell>
        </TableRow>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <TableRow>
          <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
            {emptyText}
          </TableCell>
        </TableRow>
      )}

      {!isLoading &&
        !isError &&
        rows.map((row) => {
          const customRowClass = typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;
          return (
            <TableRow
              key={rowKey(row)}
              className={cn('hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors', customRowClass)}
              onClick={onRowClick || onRowDoubleClick ? () => handleRowClick(row) : undefined}
              onDoubleClick={onRowDoubleClick ? () => handleRowDoubleClick(row) : undefined}
            >
              {visibleColumnKeys.map((key, index) => {
                const column = findColumn(columns, key);
                const isLast = index === visibleColumnKeys.length - 1 && !showActionsColumn;
                return (
                  <TableCell
                    key={`${rowKey(row)}-${key}`}
                    className={cn(
                      !isLast && 'border-r border-slate-200/70 dark:border-white/[0.08]',
                      column?.cellClassName,
                    )}
                  >
                    {renderCell(row, key)}
                  </TableCell>
                );
              })}

              {showActionsColumn && (
                <TableCell
                  className={cn(ACTIONS_CELL_BASE, actionsCellClassName, iconOnlyActions && ICON_ONLY_ACTIONS_CLASS)}
                  onClick={(event) => event.stopPropagation()}
                  data-no-drag-scroll="true"
                >
                  {renderActionsCell?.(row)}
                </TableCell>
              )}
            </TableRow>
          );
        })}
    </TableBody>
  );
}
