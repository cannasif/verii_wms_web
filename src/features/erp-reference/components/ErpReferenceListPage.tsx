import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { useErpReferenceQuery } from '../hooks/useErpReferenceQuery';
import { StockMirrorDetailDialog } from './StockMirrorDetailDialog';
import type {
  CustomerReferenceDto,
  ErpReferenceKind,
  StockReferenceDto,
  WarehouseReferenceDto,
  YapKodReferenceDto,
} from '../types/erpReference.types';

type RawRow = CustomerReferenceDto | StockReferenceDto | WarehouseReferenceDto | YapKodReferenceDto;
type Row = {
  id: number;
  code: string | number;
  name: string;
  branchCode?: string;
  meta1?: string;
  meta2?: string;
  lastSyncDate?: string;
};
type ColumnKey = 'code' | 'name' | 'branchCode' | 'meta1' | 'meta2' | 'lastSyncDate' | 'actions';

const OPS_COL = 'wms-ops-table-center-col';

function renderOpsCode(value: string | number): ReactElement {
  return <span className="wms-ops-table-id-value font-mono text-xs">{value}</span>;
}

function renderOpsName(value: string): ReactElement {
  return <span className="font-medium uppercase tracking-wide">{value}</span>;
}

function renderOpsBranch(value?: string): ReactElement {
  return (
    <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">
      {value || '-'}
    </Badge>
  );
}

function renderOpsDate(value?: string): ReactElement {
  return <span className="font-mono text-xs">{formatDate(value)}</span>;
}

