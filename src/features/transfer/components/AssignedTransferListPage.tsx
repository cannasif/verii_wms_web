import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { useAssignedTransferHeaders } from '../hooks/useAssignedTransferHeaders';
import { TransferDetailDialog } from './TransferDetailDialog';
import type { TransferHeader } from '../types/transfer';

type TransferAssignedColumnKey =
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
  { value: 'documentNo', type: 'string', labelKey: 'transfer.list.documentNo' },
  { value: 'customerCode', type: 'string', labelKey: 'transfer.list.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'transfer.list.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'transfer.list.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'transfer.list.targetWarehouse' },
  { value: 'documentType', type: 'string', labelKey: 'transfer.list.documentType' },
];

function mapSortBy(value: TransferAssignedColumnKey): string {
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

export function AssignedTransferListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const pageKey = 'transfer-assigned-list';
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);

  const pagedGrid = usePagedDataGrid<TransferAssignedColumnKey>({
    pageKey,
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<TransferAssignedColumnKey>[]>(() => [
    { key: 'id', label: t('transfer.list.id') },
    { key: 'documentNo', label: t('transfer.list.documentNo') },
    { key: 'documentDate', label: t('transfer.list.documentDate') },
    { key: 'customerCode', label: t('transfer.list.customerCode') },
    { key: 'customerName', label: t('transfer.list.customerName') },
    { key: 'sourceWarehouse', label: t('transfer.list.sourceWarehouse') },
    { key: 'targetWarehouse', label: t('transfer.list.targetWarehouse') },
    { key: 'documentType', label: t('transfer.list.documentType') },
    { key: 'createdDate', label: t('transfer.list.createdDate') },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
  });

  const { data, isLoading, error } = useAssignedTransferHeaders(pagedGrid.queryParams);

  useEffect(() => {
    setPageTitle(t('transfer.assignedList.title'));
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

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    count: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as TransferAssignedColumnKey[],
    [orderedVisibleColumns],
  );

  const renderSortIcon = (columnKey: TransferAssignedColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-6 crm-page">
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/3">
        <PagedDataGrid<TransferHeader, TransferAssignedColumnKey>
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
            if (columnKey === 'actions') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('transfer.assignedList.error')}
          emptyText={t('transfer.assignedList.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions')}
          actionsHeaderLabel={t('common.actions')}
          renderActionsCell={(item) => (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedHeaderId(item.id)}>
                {t('transfer.list.viewDetails')}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={() => navigate(`/transfer/collection/${item.id}`)}
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
              placeholder: t('transfer.assignedList.searchPlaceholder'),
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
        <TransferDetailDialog
          headerId={selectedHeaderId}
          isOpen={selectedHeaderId != null}
          onClose={() => setSelectedHeaderId(null)}
        />
      )}
    </div>
  );
}
