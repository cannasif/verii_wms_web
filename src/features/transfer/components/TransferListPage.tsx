import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useTransferHeadersPaged } from '../hooks/useTransferHeaders';
import type { TransferHeader } from '../types/transfer';
import { TransferDetailDialog } from './TransferDetailDialog';

type TransferColumnKey =
  | 'id'
  | 'documentNo'
  | 'documentDate'
  | 'customerCode'
  | 'customerName'
  | 'sourceWarehouse'
  | 'targetWarehouse'
  | 'documentType'
  | 'createdDate'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'transfer.list.id' },
  { value: 'documentNo', type: 'string', labelKey: 'transfer.list.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'transfer.list.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'transfer.list.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'transfer.list.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'transfer.list.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'transfer.list.targetWarehouse' },
  { value: 'documentType', type: 'string', labelKey: 'transfer.list.documentType' },
  { value: 'createdDate', type: 'date', labelKey: 'transfer.list.createdDate' },
];

function mapSortBy(value: TransferColumnKey): string {
  switch (value) {
    case 'id':
      return 'Id';
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

export function TransferListPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);

  const pagedGrid = usePagedDataGrid<TransferColumnKey>({
    pageKey: 'transfer-list',
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('transfer.list.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<TransferColumnKey>[]>(
    () => [
      { key: 'id', label: t('transfer.list.id') },
      { key: 'documentNo', label: t('transfer.list.documentNo') },
      { key: 'documentDate', label: t('transfer.list.documentDate') },
      { key: 'customerCode', label: t('transfer.list.customerCode') },
      { key: 'customerName', label: t('transfer.list.customerName') },
      { key: 'sourceWarehouse', label: t('transfer.list.sourceWarehouse') },
      { key: 'targetWarehouse', label: t('transfer.list.targetWarehouse') },
      { key: 'documentType', label: t('transfer.list.documentType') },
      { key: 'createdDate', label: t('transfer.list.createdDate') },
      { key: 'actions', label: t('goodsReceipt.report.actions'), sortable: false },
    ],
    [t],
  );

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey: 'transfer-list',
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
  });

  const { data, isLoading, error } = useTransferHeadersPaged(pagedGrid.queryParams);

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
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as TransferColumnKey[],
    [orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    if (!data?.data) return [];
    return data.data.map((item) => ({
      id: item.id,
      documentNo: item.documentNo || '-',
      documentDate: formatDate(item.documentDate),
      customerCode: item.customerCode || '-',
      customerName: item.customerName || '-',
      sourceWarehouse: item.sourceWarehouse || '-',
      targetWarehouse: item.targetWarehouse || '-',
      documentType: item.documentType || '-',
      createdDate: formatDateTime(item.createdDate),
    }));
  }, [data?.data]);

  const renderSortIcon = (columnKey: TransferColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const range = getPagedRange(data);
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
          <CardTitle>{t('transfer.list.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<TransferHeader, TransferColumnKey>
            columns={columns}
            visibleColumnKeys={visibleColumnKeys}
            rows={data?.data ?? []}
            rowKey={(row) => row.id}
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'id':
                  return <span className="font-medium">{row.id}</span>;
                case 'documentNo':
                  return row.documentNo || '-';
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
              if (columnKey === 'actions') return;
              pagedGrid.handleSort(columnKey);
            }}
            renderSortIcon={renderSortIcon}
            isLoading={isLoading}
            isError={Boolean(error)}
            errorText={t('transfer.list.error')}
            emptyText={t('transfer.list.noData')}
            rowClassName="cursor-pointer"
            onRowClick={(row) => setSelectedHeaderId(row.id)}
            showActionsColumn={orderedVisibleColumns.includes('actions')}
            actionsHeaderLabel={t('goodsReceipt.report.actions')}
            renderActionsCell={(row) => (
              <Button variant="ghost" size="sm" onClick={() => setSelectedHeaderId(row.id)}>
                <Eye className="size-4" />
                <span className="ml-2">{t('transfer.list.viewDetails')}</span>
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
              pageKey: 'transfer-list',
              userId,
              columns: columns.map(({ key, label }) => ({ key, label })),
              visibleColumns,
              columnOrder,
              onVisibleColumnsChange: setVisibleColumns,
              onColumnOrderChange: setColumnOrder,
              exportFileName: 'transfer-list',
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
                placeholder: t('transfer.list.searchPlaceholder'),
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

      <TransferDetailDialog
        headerId={selectedHeaderId ?? 0}
        isOpen={selectedHeaderId !== null}
        onClose={() => setSelectedHeaderId(null)}
      />
    </div>
  );
}
