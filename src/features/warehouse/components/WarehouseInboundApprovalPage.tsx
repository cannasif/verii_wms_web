import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Check, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import type { WarehouseHeader } from '../types/warehouse';
import { useApproveWiHeader } from '../hooks/useApproveWiHeader';
import { useAwaitingApprovalWiHeaders } from '../hooks/useAwaitingApprovalWiHeaders';
import { WarehouseDetailDialog } from './WarehouseDetailDialog';

type ColumnKey = 'id' | 'documentNo' | 'documentDate' | 'customerCode' | 'customerName' | 'targetWarehouse' | 'completionDate' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'warehouse.inbound.approval.id' },
  { value: 'documentNo', type: 'string', labelKey: 'warehouse.inbound.approval.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'warehouse.inbound.approval.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'warehouse.inbound.approval.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'warehouse.inbound.approval.customerName' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'warehouse.inbound.approval.targetWarehouse' },
  { value: 'completionDate', type: 'date', labelKey: 'warehouse.inbound.approval.completionDate' },
];

export function WarehouseInboundApprovalPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const approveMutation = useApproveWiHeader();
  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey: 'warehouse-inbound-approval-list',
    defaultSortBy: 'id',
    defaultSortDirection: 'desc',
    mapSortBy: () => 'Id',
  });

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'id', label: t('warehouse.inbound.approval.id'), sortable: false },
    { key: 'documentNo', label: t('warehouse.inbound.approval.documentNo'), sortable: false },
    { key: 'documentDate', label: t('warehouse.inbound.approval.documentDate'), sortable: false },
    { key: 'customerCode', label: t('warehouse.inbound.approval.customerCode'), sortable: false },
    { key: 'customerName', label: t('warehouse.inbound.approval.customerName'), sortable: false },
    { key: 'targetWarehouse', label: t('warehouse.inbound.approval.targetWarehouse'), sortable: false },
    { key: 'completionDate', label: t('warehouse.inbound.approval.completionDate'), sortable: false },
    { key: 'actions', label: t('warehouse.inbound.approval.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey: 'warehouse-inbound-approval-list',
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
  });

  const { data, isLoading, error } = useAwaitingApprovalWiHeaders(pagedGrid.queryParams);

  useEffect(() => {
    setPageTitle(t('warehouse.inbound.approval.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const formatDate = (value: string | null): string => value
    ? new Date(value).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : '-';

  const formatDateTime = (value: string | null): string => value
    ? new Date(value).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '-';

  const exportColumns = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({
      key,
      label: columns.find((column) => column.key === key)?.label ?? key,
    })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => (data?.data ?? []).map((item) => ({
    id: item.id,
    documentNo: item.documentNo || '-',
    documentDate: formatDate(item.documentDate),
    customerCode: item.customerCode || '-',
    customerName: item.customerName || '-',
    targetWarehouse: item.targetWarehouse || '-',
    completionDate: formatDateTime(item.completionDate),
  })), [data?.data]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const handleApproval = async (id: number, approved: boolean): Promise<void> => {
    try {
      await approveMutation.mutateAsync({ id, approved });
      toast.success(approved ? t('warehouse.inbound.approval.approveSuccess') : t('warehouse.inbound.approval.rejectSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : approved ? t('warehouse.inbound.approval.approveError') : t('warehouse.inbound.approval.rejectError'));
    }
  };

  return (
    <div className="crm-page space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('warehouse.inbound.approval.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<WarehouseHeader, ColumnKey>
            columns={columns}
            visibleColumnKeys={orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[]}
            rows={data?.data ?? []}
            rowKey={(row) => row.id}
            renderCell={(row, key) => {
              switch (key) {
                case 'id': return row.id;
                case 'documentNo': return <span className="font-medium">{row.documentNo || '-'}</span>;
                case 'documentDate': return formatDate(row.documentDate);
                case 'customerCode': return row.customerCode || '-';
                case 'customerName': return row.customerName || '-';
                case 'targetWarehouse': return row.targetWarehouse || '-';
                case 'completionDate': return formatDateTime(row.completionDate);
                default: return null;
              }
            }}
            isLoading={isLoading}
            isError={Boolean(error)}
            errorText={t('warehouse.inbound.approval.error')}
            emptyText={t('warehouse.inbound.approval.noData')}
            showActionsColumn={orderedVisibleColumns.includes('actions')}
            actionsHeaderLabel={t('warehouse.inbound.approval.actions')}
            iconOnlyActions={false}
            renderActionsCell={(row) => (
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setSelectedHeaderId(row.id); setSelectedDocumentType(row.documentType); }}>
                  <Eye className="size-4" />
                  <span className="ml-2">{t('warehouse.inbound.approval.viewDetails')}</span>
                </Button>
                <Button variant="default" size="sm" disabled={approveMutation.isPending} onClick={() => handleApproval(row.id, true)}>
                  <Check className="size-4" />
                  <span className="ml-2">{t('warehouse.inbound.approval.approve')}</span>
                </Button>
                <Button variant="destructive" size="sm" disabled={approveMutation.isPending} onClick={() => handleApproval(row.id, false)}>
                  <X className="size-4" />
                  <span className="ml-2">{t('warehouse.inbound.approval.reject')}</span>
                </Button>
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
            actionBar={{
              pageKey: 'warehouse-inbound-approval-list',
              userId,
              columns: columns.map(({ key, label }) => ({ key, label })),
              visibleColumns,
              columnOrder,
              onVisibleColumnsChange: setVisibleColumns,
              onColumnOrderChange: setColumnOrder,
              exportFileName: 'warehouse-inbound-approval-list',
              exportColumns,
              exportRows,
              filterColumns,
              defaultFilterColumn: 'documentNo',
              draftFilterRows: pagedGrid.draftFilterRows,
              onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
              filterLogic: pagedGrid.filterLogic,
              onFilterLogicChange: pagedGrid.setFilterLogic,
              onApplyFilters: pagedGrid.applyAdvancedFilters,
              onClearFilters: pagedGrid.clearAdvancedFilters,
              translationNamespace: 'common',
              appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
              search: { ...pagedGrid.searchConfig, placeholder: t('warehouse.inbound.approval.searchPlaceholder'), className: 'h-9 w-full md:w-64' },
              leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
            }}
          />
        </CardContent>
      </Card>
      {selectedHeaderId && selectedDocumentType && (
        <WarehouseDetailDialog headerId={selectedHeaderId} documentType={selectedDocumentType} isOpen onClose={() => { setSelectedHeaderId(null); setSelectedDocumentType(null); }} />
      )}
    </div>
  );
}
