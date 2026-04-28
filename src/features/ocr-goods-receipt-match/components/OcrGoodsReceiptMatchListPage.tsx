import { type ReactElement, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { ocrGoodsReceiptMatchApi } from '../api/ocr-goods-receipt-match.api';
import type { OcrGoodsReceiptCustomerStockMatchPagedRowDto } from '../types/ocr-goods-receipt-match.types';

type ColumnKey =
  | 'customer'
  | 'customerStockCode'
  | 'customerStockName'
  | 'customerBarcode'
  | 'ourStockCode'
  | 'ourStockName'
  | 'unit'
  | 'isActive'
  | 'description'
  | 'actions';

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'customer':
      return 'CustomerId';
    case 'customerStockCode':
      return 'CustomerStockCode';
    case 'customerStockName':
      return 'CustomerStockName';
    case 'customerBarcode':
      return 'CustomerBarcode';
    case 'ourStockCode':
      return 'OurStockCode';
    case 'ourStockName':
      return 'OurStockName';
    case 'unit':
      return 'Unit';
    case 'isActive':
      return 'IsActive';
    case 'description':
      return 'Description';
    default:
      return 'Id';
  }
}

function buildCustomerLabel(row: OcrGoodsReceiptCustomerStockMatchPagedRowDto): string {
  return [row.customerCode, row.customerName].filter(Boolean).join(' - ') || '-';
}

export function OcrGoodsReceiptMatchListPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const navigate = useNavigate();
  const pageKey = 'ocr-goods-receipt-match-list';

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'customerStockCode',
    defaultSortDirection: 'asc',
    defaultPageNumber: 1,
    defaultPageSize: 20,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('ocrGoodsReceiptMatch.list.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'customer', label: t('ocrGoodsReceiptMatch.list.columns.customer') },
    { key: 'customerStockCode', label: t('ocrGoodsReceiptMatch.list.columns.customerStockCode') },
    { key: 'customerStockName', label: t('ocrGoodsReceiptMatch.list.columns.customerStockName') },
    { key: 'customerBarcode', label: t('ocrGoodsReceiptMatch.list.columns.customerBarcode') },
    { key: 'ourStockCode', label: t('ocrGoodsReceiptMatch.list.columns.ourStockCode') },
    { key: 'ourStockName', label: t('ocrGoodsReceiptMatch.list.columns.ourStockName') },
    { key: 'unit', label: t('ocrGoodsReceiptMatch.list.columns.unit') },
    { key: 'isActive', label: t('ocrGoodsReceiptMatch.list.columns.isActive') },
    { key: 'description', label: t('ocrGoodsReceiptMatch.list.columns.description') },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'customerStockCode',
  });

  const query = useQuery({
    queryKey: ['ocr-goods-receipt-match', 'list', pagedGrid.queryParams],
    queryFn: () => ocrGoodsReceiptMatchApi.getPaged(pagedGrid.queryParams),
  });

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[],
    [orderedVisibleColumns],
  );

  const exportColumns = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({
      key,
      label: columns.find((column) => column.key === key)?.label ?? key,
    })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => (
    (query.data?.data ?? []).map((row) => ({
      customer: buildCustomerLabel(row),
      customerStockCode: row.customerStockCode,
      customerStockName: row.customerStockName || '-',
      customerBarcode: row.customerBarcode || '-',
      ourStockCode: row.ourStockCode,
      ourStockName: row.ourStockName,
      unit: row.unit || '-',
      isActive: row.isActive ? t('ocrGoodsReceiptMatch.options.active') : t('ocrGoodsReceiptMatch.options.passive'),
      description: row.description || '-',
    }))
  ), [query.data?.data, t]);

  const range = getPagedRange(query.data, 1);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="crm-page space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="secondary">{t('ocrGoodsReceiptMatch.badge')}</Badge>
        <Button type="button" onClick={() => navigate('/ocr-goods-receipt-match')}>
          {t('common.add')}
        </Button>
      </div>

      <PagedDataGrid<OcrGoodsReceiptCustomerStockMatchPagedRowDto, ColumnKey>
        pageKey={pageKey}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={query.data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'customer':
              return buildCustomerLabel(row);
            case 'customerStockCode':
              return <span className="font-medium">{row.customerStockCode}</span>;
            case 'customerStockName':
              return row.customerStockName || '-';
            case 'customerBarcode':
              return row.customerBarcode || '-';
            case 'ourStockCode':
              return row.ourStockCode;
            case 'ourStockName':
              return row.ourStockName;
            case 'unit':
              return row.unit || '-';
            case 'isActive':
              return row.isActive ? t('ocrGoodsReceiptMatch.options.active') : t('ocrGoodsReceiptMatch.options.passive');
            case 'description':
              return row.description || '-';
            default:
              return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={(columnKey) => {
          if (columnKey !== 'actions') pagedGrid.handleSort(columnKey);
        }}
        renderSortIcon={renderSortIcon}
        isLoading={query.isLoading}
        isError={Boolean(query.error)}
        errorText={query.error instanceof Error ? query.error.message : t('common.generalError')}
        emptyText={t('ocrGoodsReceiptMatch.list.empty')}
        showActionsColumn={orderedVisibleColumns.includes('actions')}
        actionsHeaderLabel={t('common.actions')}
        renderActionsCell={(row) => (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => navigate(`/ocr-goods-receipt-match?id=${row.id}`)}>
              {t('common.update')}
            </Button>
          </div>
        )}
        pageSize={query.data?.pageSize ?? pagedGrid.pageSize}
        pageSizeOptions={pagedGrid.pageSizeOptions}
        onPageSizeChange={pagedGrid.handlePageSizeChange}
        pageNumber={pagedGrid.getDisplayPageNumber(query.data)}
        totalPages={Math.max(query.data?.totalPages ?? 1, 1)}
        hasPreviousPage={Boolean(query.data?.hasPreviousPage)}
        hasNextPage={Boolean(query.data?.hasNextPage)}
        onPreviousPage={pagedGrid.goToPreviousPage}
        onNextPage={pagedGrid.goToNextPage}
        previousLabel={t('common.previous')}
        nextLabel={t('common.next')}
        paginationInfoText={paginationInfoText}
        actionBar={{
          pageKey,
          userId,
          columns: columns.map(({ key, label }) => ({ key, label })),
          visibleColumns,
          columnOrder,
          onVisibleColumnsChange: setVisibleColumns,
          onColumnOrderChange: setColumnOrder,
          exportFileName: 'ocr-goods-receipt-match-list',
          exportColumns,
          exportRows,
          filterColumns: [],
          defaultFilterColumn: '',
          draftFilterRows: [],
          onDraftFilterRowsChange: () => undefined,
          filterLogic: 'and',
          onFilterLogicChange: () => undefined,
          onApplyFilters: () => undefined,
          onClearFilters: () => undefined,
          appliedFilterCount: 0,
          search: {
            value: pagedGrid.searchInput,
            onValueChange: pagedGrid.searchConfig.onValueChange,
            onSearchChange: pagedGrid.searchConfig.onSearchChange,
            placeholder: t('ocrGoodsReceiptMatch.list.searchPlaceholder'),
          },
          refresh: {
            onRefresh: () => {
              void query.refetch();
            },
            isLoading: query.isLoading,
            label: t('common.refresh'),
          }
        }}
      />
    </div>
  );
}
