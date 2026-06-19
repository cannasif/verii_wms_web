import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DataTableActionBar, type DataTableActionBarProps, type DataTableVariant } from './DataTableActionBar';
import { FieldHelpTooltip } from '@/features/access-control/components/FieldHelpTooltip';
import { DataTableGridBody } from './data-table-grid/DataTableGridBody';
import { DataTableGridPagination } from './data-table-grid/DataTableGridPagination';
import {
  DEFAULT_ACTIONS_COLUMN_WEIGHT,
  getColumnWidthPercent,
  getTableMinWidthPx,
  MIN_COLUMN_WEIGHT,
  normalizeColumnWeights,
  pixelDeltaToWeightDelta,
} from './data-table-grid/column-widths';
import { findColumn, isInteractiveTarget } from './data-table-grid/shared';
import { ArrowUpDown, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type DataTableSortDirection = 'asc' | 'desc';

export interface DataTableGridColumn<TKey extends string> {
  key: TKey;
  label: string;
  headerHelpText?: string;
  sortable?: boolean;
  headClassName?: string;
  cellClassName?: string;
}

interface DataTableGridProps<TRow, TKey extends string> {
  pageKey?: string;
  actionBar?: DataTableActionBarProps;
  toolbar?: ReactNode;
  columns: DataTableGridColumn<TKey>[];
  visibleColumnKeys: TKey[];
  rows: TRow[];
  rowKey: (row: TRow) => string | number;
  renderCell: (row: TRow, columnKey: TKey) => ReactNode;
  sortBy?: TKey;
  sortDirection?: DataTableSortDirection;
  onSort?: (columnKey: TKey) => void;
  renderSortIcon?: (columnKey: TKey) => ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  loadingText?: string;
  errorText?: string;
  emptyText?: string;
  minTableWidthClassName?: string;
  showActionsColumn?: boolean;
  actionsHeaderLabel?: string;
  renderActionsCell?: (row: TRow) => ReactNode;
  actionsCellClassName?: string;
  iconOnlyActions?: boolean;
  rowClassName?: string | ((row: TRow) => string | undefined);
  onRowClick?: (row: TRow) => void;
  onRowDoubleClick?: (row: TRow) => void;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (size: number) => void;
  pageNumber: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  previousLabel: string;
  nextLabel: string;
  paginationInfoText: string;
  disablePaginationButtons?: boolean;
  enableColumnDragAndDrop?: boolean;
  onColumnOrderChange?: (newOrder: TKey[]) => void;
  columnWidths?: Record<string, number>;
  onResizeColumnPair?: (leftKey: string, rightKey: string, deltaWeight: number) => void;
  getCellText?: (row: TRow, columnKey: TKey) => string | undefined;
  enableColumnResize?: boolean;
  variant?: DataTableVariant;
}

const ACTIONS_COLUMN_KEY = '__actions__';


interface SortableHeadProps {
  id: string;
  isDraggable: boolean;
  className?: string;
  children: ReactNode;
  trailing?: ReactNode;
  variant?: DataTableVariant;
}

function SortableHead({
  id,
  isDraggable,
  className,
  children,
  trailing,
  variant = 'default',
}: SortableHeadProps): ReactElement {
  const isOps = variant === 'ops';
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !isDraggable,
  });

  const style: React.CSSProperties = isDraggable
    ? {
      transform: CSS.Translate.toString(transform),
      transition,
      opacity: isDragging ? 0.75 : 1,
      zIndex: isDragging ? 10 : 'auto',
      position: 'relative',
    }
    : {};

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(className, isDragging && 'shadow-md')}
      {...(isDraggable ? attributes : {})}
    >
      <div
        className={cn(
          'flex w-full min-w-0 items-center',
          isOps ? 'wms-ops-table-head__layout gap-0.5' : 'gap-1',
        )}
      >
        {isDraggable ? (
          <div
            {...attributes}
            {...listeners}
            className={cn(
              'cursor-grab active:cursor-grabbing touch-none shadow-sm shrink-0',
              isOps
                ? 'wms-ops-table-head__grip'
                : 'p-1 py-1.5 ml-1 rounded-[.3rem] border border-slate-200 bg-white/50 text-slate-400 hover:text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-500 dark:hover:text-slate-300 transition-colors',
            )}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            data-no-drag-scroll="true"
          >
            <GripVertical size={isOps ? 12 : 14} />
          </div>
        ) : null}
        <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>
      {trailing}
    </TableHead>
  );
}

const tableScrollPositions = new Map<string, number>();

