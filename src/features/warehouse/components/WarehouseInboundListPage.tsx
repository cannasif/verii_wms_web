import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useWarehouseInboundHeadersPaged } from '../hooks/useWarehouseHeaders';
import type { WarehouseHeader } from '../types/warehouse';
import { WarehouseDetailDialog } from './WarehouseDetailDialog';

type WarehouseInboundColumnKey =
  | 'documentNo'
  | 'documentDate'
  | 'customerCode'
  | 'customerName'
  | 'targetWarehouse'
  | 'documentType'
  | 'status'
  | 'createdDate'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'warehouse.inbound.list.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'warehouse.inbound.list.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'warehouse.inbound.list.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'warehouse.inbound.list.customerName' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'warehouse.inbound.list.targetWarehouse' },
  { value: 'documentType', type: 'string', labelKey: 'warehouse.inbound.list.documentType' },
  { value: 'isCompleted', type: 'boolean', labelKey: 'warehouse.inbound.list.status' },
];

function mapSortBy(value: WarehouseInboundColumnKey): string {
  switch (value) {
    case 'documentNo':
      return 'DocumentNo';
    case 'documentDate':
      return 'DocumentDate';
    case 'customerCode':
      return 'CustomerCode';
    case 'customerName':
      return 'CustomerName';
    case 'targetWarehouse':
      return 'TargetWarehouse';
    case 'documentType':
      return 'DocumentType';
    case 'createdDate':
    default:
      return 'CreatedDate';
  }
}

export function WarehouseInboundListPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);

  const pagedGrid = usePagedDataGrid<WarehouseInboundColumnKey>({
    pageKey: 'warehouse-inbound-list',
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('warehouse.inbound.list.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<WarehouseInboundColumnKey>[]>(
    () => [
      { key: 'documentNo', label: t('warehouse.inbound.list.documentNo') },
      { key: 'documentDate', label: t('warehouse.inbound.list.documentDate') },
      { key: 'customerCode', label: t('warehouse.inbound.list.customerCode') },
      { key: 'customerName', label: t('warehouse.inbound.list.customerName') },
      { key: 'targetWarehouse', label: t('warehouse.inbound.list.targetWarehouse') },
      { key: 'documentType', label: t('warehouse.inbound.list.documentType') },
      { key: 'status', label: t('warehouse.inbound.list.status'), sortable: false },
      { key: 'createdDate', label: t('warehouse.inbound.list.createdDate') },
      { key: 'actions', label: t('warehouse.inbound.list.actions'), sortable: false },
    ],
    [t],
  );

  const { data, isLoading, error } = useWarehouseInboundHeadersPaged(pagedGrid.queryParams);

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

  const getStatusLabel = useCallback((item: WarehouseHeader): string => {
    if (item.isCompleted) return t('warehouse.inbound.list.completed');
    if (item.isPendingApproval) return t('warehouse.inbound.list.pendingApproval');
    return t('warehouse.inbound.list.inProgress');
  }, [t]);

  const handleRowClick = (header: WarehouseHeader): void => {
    setSelectedHeaderId(header.id);
    setSelectedDocumentType(header.documentType);
  };

  const exportColumns = useMemo(
    () => columns
      .filter((column) => column.key !== 'actions')
      .map((column) => ({
        key: column.key,
        label: column.label,
      })),
    [columns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    if (!data?.data) return [];
    return data.data.map((item) => ({
      documentNo: item.documentNo || '-',
      documentDate: formatDate(item.documentDate),
      customerCode: item.customerCode || '-',
      customerName: item.customerName || '-',
      targetWarehouse: item.targetWarehouse || '-',
      documentType: item.documentType || '-',
      status: getStatusLabel(item),
      createdDate: formatDateTime(item.createdDate),
    }));
  }, [data?.data, getStatusLabel]);

  const renderSortIcon = (columnKey: WarehouseInboundColumnKey): ReactElement | null => {
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
          <CardTitle>{t('warehouse.inbound.list.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<WarehouseHeader, WarehouseInboundColumnKey>
            pageKey="warehouse-inbound-list"
            columns={columns}
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
                case 'targetWarehouse':
                  return row.targetWarehouse || '-';
                case 'documentType':
                  return <Badge variant="outline">{row.documentType || '-'}</Badge>;
                case 'status':
                  return row.isCompleted ? (
                    <Badge variant="default" className="w-fit">{t('warehouse.inbound.list.completed')}</Badge>
                  ) : row.isPendingApproval ? (
                    <Badge variant="secondary" className="w-fit">{t('warehouse.inbound.list.pendingApproval')}</Badge>
                  ) : (
                    <Badge variant="outline" className="w-fit">{t('warehouse.inbound.list.inProgress')}</Badge>
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
            errorText={t('warehouse.inbound.list.error')}
            emptyText={t('warehouse.inbound.list.noData')}
            rowClassName="cursor-pointer"
            onRowClick={handleRowClick}
            showActionsColumn
            actionsHeaderLabel={t('warehouse.inbound.list.actions')}
            renderActionsCell={(row) => (
              <Button variant="ghost" size="sm" onClick={() => handleRowClick(row)}>
                <Eye className="size-4" />
                <span className="ml-2">{t('warehouse.inbound.list.viewDetails')}</span>
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
            exportFileName="warehouse-inbound-list"
            exportColumns={exportColumns}
            exportRows={exportRows}
            filterColumns={advancedFilterColumns}
            defaultFilterColumn="documentNo"
            draftFilterRows={pagedGrid.draftFilterRows}
            onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
            filterLogic={pagedGrid.filterLogic}
            onFilterLogicChange={pagedGrid.setFilterLogic}
            onApplyFilters={pagedGrid.applyAdvancedFilters}
            onClearFilters={pagedGrid.clearAdvancedFilters}
            translationNamespace="common"
            appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
            search={{
              ...pagedGrid.searchConfig,
              placeholder: t('warehouse.inbound.list.searchPlaceholder'),
              className: 'h-9 w-full md:w-64',
            }}
            leftSlot={(
              <VoiceSearchButton
                onResult={pagedGrid.handleVoiceSearch}
                size="sm"
                variant="outline"
              />
            )}
          />
        </CardContent>
      </Card>

      <WarehouseDetailDialog
        headerId={selectedHeaderId ?? 0}
        documentType={selectedDocumentType ?? ''}
        isOpen={selectedHeaderId !== null}
        onClose={() => {
          setSelectedHeaderId(null);
          setSelectedDocumentType(null);
        }}
      />
    </div>
  );
}
