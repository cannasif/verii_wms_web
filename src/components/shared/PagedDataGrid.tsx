import { type ReactElement, type ReactNode, useMemo } from 'react';
import { DataTableGrid, type DataTableGridColumn, type DataTableSortDirection } from './DataTableGrid';
import type { DataTableActionBarProps, DataTableDefinitionExcelConfig, DataTableVariant } from './DataTableActionBar';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { inferFilterColumnType, type FilterColumnConfig, type FilterRow } from '@/lib/advanced-filter-types';
import type { GridExportColumn } from '@/lib/grid-export';

export type PagedDataGridColumn<TKey extends string> = DataTableGridColumn<TKey>;
export type PagedDataGridSortDirection = DataTableSortDirection;

interface PagedDataGridProps<TRow, TKey extends string> {
  pageKey?: string;
  columns: DataTableGridColumn<TKey>[];
  visibleColumnKeys?: TKey[];
  rows: TRow[];
  rowKey: (row: TRow) => string | number;
  renderCell: (row: TRow, columnKey: TKey) => ReactNode;
  sortBy?: TKey;
  sortDirection?: DataTableSortDirection;
  onSort?: (columnKey: TKey) => void;
  renderSortIcon?: (columnKey: TKey) => ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorText?: string;
  emptyText?: string;
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
  actionBar?: DataTableActionBarProps;
  showActionsColumn?: boolean;
  actionsHeaderLabel?: string;
  renderActionsCell?: (row: TRow) => ReactNode;
  actionsCellClassName?: string;
  iconOnlyActions?: boolean;
  minTableWidthClassName?: string;
  disablePaginationButtons?: boolean;
  userId?: number;
  exportFileName?: string;
  exportColumns?: GridExportColumn[];
  exportRows?: Record<string, unknown>[];
  getExportData?: () => Promise<{ columns: GridExportColumn[]; rows: Record<string, unknown>[] }>;
  filterColumns?: readonly FilterColumnConfig[];
  defaultFilterColumn?: string;
  draftFilterRows?: FilterRow[];
  onDraftFilterRowsChange?: (rows: FilterRow[]) => void;
  filterLogic?: 'and' | 'or';
  onFilterLogicChange?: (value: 'and' | 'or') => void;
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
  translationNamespace?: string;
  appliedFilterCount?: number;
  search?: {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    onSearchChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    debounceMs?: number;
    minLength?: number;
    resetKey?: string | number;
  };
  leftSlot?: ReactNode;
  afterRefreshSlot?: ReactNode;
  refresh?: {
    onRefresh: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    cooldownSeconds?: number;
    label?: string;
  };
  variant?: DataTableVariant;
  defaultColumnWidths?: Record<string, number>;
  columnWidths?: Record<string, number>;
  onResizeColumnPair?: (leftKey: string, rightKey: string, deltaWeight: number) => void;
  getCellText?: (row: TRow, columnKey: TKey) => string | undefined;
  enableColumnResize?: boolean;
  idColumnKey?: string;
  lockedColumnKeys?: string[];
  definitionExcel?: DataTableDefinitionExcelConfig;
  headerLayout?: 'default' | 'slant';
}

function noopFilterRowsChange(_rows: FilterRow[]): void {
  /* stable fallback */
}

function noopVoid(): void {
  /* stable fallback */
}