export function DataTableGrid<TRow, TKey extends string>({
  pageKey,
  actionBar,
  toolbar,
  columns,
  visibleColumnKeys,
  rows,
  rowKey,
  renderCell,
  onSort,
  renderSortIcon,
  isLoading = false,
  isError = false,
  errorText = 'An error occurred while loading rows.',
  emptyText = 'No rows found.',
  minTableWidthClassName = 'min-w-[1200px]',
  showActionsColumn = false,
  actionsHeaderLabel = '',
  renderActionsCell,
  actionsCellClassName = 'text-right align-middle',
  iconOnlyActions = true,
  rowClassName,
  onRowClick,
  onRowDoubleClick,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  pageNumber,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPreviousPage,
  onNextPage,
  previousLabel,
  nextLabel,
  paginationInfoText,
  disablePaginationButtons = false,
  enableColumnDragAndDrop = true,
  onColumnOrderChange,
  columnWidths,
  onResizeColumnPair,
  getCellText,
  enableColumnResize,
  variant = 'default',
}: DataTableGridProps<TRow, TKey>): ReactElement {
  const isOps = variant === 'ops';
  const canResizeColumns = (enableColumnResize ?? isOps) && Boolean(onResizeColumnPair);
  const [localVisibleColumnKeys, setLocalVisibleColumnKeys] = useState<TKey[]>(visibleColumnKeys);
  const lastPropKeysRef = useRef(visibleColumnKeys);

  useEffect(() => {
    const isSame =
      visibleColumnKeys.length === lastPropKeysRef.current.length &&
      visibleColumnKeys.every((k, i) => k === lastPropKeysRef.current[i]);
    if (!isSame) {
      setLocalVisibleColumnKeys(visibleColumnKeys);
      lastPropKeysRef.current = visibleColumnKeys;
    }
  }, [visibleColumnKeys]);

  const [isDragging, setIsDragging] = useState(false);
  const lastRowClickRef = useRef<{ key: string | number; timestamp: number } | null>(null);
  const suppressNativeDoubleClickUntilRef = useRef(0);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const resizeStateRef = useRef<{
    leftKey: string;
    rightKey: string;
    startX: number;
    tableWidth: number;
    totalWeight: number;
    pointerId: number;
  } | null>(null);
  const resolvedScrollKey = pageKey ?? actionBar?.pageKey ?? null;
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
    pointerId: -1,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleColumnDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = localVisibleColumnKeys.indexOf(active.id as TKey);
      let newIndex = localVisibleColumnKeys.indexOf(over.id as TKey);
      if (String(localVisibleColumnKeys[0]).toLowerCase() === 'id' && newIndex === 0) newIndex = 1;
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const newKeys = arrayMove(localVisibleColumnKeys, oldIndex, newIndex);
      setLocalVisibleColumnKeys(newKeys);
      onColumnOrderChange?.(newKeys);
    },
    [localVisibleColumnKeys, onColumnOrderChange],
  );

  const handleScrollDragStart = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;
    const container = tableScrollRef.current;
    if (!container) return;
    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
      moved: false,
      pointerId: event.pointerId,
    };
    setIsDragging(true);
    tableScrollRef.current?.setPointerCapture(event.pointerId);
  };

  const handleScrollDragMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const container = tableScrollRef.current;
    if (!container || !dragStateRef.current.isDragging || dragStateRef.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragStateRef.current.startX;
    if (Math.abs(deltaX) > 4) dragStateRef.current.moved = true;
    container.scrollLeft = dragStateRef.current.startScrollLeft - deltaX;
  };

  const handleScrollDragEnd = (): void => {
    dragStateRef.current.isDragging = false;
    dragStateRef.current.pointerId = -1;
    setIsDragging(false);
  };

  const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement>): void => {
    if (!dragStateRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current.moved = false;
  };

  const handleRowClick = (row: TRow): void => {
    const key = rowKey(row);
    const now = Date.now();
    const lastClick = lastRowClickRef.current;
    const isFastSecondClick = lastClick != null && lastClick.key === key && now - lastClick.timestamp <= 320;

    onRowClick?.(row);

    if (isFastSecondClick && onRowDoubleClick) {
      suppressNativeDoubleClickUntilRef.current = now + 400;
      onRowDoubleClick(row);
      lastRowClickRef.current = null;
      return;
    }

    lastRowClickRef.current = { key, timestamp: now };
  };

  const handleRowDoubleClick = (row: TRow): void => {
    if (!onRowDoubleClick) return;
    if (Date.now() <= suppressNativeDoubleClickUntilRef.current) return;
    onRowDoubleClick(row);
  };

  const colSpan = localVisibleColumnKeys.length + (showActionsColumn ? 1 : 0) || 1;

  const widthKeys = useMemo(() => {
    const keys = [...localVisibleColumnKeys] as string[];
    if (showActionsColumn) keys.push(ACTIONS_COLUMN_KEY);
    return keys;
  }, [localVisibleColumnKeys, showActionsColumn]);

  const resolvedColumnWidths = useMemo(
    () => columnWidths ?? normalizeColumnWeights(
      localVisibleColumnKeys as string[],
      {},
      DEFAULT_ACTIONS_COLUMN_WEIGHT,
      showActionsColumn,
    ),
    [columnWidths, localVisibleColumnKeys, showActionsColumn],
  );

  const totalColumnWeight = useMemo(
    () => widthKeys.reduce((sum, key) => sum + (resolvedColumnWidths[key] ?? MIN_COLUMN_WEIGHT), 0),
    [resolvedColumnWidths, widthKeys],
  );

  const tableMinWidthPx = useMemo(
    () => (canResizeColumns ? getTableMinWidthPx(totalColumnWeight) : undefined),
    [canResizeColumns, totalColumnWeight],
  );

  const handleResizePointerDown = useCallback(
    (leftKey: string, rightKey: string) => (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (!canResizeColumns || !onResizeColumnPair) return;
      event.preventDefault();
      event.stopPropagation();
      const tableWidth = tableRef.current?.getBoundingClientRect().width ?? 0;
      if (tableWidth <= 0) return;
      resizeStateRef.current = {
        leftKey,
        rightKey,
        startX: event.clientX,
        tableWidth,
        totalWeight: totalColumnWeight,
        pointerId: event.pointerId,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [canResizeColumns, onResizeColumnPair, totalColumnWeight],
  );

  const handleResizePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      const state = resizeStateRef.current;
      if (!state || !onResizeColumnPair || state.pointerId !== event.pointerId) return;
      const deltaPx = event.clientX - state.startX;
      if (Math.abs(deltaPx) < 1) return;
      const deltaWeight = pixelDeltaToWeightDelta(deltaPx, state.tableWidth, state.totalWeight);
      onResizeColumnPair(state.leftKey, state.rightKey, deltaWeight);
      resizeStateRef.current = { ...state, startX: event.clientX };
    },
    [onResizeColumnPair],
  );

  const handleResizePointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    if (resizeStateRef.current?.pointerId !== event.pointerId) return;
    resizeStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  useLayoutEffect(() => {
    if (!resolvedScrollKey) return;
    const container = tableScrollRef.current;
    if (!container) return;
    const saved = tableScrollPositions.get(resolvedScrollKey);
    if (typeof saved === 'number' && Number.isFinite(saved)) {
      container.scrollLeft = saved;
    }
  }, [resolvedScrollKey, localVisibleColumnKeys.length, rows.length, isLoading, isError]);

  useEffect(() => {
    if (!resolvedScrollKey) return;
    const container = tableScrollRef.current;
    if (!container) return;
    const handleScroll = (): void => {
      tableScrollPositions.set(resolvedScrollKey, container.scrollLeft);
    };
    handleScroll();
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [resolvedScrollKey]);

  const renderHeaderCell = (key: TKey, index: number): ReactElement => {
    const column = findColumn(columns, key);
    const sortable = Boolean(onSort && column?.sortable !== false);
    const isLast = index === localVisibleColumnKeys.length - 1 && !showActionsColumn;
    const isDraggable = enableColumnDragAndDrop && !['id', 'select', 'actions'].includes(String(key).toLowerCase());

    const rightKey = index < localVisibleColumnKeys.length - 1
      ? String(localVisibleColumnKeys[index + 1])
      : showActionsColumn
        ? ACTIONS_COLUMN_KEY
        : null;

    const headCellClass = cn(
      isOps ? 'wms-ops-table-head' : 'bg-slate-100/90 dark:bg-white/[0.06]',
      !isOps && 'text-xs uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-300',
      !isLast && (isOps ? 'border-r' : 'border-r border-slate-200/90 dark:border-white/10'),
      canResizeColumns && rightKey && 'relative',
      column?.headClassName,
    );

    const content = sortable ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSort?.(key)}
        className={cn(
          'h-7 w-full min-w-0 overflow-hidden px-1',
          isOps ? 'justify-center gap-0.5' : 'flex-1 justify-center gap-1.5 px-2',
          'rounded',
          'text-slate-600 dark:text-slate-300',
          'hover:bg-slate-200/60 dark:hover:bg-white/10',
          'hover:text-slate-900 dark:hover:text-white',
          'transition-colors',
        )}
      >
        <span className="truncate" title={column?.label ?? key}>{column?.label ?? key}</span>
        {column?.headerHelpText ? <FieldHelpTooltip text={column.headerHelpText} side="top" /> : null}
        {renderSortIcon?.(key) ?? <ArrowUpDown size={12} className="opacity-60 shrink-0" />}
      </Button>
    ) : (
      <span className="inline-flex w-full min-w-0 items-center justify-center gap-1.5 overflow-hidden px-1">
        <span className="truncate" title={column?.label ?? key}>{column?.label ?? key}</span>
        {column?.headerHelpText ? <FieldHelpTooltip text={column.headerHelpText} side="top" /> : null}
      </span>
    );

    const resizeHandle = canResizeColumns && rightKey ? (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('wms-ops-col-resize-handle', !isOps && 'data-table-col-resize-handle')}
        onPointerDown={handleResizePointerDown(String(key), rightKey)}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerEnd}
        onPointerCancel={handleResizePointerEnd}
        data-no-drag-scroll="true"
      />
    ) : null;

    return (
      <SortableHead
        key={key}
        id={key}
        isDraggable={isDraggable}
        className={headCellClass}
        variant={variant}
        trailing={resizeHandle}
      >
        {content}
      </SortableHead>
    );
  };

  const actionsHead = showActionsColumn ? (
    <TableHead
      className={cn(
        'text-center border-l',
        isOps
          ? 'wms-ops-table-actions-col wms-ops-table-head'
          : 'w-[156px] min-w-[156px] text-right bg-slate-100/90 dark:bg-white/[0.06] text-xs uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-white/10',
      )}
    >
      {actionsHeaderLabel}
    </TableHead>
  ) : null;

  return (
    <div className={cn('min-w-0 w-full space-y-4', isOps && 'wms-ops-data-grid')}>
      {actionBar ? <DataTableActionBar {...actionBar} variant={actionBar.variant ?? variant} /> : toolbar}

      <div
        ref={tableScrollRef}
        className={cn(
          'w-full min-w-0 overflow-x-auto overflow-y-hidden',
          isOps
            ? 'wms-ops-table-wrap border'
            : 'rounded-2xl border border-slate-200/70 bg-white dark:border-white/10 dark:bg-[#130822]',
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab',
        )}
        onPointerDown={handleScrollDragStart}
        onPointerMove={handleScrollDragMove}
        onPointerUp={handleScrollDragEnd}
        onPointerCancel={handleScrollDragEnd}
        onClickCapture={handleClickCapture}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleColumnDragEnd}
          autoScroll={false}
        >
          <Table
            ref={tableRef}
            className={cn(
              isOps
                ? cn('w-full table-fixed wms-ops-table-fixed', minTableWidthClassName)
                : minTableWidthClassName,
            )}
            style={tableMinWidthPx ? { minWidth: tableMinWidthPx } : undefined}
          >
            {canResizeColumns ? (
              <colgroup>
                {widthKeys.map((key) => (
                  <col
                    key={key}
                    style={{ width: `${getColumnWidthPercent(resolvedColumnWidths[key] ?? MIN_COLUMN_WEIGHT, totalColumnWeight)}%` }}
                  />
                ))}
              </colgroup>
            ) : null}
            <TableHeader>
              <TableRow>
                <SortableContext
                  items={localVisibleColumnKeys.filter((k) => String(k).toLowerCase() !== 'id')}
                  strategy={horizontalListSortingStrategy}
                >
                  {localVisibleColumnKeys.map((key, index) => renderHeaderCell(key, index))}
                </SortableContext>
                {actionsHead}
              </TableRow>
            </TableHeader>

            <DataTableGridBody
              columns={columns}
              visibleColumnKeys={localVisibleColumnKeys}
              rows={rows}
              rowKey={rowKey}
              renderCell={renderCell}
              getCellText={getCellText}
              variant={variant}
              isLoading={isLoading}
              isError={isError}
              errorText={errorText}
              emptyText={emptyText}
              pageSize={pageSize}
              colSpan={colSpan}
              showActionsColumn={showActionsColumn}
              renderActionsCell={renderActionsCell}
              actionsCellClassName={actionsCellClassName}
              iconOnlyActions={iconOnlyActions}
              rowClassName={rowClassName}
              onRowClick={onRowClick}
              onRowDoubleClick={onRowDoubleClick}
              handleRowClick={handleRowClick}
              handleRowDoubleClick={handleRowDoubleClick}
            />
          </Table>
        </DndContext>
      </div>

      <DataTableGridPagination
        variant={variant}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={onPageSizeChange}
        paginationInfoText={paginationInfoText}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        disablePaginationButtons={disablePaginationButtons}
        previousLabel={previousLabel}
        nextLabel={nextLabel}
        pageNumber={pageNumber}
        totalPages={totalPages}
      />
    </div>
  );
}
