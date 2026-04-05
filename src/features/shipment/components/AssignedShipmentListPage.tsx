import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { useAssignedShipmentHeaders } from '../hooks/useAssignedShipmentHeaders';
import { ShipmentDetailDialog } from './ShipmentDetailDialog';
import type { ShipmentHeader } from '../types/shipment';

type AssignedShipmentColumnKey =
  | 'id'
  | 'documentNo'
  | 'documentDate'
  | 'customerCode'
  | 'customerName'
  | 'sourceWarehouse'
  | 'targetWarehouse'
  | 'documentType'
  | 'status'
  | 'createdDate'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'shipment.list.documentNo' },
  { value: 'customerCode', type: 'string', labelKey: 'shipment.list.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'shipment.list.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'shipment.list.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'shipment.list.targetWarehouse' },
  { value: 'documentType', type: 'string', labelKey: 'shipment.list.documentType' },
  { value: 'isCompleted', type: 'boolean', labelKey: 'shipment.list.status' },
];

function mapSortBy(value: AssignedShipmentColumnKey): string {
  switch (value) {
    case 'documentNo':
      return 'DocumentNo';
    case 'documentDate':
      return 'DocumentDate';
    case 'customerCode':
      return 'CustomerCode';
    case 'customerName':
      return 'CustomerName';
    case 'sourceWarehouse':
      return 'SourceWarehouse';
    case 'targetWarehouse':
      return 'TargetWarehouse';
    case 'documentType':
      return 'DocumentType';
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

export function AssignedShipmentListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const pageKey = 'shipment-assigned-list';
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);

  const pagedGrid = usePagedDataGrid<AssignedShipmentColumnKey>({
    pageKey,
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<AssignedShipmentColumnKey>[]>(
    () => [
      { key: 'id', label: t('shipment.list.id') },
      { key: 'documentNo', label: t('shipment.list.documentNo') },
      { key: 'documentDate', label: t('shipment.list.documentDate') },
      { key: 'customerCode', label: t('shipment.list.customerCode') },
      { key: 'customerName', label: t('shipment.list.customerName') },
      { key: 'sourceWarehouse', label: t('shipment.list.sourceWarehouse') },
      { key: 'targetWarehouse', label: t('shipment.list.targetWarehouse') },
      { key: 'documentType', label: t('shipment.list.documentType') },
      { key: 'status', label: t('shipment.list.status'), sortable: false },
      { key: 'createdDate', label: t('shipment.list.createdDate') },
      { key: 'actions', label: t('common.actions'), sortable: false },
    ],
    [t],
  );

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
  });

  const { data, isLoading, error } = useAssignedShipmentHeaders(pagedGrid.queryParams);

  useEffect(() => {
    setPageTitle(t('shipment.assignedList.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const exportColumns = useMemo(
    () => orderedVisibleColumns
      .filter((key) => key !== 'actions')
      .map((key) => ({
        key,
        label: columns.find((column) => column.key === key)?.label ?? key,
      })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    return (data?.data ?? []).map((item) => ({
      id: item.id,
      documentNo: item.documentNo || '-',
      documentDate: formatDate(item.documentDate),
      customerCode: item.customerCode || '-',
      customerName: item.customerName || '-',
      sourceWarehouse: item.sourceWarehouse || '-',
      targetWarehouse: item.targetWarehouse || '-',
      documentType: item.documentType || '-',
      status: item.isCompleted
        ? t('shipment.list.completed')
        : item.isPendingApproval
          ? t('shipment.list.pendingApproval')
          : t('shipment.list.inProgress'),
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
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as AssignedShipmentColumnKey[],
    [orderedVisibleColumns],
  );

  const renderSortIcon = (columnKey: AssignedShipmentColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-6 crm-page">
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/3">
        <PagedDataGrid<ShipmentHeader, AssignedShipmentColumnKey>
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case 'id':
                return item.id;
              case 'documentNo':
                return <span className="font-medium">{item.documentNo || '-'}</span>;
              case 'documentDate':
                return formatDate(item.documentDate);
              case 'customerCode':
                return item.customerCode || '-';
              case 'customerName':
                return item.customerName || '-';
              case 'sourceWarehouse':
                return item.sourceWarehouse || '-';
              case 'targetWarehouse':
                return item.targetWarehouse || '-';
              case 'documentType':
                return <Badge variant="outline">{item.documentType || '-'}</Badge>;
              case 'status':
                return item.isCompleted ? (
                  <Badge variant="default" className="w-fit">{t('shipment.list.completed')}</Badge>
                ) : item.isPendingApproval ? (
                  <Badge variant="secondary" className="w-fit">{t('shipment.list.pendingApproval')}</Badge>
                ) : (
                  <Badge variant="outline" className="w-fit">{t('shipment.list.inProgress')}</Badge>
                );
              case 'createdDate':
                return formatDateTime(item.createdDate);
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
          errorText={t('shipment.assignedList.error')}
          emptyText={t('shipment.assignedList.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions')}
          actionsHeaderLabel={t('common.actions')}
          renderActionsCell={(item) => (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedHeaderId(item.id)}>
                {t('shipment.list.viewDetails')}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={() => navigate(`/shipment/collection/${item.id}`)}
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
            defaultFilterColumn: 'documentNo',
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
              placeholder: t('shipment.assignedList.searchPlaceholder'),
            },
            leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
          }}
        />
      </div>

      {selectedHeaderId && (
        <ShipmentDetailDialog
          headerId={selectedHeaderId}
          isOpen={selectedHeaderId != null}
          onClose={() => setSelectedHeaderId(null)}
        />
      )}
    </div>
  );
}
