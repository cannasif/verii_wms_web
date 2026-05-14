import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import type { ServiceCaseRow } from '../types/service-allocation.types';
import { useServiceCasesQuery } from '../hooks/useServiceCasesQuery';
import { renderServiceCaseStatus } from '../utils/service-allocation-display';
import { serviceAllocationApi } from '../api/service-allocation.api';

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
  const [itemToDelete, setItemToDelete] = useState<ServiceCaseRow | null>(null);

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey: 'service-allocation-case-list',
    defaultSortBy: 'receivedAt',
    defaultSortDirection: 'desc',
    defaultPageNumber: 1,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('serviceAllocation.caseList.title', { defaultValue: 'Missing translation' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(
    () => [
      { key: 'caseNo', label: t('serviceAllocation.caseNo', { defaultValue: 'Missing translation' }) },
      { key: 'customerCode', label: t('serviceAllocation.customerCode', { defaultValue: 'Missing translation' }) },
      { key: 'incomingStockCode', label: t('serviceAllocation.stockCode', { defaultValue: 'Missing translation' }) },
      { key: 'incomingSerialNo', label: t('serviceAllocation.serialNo', { defaultValue: 'Missing translation' }) },
      { key: 'status', label: t('serviceAllocation.status', { defaultValue: 'Missing translation' }) },
      { key: 'receivedAt', label: t('serviceAllocation.receivedAt', { defaultValue: 'Missing translation' }) },
      { key: 'actions', label: t('common.actions', { defaultValue: 'Missing translation' }), sortable: false },
    ],
    [t],
  );

  const { data, isLoading, isFetching, error, refetch } = useServiceCasesQuery(pagedGrid.queryParams);
  const rows = data?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => serviceAllocationApi.deleteServiceCase(id),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('common.deleteError', { defaultValue: 'Kayıt silinemedi.' }));
      }
      toast.success(t('common.deleteSuccess', { defaultValue: 'Kayıt silindi.' }));
      setItemToDelete(null);
      await refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('common.deleteError', { defaultValue: 'Kayıt silinemedi.' }));
    },
  });

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
          <CardTitle>{t('serviceAllocation.caseList.title', { defaultValue: 'Missing translation' })}</CardTitle>
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
            errorText={t('serviceAllocation.caseList.error', { defaultValue: 'Missing translation' })}
            emptyText={t('serviceAllocation.caseList.empty', { defaultValue: 'Missing translation' })}
            rowClassName="cursor-pointer"
            onRowClick={(row) => navigate(`/service-allocation/cases/${row.id}`)}
            showActionsColumn={permission.canView || permission.canUpdate || permission.canDelete}
            actionsHeaderLabel={t('common.actions', { defaultValue: 'Missing translation' })}
            renderActionsCell={(row) => (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/service-allocation/cases/${row.id}`);
                }} disabled={!permission.canView}>
                  <Eye className="size-4" />
                </Button>
                {permission.canUpdate ? (
                  <Button variant="ghost" size="sm" onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/service-allocation/cases/${row.id}/edit`);
                  }}>
                    <Edit className="size-4" />
                  </Button>
                ) : null}
                {permission.canDelete ? (
                  <Button variant="destructive" size="sm" onClick={(event) => {
                    event.stopPropagation();
                    setItemToDelete(row);
                  }} disabled={deleteMutation.isPending}>
                    <Trash2 className="size-4" />
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
              placeholder: t('serviceAllocation.caseList.search', { defaultValue: 'Missing translation' }),
            }}
            leftSlot={permission.canCreate ? (
              <Button onClick={() => navigate('/service-allocation/cases/new')}>
                <Plus className="mr-2 size-4" />
                {t('serviceAllocation.createCase', { defaultValue: 'Missing translation' })}
              </Button>
            ) : undefined}
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

      <DeleteConfirmDialog
        open={itemToDelete != null}
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null);
        }}
        itemLabel={itemToDelete?.caseNo || (itemToDelete ? `#${itemToDelete.id}` : undefined)}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
        }}
      />
    </div>
  );
}
