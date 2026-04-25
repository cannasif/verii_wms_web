import { type ReactElement, useEffect, useMemo } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import type { AllocationQueueRow } from '../types/service-allocation.types';
import { useAllocationQueueQuery } from '../hooks/useAllocationQueueQuery';
import { renderAllocationStatus } from '../utils/service-allocation-display';

type ColumnKey =
  | 'stockCode'
  | 'erpOrderNo'
  | 'erpOrderId'
  | 'customerCode'
  | 'requestedQuantity'
  | 'allocatedQuantity'
  | 'priorityNo'
  | 'status';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'stockCode', type: 'string', labelKey: 'serviceAllocation.stockCode' },
  { value: 'erpOrderNo', type: 'string', labelKey: 'serviceAllocation.erpOrderNo' },
  { value: 'erpOrderId', type: 'string', labelKey: 'serviceAllocation.erpOrderId' },
  { value: 'customerCode', type: 'string', labelKey: 'serviceAllocation.customerCode' },
  { value: 'priorityNo', type: 'number', labelKey: 'serviceAllocation.priority' },
  { value: 'status', type: 'number', labelKey: 'serviceAllocation.status' },
];

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'stockCode':
      return 'StockCode';
    case 'erpOrderNo':
      return 'ErpOrderNo';
    case 'erpOrderId':
      return 'ErpOrderId';
    case 'customerCode':
      return 'CustomerCode';
    case 'requestedQuantity':
      return 'RequestedQuantity';
    case 'allocatedQuantity':
      return 'AllocatedQuantity';
    case 'priorityNo':
      return 'PriorityNo';
    case 'status':
      return 'Status';
    default:
      return 'Id';
  }
}

export function AllocationQueuePage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey: 'service-allocation-queue',
    defaultSortBy: 'priorityNo',
    defaultSortDirection: 'asc',
    defaultPageNumber: 1,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('serviceAllocation.allocationQueue.title', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(
    () => [
      { key: 'stockCode', label: t('serviceAllocation.stockCode', { defaultValue: 'Missing translation' }) },
      { key: 'erpOrderNo', label: t('serviceAllocation.erpOrderNo', { defaultValue: 'Missing translation' }) },
      { key: 'erpOrderId', label: t('serviceAllocation.erpOrderId', { defaultValue: 'Missing translation' }) },
      { key: 'customerCode', label: t('serviceAllocation.customerCode', { defaultValue: 'Missing translation' }) },
      { key: 'requestedQuantity', label: t('serviceAllocation.quantity', { defaultValue: 'Missing translation' }) },
      { key: 'allocatedQuantity', label: t('serviceAllocation.allocatedQuantity', { defaultValue: 'Missing translation' }) },
      { key: 'priorityNo', label: t('serviceAllocation.priority', { defaultValue: 'Missing translation' }) },
      { key: 'status', label: t('serviceAllocation.status', { defaultValue: 'Missing translation' }) },
    ],
    [t],
  );

  const { data, isLoading, isFetching, error, refetch } = useAllocationQueueQuery(pagedGrid.queryParams);
  const rows = data?.data ?? [];

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const range = getPagedRange(data, 1);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  return (
    <div className="crm-page space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('serviceAllocation.allocationQueue.title', { defaultValue: 'Missing translation' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<AllocationQueueRow, ColumnKey>
            pageKey="service-allocation-queue"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'stockCode':
                  return <span className="font-medium">{row.stockCode}</span>;
                case 'erpOrderNo':
                  return row.erpOrderNo;
                case 'erpOrderId':
                  return row.erpOrderId;
                case 'customerCode':
                  return row.customerCode;
                case 'requestedQuantity':
                  return row.requestedQuantity;
                case 'allocatedQuantity':
                  return row.allocatedQuantity;
                case 'priorityNo':
                  return row.priorityNo;
                case 'status':
                  return renderAllocationStatus(row.status);
                default:
                  return null;
              }
            }}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            renderSortIcon={renderSortIcon}
            isLoading={isLoading}
            isError={Boolean(error)}
            errorText={t('serviceAllocation.allocationQueue.error', { defaultValue: 'Missing translation' })}
            emptyText={t('serviceAllocation.allocationQueue.empty', { defaultValue: 'Missing translation' })}
            pageSize={pagedGrid.pageSize}
            pageSizeOptions={pagedGrid.pageSizeOptions}
            onPageSizeChange={pagedGrid.handlePageSizeChange}
            pageNumber={pagedGrid.getDisplayPageNumber(data)}
            totalPages={data?.totalPages ?? 1}
            hasPreviousPage={data?.hasPreviousPage ?? false}
            hasNextPage={data?.hasNextPage ?? false}
            onPreviousPage={pagedGrid.goToPreviousPage}
            onNextPage={pagedGrid.goToNextPage}
            previousLabel={t('common.previous')}
            nextLabel={t('common.next')}
            paginationInfoText={paginationInfoText}
            filterColumns={advancedFilterColumns}
            defaultFilterColumn="stockCode"
            draftFilterRows={pagedGrid.draftFilterRows}
            onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
            filterLogic={pagedGrid.filterLogic}
            onFilterLogicChange={pagedGrid.setFilterLogic}
            onApplyFilters={pagedGrid.applyAdvancedFilters}
            onClearFilters={pagedGrid.clearAdvancedFilters}
            appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
            search={{
              value: pagedGrid.searchInput,
              onValueChange: pagedGrid.searchConfig.onValueChange,
              onSearchChange: pagedGrid.searchConfig.onSearchChange,
              placeholder: t('serviceAllocation.allocationQueue.search', { defaultValue: 'Missing translation' }),
            }}
            refresh={{
              onRefresh: () => {
                void refetch();
              },
              isLoading: isFetching,
              label: t('common.refresh', { defaultValue: 'Missing translation' }),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