function renderOpsText(value?: string): ReactElement {
  return <span>{value || '-'}</span>;
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function getConfig(kind: ErpReferenceKind, t: (key: string, options?: Record<string, unknown>) => string) {
  const opsColumn = (key: ColumnKey, label: string, sortable = true): PagedDataGridColumn<ColumnKey> => ({
    key,
    label,
    sortable,
    headClassName: OPS_COL,
    cellClassName: OPS_COL,
  });

  switch (kind) {
    case 'customer':
      return {
        title: t('erpReference.customer.title', { defaultValue: 'Missing translation' }),
        description: t('erpReference.customer.description', { defaultValue: 'Missing translation' }),
        breadcrumb: t('sidebar.erpCustomers', { defaultValue: 'Missing translation' }),
        pageKey: 'erp-reference-customers',
        errorKey: t('common.errors.erpCustomersLoadFailed'),
        defaultSortBy: 'code' as ColumnKey,
        defaultColumnWidths: { code: 14, name: 30, branchCode: 10, meta1: 14, meta2: 16, lastSyncDate: 18 } as Record<string, number>,
        filterColumns: [
          { value: 'code', type: 'string', labelKey: 'erpReference.columns.code' },
          { value: 'name', type: 'string', labelKey: 'erpReference.columns.name' },
          { value: 'meta1', type: 'string', labelKey: 'erpReference.columns.city' },
          { value: 'meta2', type: 'string', labelKey: 'erpReference.columns.phone' },
        ] satisfies readonly FilterColumnConfig[],
        mapSortBy: (value: ColumnKey) => {
          if (value === 'actions') return 'CustomerCode';
          return ({
            code: 'CustomerCode',
            name: 'CustomerName',
            branchCode: 'BranchCode',
            meta1: 'City',
            meta2: 'Phone1',
            lastSyncDate: 'LastSyncDate',
          }[value] ?? 'CustomerCode');
        },
        columns: [
          opsColumn('code', t('erpReference.columns.code', { defaultValue: 'Missing translation' })),
          opsColumn('name', t('erpReference.columns.name', { defaultValue: 'Missing translation' })),
          opsColumn('branchCode', t('erpReference.columns.branch', { defaultValue: 'Missing translation' })),
          opsColumn('meta1', t('erpReference.columns.city', { defaultValue: 'Missing translation' })),
          opsColumn('meta2', t('erpReference.columns.phone', { defaultValue: 'Missing translation' })),
          opsColumn('lastSyncDate', t('erpReference.columns.lastSyncDate', { defaultValue: 'Missing translation' })),
        ] satisfies PagedDataGridColumn<ColumnKey>[],
        renderCell: (item: Row, columnKey: ColumnKey) => {
          switch (columnKey) {
            case 'code': return renderOpsCode(item.code);
            case 'name': return renderOpsName(item.name);
            case 'branchCode': return renderOpsBranch(item.branchCode);
            case 'meta1': return renderOpsText(item.meta1);
            case 'meta2': return renderOpsText(item.meta2);
            case 'lastSyncDate': return renderOpsDate(item.lastSyncDate);
            default: return null;
          }
        },
        getCellText: (item: Row, columnKey: ColumnKey) => {
          switch (columnKey) {
            case 'code': return String(item.code);
            case 'name': return item.name;
            case 'branchCode': return item.branchCode ?? '-';
            case 'meta1': return item.meta1 ?? '-';
            case 'meta2': return item.meta2 ?? '-';
            case 'lastSyncDate': return formatDate(item.lastSyncDate);
            default: return undefined;
          }
        },
      };
    case 'stock':
      return {
        title: t('erpReference.stock.title', { defaultValue: 'Missing translation' }),
        description: t('erpReference.stock.description', { defaultValue: 'Missing translation' }),
        breadcrumb: t('sidebar.erpStocks', { defaultValue: 'Missing translation' }),
        pageKey: 'erp-reference-stocks',
        errorKey: t('common.errors.erpProductsLoadFailed'),
        defaultSortBy: 'code' as ColumnKey,
        defaultColumnWidths: { code: 16, name: 28, branchCode: 10, meta1: 10, meta2: 14, lastSyncDate: 18, actions: 10 } as Record<string, number>,
        filterColumns: [
          { value: 'code', type: 'string', labelKey: 'erpReference.columns.code' },
          { value: 'name', type: 'string', labelKey: 'erpReference.columns.name' },
          { value: 'meta1', type: 'string', labelKey: 'erpReference.columns.unit' },
          { value: 'meta2', type: 'string', labelKey: 'erpReference.columns.group' },
        ] satisfies readonly FilterColumnConfig[],
        mapSortBy: (value: ColumnKey) => {
          if (value === 'actions') return 'ErpStockCode';
          return ({
            code: 'ErpStockCode',
            name: 'StockName',
            branchCode: 'BranchCode',
            meta1: 'Unit',
            meta2: 'GrupKodu',
            lastSyncDate: 'LastSyncDate',
          }[value] ?? 'ErpStockCode');
        },
        columns: [
          opsColumn('code', t('erpReference.columns.code', { defaultValue: 'Missing translation' })),
          opsColumn('name', t('erpReference.columns.name', { defaultValue: 'Missing translation' })),
          opsColumn('branchCode', t('erpReference.columns.branch', { defaultValue: 'Missing translation' })),
          opsColumn('meta1', t('erpReference.columns.unit', { defaultValue: 'Missing translation' })),
          opsColumn('meta2', t('erpReference.columns.group', { defaultValue: 'Missing translation' })),
          opsColumn('lastSyncDate', t('erpReference.columns.lastSyncDate', { defaultValue: 'Missing translation' })),
          opsColumn('actions', t('common.actions', { defaultValue: 'Missing translation' }), false),
        ] satisfies PagedDataGridColumn<ColumnKey>[],
        renderCell: (item: Row, columnKey: ColumnKey) => {
          switch (columnKey) {
            case 'code': return renderOpsCode(item.code);
            case 'name': return renderOpsName(item.name);
            case 'branchCode': return renderOpsBranch(item.branchCode);
            case 'meta1': return renderOpsText(item.meta1);
            case 'meta2': return renderOpsText(item.meta2);
            case 'lastSyncDate': return renderOpsDate(item.lastSyncDate);
            default: return null;
          }
        },
        getCellText: (item: Row, columnKey: ColumnKey) => {
          switch (columnKey) {
            case 'code': return String(item.code);
            case 'name': return item.name;
            case 'branchCode': return item.branchCode ?? '-';
            case 'meta1': return item.meta1 ?? '-';
            case 'meta2': return item.meta2 ?? '-';
            case 'lastSyncDate': return formatDate(item.lastSyncDate);
            default: return undefined;
          }
        },
      };
    case 'warehouse':
      return {
        title: t('erpReference.warehouse.title', { defaultValue: 'Missing translation' }),
        description: t('erpReference.warehouse.description', { defaultValue: 'Missing translation' }),
        breadcrumb: t('sidebar.erpWarehouses', { defaultValue: 'Missing translation' }),
        pageKey: 'erp-reference-warehouses',
        errorKey: t('common.errors.erpWarehousesLoadFailed'),
        defaultSortBy: 'code' as ColumnKey,
        defaultColumnWidths: { code: 16, name: 36, branchCode: 12 } as Record<string, number>,
        filterColumns: [
          { value: 'code', type: 'string', labelKey: 'erpReference.columns.code' },
          { value: 'name', type: 'string', labelKey: 'erpReference.columns.name' },
          { value: 'branchCode', type: 'string', labelKey: 'erpReference.columns.branch' },
        ] satisfies readonly FilterColumnConfig[],
        mapSortBy: (value: ColumnKey) => {
          if (value === 'actions') return 'WarehouseCode';
          switch (value) {
            case 'name': return 'WarehouseName';
            case 'branchCode': return 'BranchCode';
            case 'code':
            default: return 'WarehouseCode';
          }
        },
        columns: [
          opsColumn('code', t('erpReference.columns.code', { defaultValue: 'Missing translation' })),
          opsColumn('name', t('erpReference.columns.name', { defaultValue: 'Missing translation' })),
          opsColumn('branchCode', t('erpReference.columns.branch', { defaultValue: 'Missing translation' })),
        ] satisfies PagedDataGridColumn<ColumnKey>[],
        renderCell: (item: Row, columnKey: ColumnKey) => {
          switch (columnKey) {
            case 'code': return renderOpsCode(item.code);
            case 'name': return renderOpsName(item.name);
            case 'branchCode': return renderOpsBranch(item.branchCode);
            default: return null;
          }
        },
        getCellText: (item: Row, columnKey: ColumnKey) => {
          switch (columnKey) {
            case 'code': return String(item.code);
            case 'name': return item.name;
            case 'branchCode': return item.branchCode ?? '-';
            default: return undefined;
          }
        },
      };
    case 'yapkod':
      return {
        title: t('erpReference.yapkod.title', { defaultValue: 'Missing translation' }),
        description: t('erpReference.yapkod.description', { defaultValue: 'Missing translation' }),
        breadcrumb: t('sidebar.erpYapKodlar', { defaultValue: 'Missing translation' }),
        pageKey: 'erp-reference-yapkod',
        errorKey: t('common.errors.requestFailed'),
        defaultSortBy: 'code' as ColumnKey,
        defaultColumnWidths: { code: 16, name: 26, branchCode: 10, meta1: 18, lastSyncDate: 18 } as Record<string, number>,
        filterColumns: [
          { value: 'code', type: 'string', labelKey: 'erpReference.columns.code' },
          { value: 'name', type: 'string', labelKey: 'erpReference.columns.name' },
          { value: 'meta1', type: 'string', labelKey: 'erpReference.columns.linkedStock' },
        ] satisfies readonly FilterColumnConfig[],
        mapSortBy: (value: ColumnKey) => {
          if (value === 'actions') return 'YapKod';
          switch (value) {
            case 'name': return 'YapAcik';
            case 'branchCode': return 'BranchCode';
            case 'meta1': return 'YplndrStokKod';
            case 'lastSyncDate': return 'LastSyncDate';
            case 'code':
            default: return 'YapKod';
          }
        },
        columns: [
          opsColumn('code', t('erpReference.columns.code', { defaultValue: 'Missing translation' })),
          opsColumn('name', t('erpReference.columns.name', { defaultValue: 'Missing translation' })),
          opsColumn('branchCode', t('erpReference.columns.branch', { defaultValue: 'Missing translation' })),
          opsColumn('meta1', t('erpReference.columns.linkedStock', { defaultValue: 'Missing translation' })),
          opsColumn('lastSyncDate', t('erpReference.columns.lastSyncDate', { defaultValue: 'Missing translation' })),
        ] satisfies PagedDataGridColumn<ColumnKey>[],
        renderCell: (item: Row, columnKey: ColumnKey) => {
          switch (columnKey) {
            case 'code': return renderOpsCode(item.code);
            case 'name': return renderOpsName(item.name);
            case 'branchCode': return renderOpsBranch(item.branchCode);
            case 'meta1': return renderOpsText(item.meta1);
            case 'lastSyncDate': return renderOpsDate(item.lastSyncDate);
            default: return null;
          }
        },
        getCellText: (item: Row, columnKey: ColumnKey) => {
          switch (columnKey) {
            case 'code': return String(item.code);
            case 'name': return item.name;
            case 'branchCode': return item.branchCode ?? '-';
            case 'meta1': return item.meta1 ?? '-';
            case 'lastSyncDate': return formatDate(item.lastSyncDate);
            default: return undefined;
          }
        },
      };
  }
}

export function ErpReferenceListPage({ kind }: { kind: ErpReferenceKind }): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const config = useMemo(() => getConfig(kind, (key, options) => t(key, options)), [kind, t]);

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey: config.pageKey,
    defaultSortBy: config.defaultSortBy,
    defaultSortDirection: 'asc',
    defaultPageSize: 20,
    mapSortBy: config.mapSortBy,
  });

  const { data, isLoading, error, refetch } = useErpReferenceQuery(kind, pagedGrid.queryParams);
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const showActionsColumn = kind === 'stock';
  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, columnWidths, setColumnOrder, setVisibleColumns, resizeColumnPair } = useColumnPreferences({
    pageKey: config.pageKey,
    columns: config.columns.map(({ key, label }) => ({ key, label })),
    defaultWidths: config.defaultColumnWidths,
    includeActionsColumn: showActionsColumn,
    idColumnKey: 'code',
  });

  useEffect(() => {
    setPageTitle(config.title);
    return () => setPageTitle(null);
  }, [config.title, setPageTitle]);

  const rows = useMemo<Row[]>(() => (data?.data ?? []).map((row: RawRow) => {
    switch (kind) {
      case 'customer': {
        const item = row as CustomerReferenceDto;
        return { id: item.id, code: item.customerCode, name: item.customerName, branchCode: item.branchCode, meta1: item.city, meta2: item.phone1, lastSyncDate: item.lastSyncDate };
      }
      case 'stock': {
        const item = row as StockReferenceDto;
        return { id: item.id, code: item.erpStockCode, name: item.stockName, branchCode: item.branchCode, meta1: item.unit, meta2: item.grupAdi || item.grupKodu, lastSyncDate: item.lastSyncDate };
      }
      case 'warehouse': {
        const item = row as WarehouseReferenceDto;
        return { id: item.id, code: item.warehouseCode, name: item.warehouseName, branchCode: item.branchCode };
      }
      case 'yapkod': {
        const item = row as YapKodReferenceDto;
        return { id: item.id, code: item.yapKod, name: item.yapAcik, branchCode: item.branchCode, meta1: item.yplndrStokKod, lastSyncDate: item.lastSyncDate };
      }
    }
  }), [data?.data, kind]);

  const exportColumns = useMemo(
    () => orderedVisibleColumns.map((key) => ({ key, label: config.columns.find((column) => column.key === key)?.label ?? key })),
    [config.columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => rows.map((item) => ({
    code: item.code,
    name: item.name,
    branchCode: item.branchCode,
    meta1: item.meta1,
    meta2: item.meta2,
    lastSyncDate: formatDate(item.lastSyncDate),
  })), [rows]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const visibleColumnKeys = orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[];
  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => columnKey !== pagedGrid.sortBy ? null : pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;

  return (
    <>
      <OpsListPageShell
        title={config.title}
        description={config.description}
      >
        <PagedDataGrid<Row, ColumnKey>
          variant="ops"
          pageKey={config.pageKey}
          columns={config.columns}
          visibleColumnKeys={visibleColumnKeys}
          defaultColumnWidths={config.defaultColumnWidths}
          columnWidths={columnWidths}
          onResizeColumnPair={resizeColumnPair}
          getCellText={config.getCellText}
          rows={rows}
          rowKey={(row) => row.id}
          renderCell={config.renderCell}
          showActionsColumn={showActionsColumn}
          actionsHeaderLabel={t('common.actions')}
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={kind === 'stock' ? (row) => (
            <div className="wms-ops-row-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                title={t('common.view')}
                aria-label={t('common.view')}
                onClick={() => setSelectedStockId(row.id)}
              >
                <Eye className="size-3" aria-hidden />
              </Button>
            </div>
          ) : undefined}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'actions') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={config.errorKey}
          emptyText={t('common.noData')}
          pageSize={data?.pageSize ?? pagedGrid.pageSize}
          pageSizeOptions={pagedGrid.pageSizeOptions}
          onPageSizeChange={pagedGrid.handlePageSizeChange}
          pageNumber={pagedGrid.getDisplayPageNumber(data)}
          totalPages={Math.max(data?.totalPages ?? 1, 1)}
          hasPreviousPage={Boolean(data?.hasPreviousPage)}
          hasNextPage={Boolean(data?.hasNextPage)}
          onPreviousPage={pagedGrid.goToPreviousPage}
          onNextPage={pagedGrid.goToNextPage}
          previousLabel={t('common.previous')}
          nextLabel={t('common.next')}
          paginationInfoText={paginationInfoText}
          lockedColumnKeys={['code']}
          idColumnKey="code"
          actionBar={{
            pageKey: config.pageKey,
            userId,
            columns: config.columns.map(({ key, label }) => ({ key, label })),
            visibleColumns,
            columnOrder,
            onVisibleColumnsChange: setVisibleColumns,
            onColumnOrderChange: setColumnOrder,
            lockedKeys: ['code'],
            exportFileName: config.pageKey,
            exportColumns,
            exportRows,
            filterColumns: config.filterColumns,
            defaultFilterColumn: 'code',
            draftFilterRows: pagedGrid.draftFilterRows,
            onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
            filterLogic: pagedGrid.filterLogic,
            onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters,
            onClearFilters: pagedGrid.clearAdvancedFilters,
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            variant: 'ops',
            search: {
              value: pagedGrid.searchInput,
              onValueChange: pagedGrid.searchConfig.onValueChange,
              onSearchChange: pagedGrid.searchConfig.onSearchChange,
              placeholder: t('common.search'),
            },
            refresh: {
              onRefresh: () => void refetch(),
              isLoading,
              label: t('common.refresh', { defaultValue: 'Missing translation' }),
            },
            leftSlot: (
              <VoiceSearchButton
                onResult={pagedGrid.handleVoiceSearch}
                size="icon"
                variant="ghost"
                className="wms-ops-voice-btn"
              />
            ),
          }}
        />
      </OpsListPageShell>

      {kind === 'stock' ? (
        <StockMirrorDetailDialog
          stockId={selectedStockId}
          open={selectedStockId !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setSelectedStockId(null);
          }}
        />
      ) : null}
    </>
  );
}

export function CustomerReferencePage(): ReactElement {
  return <ErpReferenceListPage kind="customer" />;
}

export function StockReferencePage(): ReactElement {
  return <ErpReferenceListPage kind="stock" />;
}

export function WarehouseReferencePage(): ReactElement {
  return <ErpReferenceListPage kind="warehouse" />;
}

export function YapKodReferencePage(): ReactElement {
  return <ErpReferenceListPage kind="yapkod" />;
}
