import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTableGrid, type DataTableGridColumn } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { useAssignedGrHeaders } from '../hooks/useAssignedGrHeaders';
import { GoodsReceiptDetailDialog } from './GoodsReceiptDetailDialog';
import type { GrHeader } from '../types/goods-receipt';

type AssignedGrColumnKey =
  | 'id'
  | 'orderId'
  | 'customerCode'
  | 'projectCode'
  | 'documentType'
  | 'plannedDate'
  | 'status'
  | 'createdDate'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'orderId', type: 'string', labelKey: 'goodsReceipt.report.orderId' },
  { value: 'customerCode', type: 'string', labelKey: 'goodsReceipt.report.customerCode' },
  { value: 'projectCode', type: 'string', labelKey: 'goodsReceipt.report.projectCode' },
  { value: 'documentType', type: 'string', labelKey: 'goodsReceipt.report.documentType' },
  { value: 'isCompleted', type: 'boolean', labelKey: 'goodsReceipt.report.status' },
];

function mapSortBy(value: AssignedGrColumnKey): string {
  switch (value) {
    case 'orderId':
      return 'OrderId';
    case 'customerCode':
      return 'CustomerCode';
    case 'projectCode':
      return 'ProjectCode';
    case 'documentType':
      return 'DocumentType';
    case 'plannedDate':
      return 'PlannedDate';
    case 'createdDate':
      return 'CreatedDate';
    case 'id':
    default:
      return 'Id';
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AssignedGrListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const pageKey = 'goods-receipt-assigned-list';
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);

  const pagedGrid = usePagedDataGrid<AssignedGrColumnKey>({
    pageKey,
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const columns = useMemo<DataTableGridColumn<AssignedGrColumnKey>[]>(() => [
    { key: 'id', label: t('goodsReceipt.report.id') },
    { key: 'orderId', label: t('goodsReceipt.report.orderId') },
    { key: 'customerCode', label: t('goodsReceipt.report.customerCode') },
    { key: 'projectCode', label: t('goodsReceipt.report.projectCode') },
    { key: 'documentType', label: t('goodsReceipt.report.documentType') },
    { key: 'plannedDate', label: t('goodsReceipt.report.plannedDate') },
    { key: 'status', label: t('goodsReceipt.report.status'), sortable: false },
    { key: 'createdDate', label: t('goodsReceipt.report.createdDate') },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
  });

  const { data, isLoading, error } = useAssignedGrHeaders(pagedGrid.queryParams);

  useEffect(() => {
    setPageTitle(t('goodsReceipt.assignedList.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const exportColumns = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({
      key,
      label: columns.find((column) => column.key === key)?.label ?? key,
    })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    return (data?.data ?? []).map((item) => ({
      id: item.id,
      orderId: item.orderId || '-',
      customerCode: item.customerCode || '-',
      projectCode: item.projectCode || '-',
      documentType: item.documentType || '-',
      plannedDate: formatDate(item.plannedDate),
      status: item.isCompleted
        ? t('goodsReceipt.report.completed')
        : item.isPendingApproval
          ? t('goodsReceipt.report.pendingApproval')
          : t('goodsReceipt.report.inProgress'),
      createdDate: formatDateTime(item.createdDate),
    }));
  }, [data?.data, t]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    count: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as AssignedGrColumnKey[],
    [orderedVisibleColumns],
  );

  const renderSortIcon = (columnKey: AssignedGrColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-6 crm-page">
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/3">
        <DataTableGrid<GrHeader, AssignedGrColumnKey>
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case 'id':
                return item.id;
              case 'orderId':
                return <span className="font-medium">{item.orderId || '-'}</span>;
              case 'customerCode':
                return item.customerCode || '-';
              case 'projectCode':
                return item.projectCode || '-';
              case 'documentType':
                return <Badge variant="outline">{item.documentType || '-'}</Badge>;
              case 'plannedDate':
                return formatDate(item.plannedDate);
              case 'status':
                return item.isCompleted ? (
                  <Badge variant="default" className="w-fit">{t('goodsReceipt.report.completed')}</Badge>
                ) : item.isPendingApproval ? (
                  <Badge variant="secondary" className="w-fit">{t('goodsReceipt.report.pendingApproval')}</Badge>
                ) : (
                  <Badge variant="outline" className="w-fit">{t('goodsReceipt.report.inProgress')}</Badge>
                );
              case 'createdDate':
                return formatDateTime(item.createdDate);
              case 'actions':
              default:
                return null;
            }
          }}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'status' || columnKey === 'actions') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('goodsReceipt.assignedList.error')}
          emptyText={t('goodsReceipt.assignedList.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions')}
          actionsHeaderLabel={t('common.actions')}
          renderActionsCell={(item) => (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedHeaderId(item.id)}>
                {t('goodsReceipt.report.viewDetails')}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={() => navigate(`/goods-receipt/collection/${item.id}`)}
              >
                {t('common.start')}
              </Button>
            </div>
          )}
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
          actionBar={{
            pageKey,
            userId,
            columns: columns.map(({ key, label }) => ({ key, label })),
            visibleColumns,
            columnOrder,
            onVisibleColumnsChange: setVisibleColumns,
            onColumnOrderChange: setColumnOrder,
            exportFileName: pageKey,
            exportColumns,
            exportRows,
            filterColumns: advancedFilterColumns,
            defaultFilterColumn: 'orderId',
            draftFilterRows: pagedGrid.draftFilterRows,
            onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
            filterLogic: pagedGrid.filterLogic,
            onFilterLogicChange: pagedGrid.setFilterLogic,
            onApplyFilters: pagedGrid.applyAdvancedFilters,
            onClearFilters: pagedGrid.clearAdvancedFilters,
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: {
              value: pagedGrid.searchInput,
              onValueChange: pagedGrid.searchConfig.onValueChange,
              onSearchChange: pagedGrid.searchConfig.onSearchChange,
              placeholder: t('goodsReceipt.assignedList.searchPlaceholder'),
            },
            leftSlot: (
              <VoiceSearchButton
                onResult={pagedGrid.handleVoiceSearch}
                size="sm"
                variant="outline"
              />
            ),
          }}
        />
      </div>

      {selectedHeaderId && (
        <GoodsReceiptDetailDialog
          grHeaderId={selectedHeaderId}
          isOpen={selectedHeaderId != null}
          onClose={() => setSelectedHeaderId(null)}
        />
      )}
    </div>
  );
}
