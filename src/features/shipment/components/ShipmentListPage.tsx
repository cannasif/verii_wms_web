import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { DataTableGrid, type DataTableGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useShipmentHeadersPaged } from '../hooks/useShipmentHeaders';
import type { ShipmentHeader } from '../types/shipment';
import { ShipmentDetailDialog } from './ShipmentDetailDialog';

type ShipmentColumnKey =
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
  { value: 'documentDate', type: 'date', labelKey: 'shipment.list.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'shipment.list.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'shipment.list.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'shipment.list.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'shipment.list.targetWarehouse' },
  { value: 'documentType', type: 'string', labelKey: 'shipment.list.documentType' },
  { value: 'isCompleted', type: 'boolean', labelKey: 'shipment.list.status' },
];

function mapSortBy(value: ShipmentColumnKey): string {
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
    default:
      return 'CreatedDate';
  }
}

export function ShipmentListPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);

  const pagedGrid = usePagedDataGrid<ShipmentColumnKey>({
    pageKey: 'shipment-list',
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('shipment.list.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<DataTableGridColumn<ShipmentColumnKey>[]>(
    () => [
      { key: 'documentNo', label: t('shipment.list.documentNo') },
      { key: 'documentDate', label: t('shipment.list.documentDate') },
      { key: 'customerCode', label: t('shipment.list.customerCode') },
      { key: 'customerName', label: t('shipment.list.customerName') },
      { key: 'sourceWarehouse', label: t('shipment.list.sourceWarehouse') },
      { key: 'targetWarehouse', label: t('shipment.list.targetWarehouse') },
      { key: 'documentType', label: t('shipment.list.documentType') },
      { key: 'status', label: t('shipment.list.status'), sortable: false },
      { key: 'createdDate', label: t('shipment.list.createdDate') },
      { key: 'actions', label: t('shipment.list.actions'), sortable: false },
    ],
    [t],
  );

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey: 'shipment-list',
    columns: columns.map(({ key, label }) => ({ key, label })),
  });

  const { data, isLoading, error } = useShipmentHeadersPaged(pagedGrid.queryParams);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = useCallback((item: ShipmentHeader): string => {
    if (item.isCompleted) return t('shipment.list.completed');
    if (item.isPendingApproval) return t('shipment.list.pendingApproval');
    return t('shipment.list.inProgress');
  }, [t]);

  const exportColumns = useMemo(
    () => orderedVisibleColumns
      .filter((key) => key !== 'actions')
      .map((key) => ({
        key,
        label: columns.find((column) => column.key === key)?.label ?? key,
      })),
    [columns, orderedVisibleColumns],
  );

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as ShipmentColumnKey[],
    [orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    if (!data?.data) return [];
    return data.data.map((item) => ({
      documentNo: item.documentNo || '-',
      documentDate: formatDate(item.documentDate),
      customerCode: item.customerCode || '-',
      customerName: item.customerName || '-',
      sourceWarehouse: item.sourceWarehouse || '-',
      targetWarehouse: item.targetWarehouse || '-',
      documentType: item.documentType || '-',
      status: getStatusLabel(item),
      createdDate: formatDateTime(item.createdDate),
    }));
  }, [data?.data, getStatusLabel]);

  const renderSortIcon = (columnKey: ShipmentColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    count: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  return (
    <div className="crm-page space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('shipment.list.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableGrid<ShipmentHeader, ShipmentColumnKey>
            columns={columns}
            visibleColumnKeys={visibleColumnKeys}
            rows={data?.data ?? []}
            rowKey={(row) => row.id}
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'documentNo':
                  return <span className="font-medium">{row.documentNo || '-'}</span>;
                case 'documentDate':
                  return formatDate(row.documentDate);
                case 'customerCode':
                  return row.customerCode || '-';
                case 'customerName':
                  return row.customerName || '-';
                case 'sourceWarehouse':
                  return row.sourceWarehouse || '-';
                case 'targetWarehouse':
                  return row.targetWarehouse || '-';
                case 'documentType':
                  return <Badge variant="outline">{row.documentType || '-'}</Badge>;
                case 'status':
                  return row.isCompleted ? (
                    <Badge variant="default" className="w-fit">{t('shipment.list.completed')}</Badge>
                  ) : row.isPendingApproval ? (
                    <Badge variant="secondary" className="w-fit">{t('shipment.list.pendingApproval')}</Badge>
                  ) : (
                    <Badge variant="outline" className="w-fit">{t('shipment.list.inProgress')}</Badge>
                  );
                case 'createdDate':
                  return formatDateTime(row.createdDate);
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
            errorText={t('shipment.list.error')}
            emptyText={t('shipment.list.noData')}
            rowClassName="cursor-pointer"
            onRowClick={(row) => setSelectedHeaderId(row.id)}
            showActionsColumn={orderedVisibleColumns.includes('actions')}
            actionsHeaderLabel={t('shipment.list.actions')}
            renderActionsCell={(row) => (
              <Button variant="ghost" size="sm" onClick={() => setSelectedHeaderId(row.id)}>
                <Eye className="size-4" />
                <span className="ml-2">{t('shipment.list.viewDetails')}</span>
              </Button>
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
            actionBar={{
              pageKey: 'shipment-list',
              userId,
              columns: columns.map(({ key, label }) => ({ key, label })),
              visibleColumns,
              columnOrder,
              onVisibleColumnsChange: setVisibleColumns,
              onColumnOrderChange: setColumnOrder,
              exportFileName: 'shipment-list',
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
              translationNamespace: 'common',
              appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
              search: {
                ...pagedGrid.searchConfig,
                placeholder: t('shipment.list.searchPlaceholder'),
                className: 'h-9 w-full md:w-64',
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
        </CardContent>
      </Card>

      <ShipmentDetailDialog
        headerId={selectedHeaderId ?? 0}
        isOpen={selectedHeaderId !== null}
        onClose={() => setSelectedHeaderId(null)}
      />
    </div>
  );
}