export function PagedDataGrid<TRow, TKey extends string>({
  pageKey,
  columns,
  visibleColumnKeys,
  rows,
  rowKey,
  renderCell,
  sortBy,
  sortDirection,
  onSort,
  renderSortIcon,
  isLoading,
  isError,
  errorText,
  emptyText,
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
  actionBar,
  showActionsColumn = false,
  actionsHeaderLabel,
  renderActionsCell,
  actionsCellClassName,
  iconOnlyActions,
  minTableWidthClassName,
  disablePaginationButtons,
  userId,
  exportFileName,
  exportColumns,
  exportRows,
  getExportData,
  filterColumns,
  defaultFilterColumn,
  draftFilterRows,
  onDraftFilterRowsChange,
  filterLogic,
  onFilterLogicChange,
  onApplyFilters,
  onClearFilters,
  translationNamespace = 'common',
  appliedFilterCount = 0,
  search,
  leftSlot,
  afterRefreshSlot,
  refresh,
  variant = 'default',
  defaultColumnWidths,
  columnWidths: columnWidthsProp,
  onResizeColumnPair: onResizeColumnPairProp,
  getCellText,
  enableColumnResize,
  idColumnKey = 'id',
  lockedColumnKeys,
  definitionExcel,
  headerLayout,
}: PagedDataGridProps<TRow, TKey>): ReactElement {
  const resolvedPageKey = pageKey ?? actionBar?.pageKey ?? 'paged-data-grid';
  const resolvedLockedKeys = useMemo(
    () => lockedColumnKeys ?? (columns.some((column) => column.key === idColumnKey) ? [idColumnKey] : ['id']),
    [columns, idColumnKey, lockedColumnKeys],
  );
  const preferenceColumns = useMemo(
    () => columns.map(({ key, label }) => ({ key, label })),
    [columns],
  );
  const {
    columnOrder,
    visibleColumns,
    orderedVisibleColumns,
    columnWidths: internalColumnWidths,
    setColumnOrder,
    setVisibleColumns,
    resizeColumnPair,
  } = useColumnPreferences({
    pageKey: resolvedPageKey,
    columns: preferenceColumns,
    defaultWidths: defaultColumnWidths,
    includeActionsColumn: showActionsColumn,
    idColumnKey,
  });

  const resolvedColumnWidths = columnWidthsProp ?? internalColumnWidths;
  const resolvedResizeColumnPair = onResizeColumnPairProp ?? resizeColumnPair;

  const resolvedVisibleColumnKeys = useMemo(
    () => visibleColumnKeys ?? (orderedVisibleColumns.filter((key) => key !== 'actions') as TKey[]),
    [orderedVisibleColumns, visibleColumnKeys],
  );
  const derivedFilterColumns = useMemo<readonly FilterColumnConfig[]>(
    () => columns
      .filter((column) => column.key !== 'actions')
      .map((column) => ({
        value: column.key,
        type: inferFilterColumnType(column.key),
        labelKey: column.key,
        label: column.label,
      })),
    [columns],
  );
  const resolvedFilterColumns = filterColumns ?? derivedFilterColumns;
  const resolvedDefaultFilterColumn = defaultFilterColumn ?? resolvedFilterColumns[0]?.value ?? '';
  const resolvedDraftFilterRows = draftFilterRows ?? [];
  const resolvedOnDraftFilterRowsChange = onDraftFilterRowsChange ?? noopFilterRowsChange;
  const resolvedOnApplyFilters = onApplyFilters ?? noopVoid;
  const resolvedOnClearFilters = onClearFilters ?? noopVoid;
  const resolvedExportColumns = exportColumns ?? [];
  const resolvedExportRows = exportRows ?? [];

  const resolvedActionBar = useMemo<DataTableActionBarProps | undefined>(
    () => actionBar ?? {
      pageKey: resolvedPageKey,
      userId,
      columns: preferenceColumns,
      visibleColumns,
      columnOrder,
      onVisibleColumnsChange: setVisibleColumns,
      onColumnOrderChange: setColumnOrder,
      lockedKeys: resolvedLockedKeys,
      exportFileName: exportFileName ?? resolvedPageKey,
      exportColumns: resolvedExportColumns,
      exportRows: resolvedExportRows,
      getExportData,
      filterColumns: resolvedFilterColumns,
      defaultFilterColumn: resolvedDefaultFilterColumn,
      draftFilterRows: resolvedDraftFilterRows,
      onDraftFilterRowsChange: resolvedOnDraftFilterRowsChange,
      filterLogic,
      onFilterLogicChange,
      onApplyFilters: resolvedOnApplyFilters,
      onClearFilters: resolvedOnClearFilters,
      translationNamespace,
      appliedFilterCount,
      search,
      leftSlot,
      afterRefreshSlot,
      refresh,
      definitionExcel,
    },
    [
      actionBar,
      appliedFilterCount,
      columnOrder,
      definitionExcel,
      exportFileName,
      getExportData,
      leftSlot,
      afterRefreshSlot,
      filterLogic,
      onFilterLogicChange,
      preferenceColumns,
      refresh,
      resolvedDefaultFilterColumn,
      resolvedDraftFilterRows,
      resolvedExportColumns,
      resolvedExportRows,
      resolvedFilterColumns,
      resolvedLockedKeys,
      resolvedOnApplyFilters,
      resolvedOnClearFilters,
      resolvedOnDraftFilterRowsChange,
      resolvedPageKey,
      search,
      setColumnOrder,
      setVisibleColumns,
      translationNamespace,
      userId,
      visibleColumns,
    ],
  );

  return (
    <DataTableGrid<TRow, TKey>
      variant={variant}
      pageKey={resolvedPageKey}
      columns={columns}
      visibleColumnKeys={resolvedVisibleColumnKeys}
      rows={rows}
      rowKey={rowKey}
      renderCell={renderCell}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onSort={onSort}
      renderSortIcon={renderSortIcon}
      isLoading={isLoading}
      isError={isError}
      errorText={errorText}
      emptyText={emptyText}
      rowClassName={rowClassName}
      onRowClick={onRowClick}
      onRowDoubleClick={onRowDoubleClick}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      onPageSizeChange={onPageSizeChange}
      pageNumber={pageNumber}
      totalPages={totalPages}
      hasPreviousPage={hasPreviousPage}
      hasNextPage={hasNextPage}
      onPreviousPage={onPreviousPage}
      onNextPage={onNextPage}
      previousLabel={previousLabel}
      nextLabel={nextLabel}
      paginationInfoText={paginationInfoText}
      showActionsColumn={showActionsColumn}
      actionsHeaderLabel={actionsHeaderLabel ?? ''}
      renderActionsCell={renderActionsCell}
      actionsCellClassName={actionsCellClassName}
      iconOnlyActions={iconOnlyActions}
      minTableWidthClassName={minTableWidthClassName}
      disablePaginationButtons={disablePaginationButtons}
      actionBar={resolvedActionBar}
      columnWidths={resolvedColumnWidths}
      onResizeColumnPair={resolvedResizeColumnPair}
      getCellText={getCellText}
      enableColumnResize={enableColumnResize}
      headerLayout={headerLayout}
    />
  );
}
