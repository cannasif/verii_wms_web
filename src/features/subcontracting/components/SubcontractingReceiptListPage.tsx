import { type ReactElement, useEffect, useMemo, useState } from 'react';
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
import { useSubcontractingReceiptHeadersPaged } from '../hooks/useSubcontractingHeaders';
import { SubcontractingDetailDialog } from './SubcontractingDetailDialog';
import type { SubcontractingHeader } from '../types/subcontracting';

type SubcontractingReceiptColumnKey = 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'sourceWarehouse' | 'targetWarehouse' | 'documentType' | 'status' | 'createdDate' | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'subcontracting.receipt.list.documentNo' },
  { value: 'customerCode', type: 'string', labelKey: 'subcontracting.receipt.list.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'subcontracting.receipt.list.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'subcontracting.receipt.list.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'subcontracting.receipt.list.targetWarehouse' },
  { value: 'documentType', type: 'string', labelKey: 'subcontracting.receipt.list.documentType' },
  { value: 'isCompleted', type: 'boolean', labelKey: 'subcontracting.receipt.list.status' },
];

const mapSortBy = (value: SubcontractingReceiptColumnKey): string => {
  switch (value) {
    case 'documentNo': return 'DocumentNo';
    case 'documentDate': return 'DocumentDate';
    case 'customerCode': return 'CustomerCode';
    case 'customerName': return 'CustomerName';
    case 'sourceWarehouse': return 'SourceWarehouse';
    case 'targetWarehouse': return 'TargetWarehouse';
    case 'documentType': return 'DocumentType';
    case 'createdDate': return 'CreatedDate';
    default: return 'Id';
  }
};

const formatDate = (value: string | null): string => !value ? '-' : new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' });
const formatDateTime = (value: string | null): string => !value ? '-' : new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

export function SubcontractingReceiptListPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const pageKey = 'subcontracting-receipt-list';
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const pagedGrid = usePagedDataGrid<SubcontractingReceiptColumnKey>({ pageKey, defaultSortBy: 'createdDate', defaultSortDirection: 'desc', defaultPageSize: 20, mapSortBy });
  const columns = useMemo<PagedDataGridColumn<SubcontractingReceiptColumnKey>[]>(() => [
    { key: 'documentNo', label: t('subcontracting.receipt.list.documentNo') },
    { key: 'documentDate', label: t('subcontracting.receipt.list.documentDate') },
    { key: 'customerCode', label: t('subcontracting.receipt.list.customerCode') },
    { key: 'customerName', label: t('subcontracting.receipt.list.customerName') },
    { key: 'sourceWarehouse', label: t('subcontracting.receipt.list.sourceWarehouse') },
    { key: 'targetWarehouse', label: t('subcontracting.receipt.list.targetWarehouse') },
    { key: 'documentType', label: t('subcontracting.receipt.list.documentType') },
    { key: 'status', label: t('subcontracting.receipt.list.status'), sortable: false },
    { key: 'createdDate', label: t('subcontracting.receipt.list.createdDate') },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);
  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({ pageKey, columns: columns.map(({ key, label }) => ({ key, label })) });
  const { data, isLoading, error } = useSubcontractingReceiptHeadersPaged(pagedGrid.queryParams);

  useEffect(() => {
    setPageTitle(t('subcontracting.receipt.list.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({ documentNo: item.documentNo || '-', documentDate: formatDate(item.documentDate), customerCode: item.customerCode || '-', customerName: item.customerName || '-', sourceWarehouse: item.sourceWarehouse || '-', targetWarehouse: item.targetWarehouse || '-', documentType: item.documentType || '-', status: item.isCompleted ? t('subcontracting.receipt.list.completed') : item.isPendingApproval ? t('subcontracting.receipt.list.pendingApproval') : t('subcontracting.receipt.list.inProgress'), createdDate: formatDateTime(item.createdDate) })), [data?.data, t]);
  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', { current: range.from, total: range.to, totalCount: range.total, defaultValue: `${range.from}-${range.to} / ${range.total}` });
  const visibleColumnKeys = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions') as SubcontractingReceiptColumnKey[], [orderedVisibleColumns]);
  const renderSortIcon = (columnKey: SubcontractingReceiptColumnKey): ReactElement | null => columnKey !== pagedGrid.sortBy ? null : pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;

  return (
    <div className="space-y-6 crm-page">
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/3">
        <PagedDataGrid<SubcontractingHeader, SubcontractingReceiptColumnKey>
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case 'documentNo': return <span className="font-medium">{item.documentNo || '-'}</span>;
              case 'documentDate': return formatDate(item.documentDate);
              case 'customerCode': return item.customerCode || '-';
              case 'customerName': return item.customerName || '-';
              case 'sourceWarehouse': return item.sourceWarehouse || '-';
              case 'targetWarehouse': return item.targetWarehouse || '-';
              case 'documentType': return <Badge variant="outline">{item.documentType || '-'}</Badge>;
              case 'status': return item.isCompleted ? <Badge variant="default" className="w-fit">{t('subcontracting.receipt.list.completed')}</Badge> : item.isPendingApproval ? <Badge variant="secondary" className="w-fit">{t('subcontracting.receipt.list.pendingApproval')}</Badge> : <Badge variant="outline" className="w-fit">{t('subcontracting.receipt.list.inProgress')}</Badge>;
              case 'createdDate': return formatDateTime(item.createdDate);
              default: return null;
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
          errorText={t('subcontracting.receipt.list.error')}
          emptyText={t('subcontracting.receipt.list.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions')}
          actionsHeaderLabel={t('common.actions')}
          renderActionsCell={(item) => (
            <Button variant="ghost" size="sm" onClick={() => {
              setSelectedHeaderId(item.id);
              setSelectedDocumentType(item.documentType);
            }}>
              {t('subcontracting.receipt.list.viewDetails')}
            </Button>
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
              placeholder: t('subcontracting.receipt.list.searchPlaceholder'),
            },
            leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
          }}
        />
      </div>

      {selectedHeaderId && (
        <SubcontractingDetailDialog
          headerId={selectedHeaderId}
          documentType={selectedDocumentType ?? ''}
          isOpen={selectedHeaderId != null}
          onClose={() => {
            setSelectedHeaderId(null);
            setSelectedDocumentType(null);
          }}
        />
      )}
    </div>
  );
}
