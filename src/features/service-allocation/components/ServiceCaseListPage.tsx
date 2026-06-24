import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { OpsActionButton, OpsListPageShell, OpsServiceEyebrow, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
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
  const { t } = useTranslation(['service-allocation', 'common']);
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.service-allocation');
  const pageKey = 'service-allocation-case-list';
  const [itemToDelete, setItemToDelete] = useState<ServiceCaseRow | null>(null);

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'receivedAt',
    defaultSortDirection: 'desc',
    defaultPageNumber: 1,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('serviceAllocation.caseList.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(
    () => [
      { key: 'caseNo', label: t('serviceAllocation.caseNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'customerCode', label: t('serviceAllocation.customerCode'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'incomingStockCode', label: t('serviceAllocation.stockCode'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'incomingSerialNo', label: t('serviceAllocation.serialNo'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'status', label: t('serviceAllocation.status'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'receivedAt', label: t('serviceAllocation.receivedAt'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'actions', label: t('common.actions'), sortable: false, headClassName: 'wms-ops-table-actions-col', cellClassName: 'wms-ops-table-actions-col' },
    ],
    [t],
  );

  const { data, isLoading, isFetching, error, refetch } = useServiceCasesQuery(pagedGrid.queryParams);
  const rows = data?.data ?? [];
  const showActionsColumn = permission.canView || permission.canUpdate || permission.canDelete;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => serviceAllocationApi.deleteServiceCase(id),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('common.deleteError'));
      }
      toast.success(t('common.deleteSuccess'));
      setItemToDelete(null);
      await refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('common.deleteError'));
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
  });

  return (
    <>
      <OpsListPageShell
        eyebrow={<OpsServiceEyebrow module={t('serviceAllocation.breadcrumb.module')} />}
        title={t('serviceAllocation.caseList.title')}
        description={t('serviceAllocation.caseList.subtitle')}
        actions={
          permission.canCreate ? (
            <OpsActionButton type="button" variant="primary" onClick={() => navigate('/service-allocation/cases/new')}>
              <Plus className="size-3.5" aria-hidden />
              {t('serviceAllocation.createCase')}
            </OpsActionButton>
          ) : null
        }
      >
        <PagedDataGrid<ServiceCaseRow, ColumnKey>
          variant="ops"
          pageKey={pageKey}
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          renderCell={(row, columnKey) => {
            switch (columnKey) {
              case 'caseNo':
                return <span className="font-medium font-mono text-xs">{row.caseNo}</span>;
              case 'customerCode':
                return row.customerCode;
              case 'incomingStockCode':
                return row.incomingStockCode || '-';
              case 'incomingSerialNo':
                return row.incomingSerialNo || '-';
              case 'status':
                return renderServiceCaseStatus(row.status);
              case 'receivedAt':
                return <span className="font-mono text-xs">{formatDate(row.receivedAt)}</span>;
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
          errorText={t('serviceAllocation.caseList.error')}
          emptyText={t('serviceAllocation.caseList.empty')}
          showActionsColumn={showActionsColumn}
          actionsHeaderLabel={t('common.actions')}
          iconOnlyActions
          actionsCellClassName="wms-ops-table-actions-col"
          renderActionsCell={(row) => (
            <div className="wms-ops-row-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="wms-ops-grid-icon-btn"
                aria-label={t('common.view')}
                title={t('common.view')}
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/service-allocation/cases/${row.id}`);
                }}
                disabled={!permission.canView}
              >
                <Eye className="size-3" aria-hidden />
              </Button>
              {permission.canUpdate ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn"
                  aria-label={t('common.edit')}
                  title={t('common.edit')}
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/service-allocation/cases/${row.id}/edit`);
                  }}
                >
                  <Edit className="size-3" aria-hidden />
                </Button>
              ) : null}
              {permission.canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
                  aria-label={t('common.delete')}
                  title={t('common.delete')}
                  onClick={(event) => {
                    event.stopPropagation();
                    setItemToDelete(row);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="size-3" aria-hidden />
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
            ...pagedGrid.searchConfig,
            placeholder: t('serviceAllocation.caseList.search'),
          }}
          refresh={{
            onRefresh: () => {
              void refetch();
            },
            isLoading: isFetching,
            label: t('common.refresh'),
          }}
        />
      </OpsListPageShell>

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
    </>
  );
}
