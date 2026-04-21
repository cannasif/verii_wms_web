import { type ReactElement, useEffect, useMemo } from 'react';
import { ArrowDown, ArrowUp, Edit, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import type { ServiceCaseRow } from '../types/service-allocation.types';
import { useServiceCasesQuery } from '../hooks/useServiceCasesQuery';
import { renderServiceCaseStatus } from '../utils/service-allocation-display';

type ColumnKey =
  | 'caseNo'
  | 'customerCode'
  | 'incomingStockCode'
  | 'incomingSerialNo'
  | 'status'
  | 'receivedAt'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'caseNo', type: 'string', labelKey: 'serviceAllocation.caseNo' },
  { value: 'customerCode', type: 'string', labelKey: 'serviceAllocation.customerCode' },
  { value: 'incomingStockCode', type: 'string', labelKey: 'serviceAllocation.stockCode' },
  { value: 'incomingSerialNo', type: 'string', labelKey: 'serviceAllocation.serialNo' },
  { value: 'status', type: 'number', labelKey: 'serviceAllocation.status' },
  { value: 'receivedAt', type: 'date', labelKey: 'serviceAllocation.receivedAt' },
];

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'caseNo':
      return 'CaseNo';
    case 'customerCode':
      return 'CustomerCode';
    case 'incomingStockCode':
      return 'IncomingStockCode';
    case 'incomingSerialNo':
      return 'IncomingSerialNo';
    case 'status':
      return 'Status';
    case 'receivedAt':
      return 'ReceivedAt';
    default:
      return 'Id';
  }
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

export function ServiceCaseListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.service-allocation');

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey: 'service-allocation-case-list',
    defaultSortBy: 'receivedAt',
    defaultSortDirection: 'desc',
    defaultPageNumber: 1,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('serviceAllocation.caseList.title', { defaultValue: 'Service Cases' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(
    () => [
      { key: 'caseNo', label: t('serviceAllocation.caseNo', { defaultValue: 'Case No' }) },
      { key: 'customerCode', label: t('serviceAllocation.customerCode', { defaultValue: 'Customer' }) },
      { key: 'incomingStockCode', label: t('serviceAllocation.stockCode', { defaultValue: 'Incoming Stock' }) },
      { key: 'incomingSerialNo', label: t('serviceAllocation.serialNo', { defaultValue: 'Serial No' }) },
      { key: 'status', label: t('serviceAllocation.status', { defaultValue: 'Status' }) },
      { key: 'receivedAt', label: t('serviceAllocation.receivedAt', { defaultValue: 'Received' }) },
      { key: 'actions', label: t('common.actions', { defaultValue: 'Actions' }), sortable: false },
    ],
    [t],
  );

  const { data, isLoading, isFetching, error, refetch } = useServiceCasesQuery(pagedGrid.queryParams);
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
          <CardTitle>{t('serviceAllocation.caseList.title', { defaultValue: 'Service Cases' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<ServiceCaseRow, ColumnKey>
            pageKey="service-allocation-case-list"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'caseNo':
                  return <span className="font-medium">{row.caseNo}</span>;
                case 'customerCode':
                  return row.customerCode;
                case 'incomingStockCode':
                  return row.incomingStockCode || '-';
                case 'incomingSerialNo':
                  return row.incomingSerialNo || '-';
                case 'status':
                  return renderServiceCaseStatus(row.status);
                case 'receivedAt':
                  return formatDate(row.receivedAt);
                case 'actions':
                default:
                  return null;
              }
            }}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={(columnKey) => {
              if (columnKey === 'actions') return;
              pagedGrid.handleSort(columnKey);
            }}
            renderSortIcon={renderSortIcon}
            isLoading={isLoading}
            isError={Boolean(error)}
            errorText={t('serviceAllocation.caseList.error', { defaultValue: 'Service cases could not be loaded.' })}
            emptyText={t('serviceAllocation.caseList.empty', { defaultValue: 'No service cases found.' })}
            rowClassName="cursor-pointer"
            onRowClick={(row) => navigate(`/service-allocation/cases/${row.id}`)}
            showActionsColumn
            actionsHeaderLabel={t('common.actions', { defaultValue: 'Actions' })}
            renderActionsCell={(row) => (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/service-allocation/cases/${row.id}`)}>
                  <Eye className="size-4" />
                </Button>
                {permission.canUpdate ? (
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/service-allocation/cases/${row.id}/edit`)}>
                    <Edit className="size-4" />
                  </Button>
                ) : null}
              </div>
            )}
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
            defaultFilterColumn="caseNo"
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
              placeholder: t('serviceAllocation.caseList.search', { defaultValue: 'Search service cases...' }),
            }}
            leftSlot={permission.canCreate ? (
              <Button onClick={() => navigate('/service-allocation/cases/new')}>
                <Plus className="mr-2 size-4" />
                {t('serviceAllocation.createCase', { defaultValue: 'Create Service Case' })}
              </Button>
            ) : undefined}
            refresh={{
              onRefresh: () => {
                void refetch();
              },
              isLoading: isFetching,
              label: t('common.refresh', { defaultValue: 'Refresh' }),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
