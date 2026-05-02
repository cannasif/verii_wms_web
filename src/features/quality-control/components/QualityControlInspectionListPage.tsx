import { type ReactElement, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { qualityControlApi } from '../api/quality-control.api';
import type { InventoryQualityInspectionPagedRowDto } from '../types/quality-control.types';

type ColumnKey = 'documentType' | 'documentNumber' | 'warehouse' | 'supplier' | 'inspectionDate' | 'status' | 'lineCount' | 'actions';

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'documentType': return 'DocumentType';
    case 'documentNumber': return 'DocumentNumber';
    case 'warehouse': return 'WarehouseName';
    case 'supplier': return 'SupplierId';
    case 'inspectionDate': return 'InspectionDate';
    case 'status': return 'Status';
    case 'lineCount': return 'Id';
    default: return 'Id';
  }
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('tr-TR');
}

export function QualityControlInspectionListPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const navigate = useNavigate();
  const pageKey = 'quality-control-inspection-list';

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'inspectionDate',
    defaultSortDirection: 'desc',
    defaultPageNumber: 1,
    defaultPageSize: 20,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('qualityControl.inspections.list.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'documentType', label: t('qualityControl.inspections.list.columns.documentType') },
    { key: 'documentNumber', label: t('qualityControl.inspections.list.columns.documentNumber') },
    { key: 'warehouse', label: t('qualityControl.inspections.list.columns.warehouse') },
    { key: 'supplier', label: t('qualityControl.inspections.list.columns.supplier') },
    { key: 'inspectionDate', label: t('qualityControl.inspections.list.columns.inspectionDate') },
    { key: 'status', label: t('qualityControl.inspections.list.columns.status') },
    { key: 'lineCount', label: t('qualityControl.inspections.list.columns.lineCount') },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'documentType',
  });

  const query = useQuery({
    queryKey: ['quality-control', 'inspections', pagedGrid.queryParams],
    queryFn: () => qualityControlApi.getInspectionsPaged(pagedGrid.queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => qualityControlApi.removeInspection(id),
    onSuccess: async () => {
      toast.success(t('qualityControl.messages.inspectionDeleted'));
      await query.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const visibleColumnKeys = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions') as ColumnKey[], [orderedVisibleColumns]);
  const exportColumns = useMemo(() => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({
    key,
    label: columns.find((column) => column.key === key)?.label ?? key,
  })), [columns, orderedVisibleColumns]);
  const exportRows = useMemo<Record<string, unknown>[]>(() => (
    (query.data?.data ?? []).map((row) => ({
      documentType: row.documentType,
      documentNumber: row.documentNumber || '-',
      warehouse: [row.warehouseCode, row.warehouseName].filter(Boolean).join(' - '),
      supplier: [row.supplierCode, row.supplierName].filter(Boolean).join(' - ') || '-',
      inspectionDate: formatDateTime(row.inspectionDate),
      status: row.status,
      lineCount: row.lineCount,
    }))
  ), [query.data?.data]);

  const range = getPagedRange(query.data, 1);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="crm-page space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="secondary">{t('qualityControl.badge')}</Badge>
        <Button type="button" onClick={() => navigate('/quality-control/inspections')}>
          {t('common.add')}
        </Button>
      </div>

      <PagedDataGrid<InventoryQualityInspectionPagedRowDto, ColumnKey>
        pageKey={pageKey}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={query.data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'documentType':
              return row.documentType;
            case 'documentNumber':
              return row.documentNumber || '-';
            case 'warehouse':
              return [row.warehouseCode, row.warehouseName].filter(Boolean).join(' - ');
            case 'supplier':
              return [row.supplierCode, row.supplierName].filter(Boolean).join(' - ') || '-';
            case 'inspectionDate':
              return formatDateTime(row.inspectionDate);
            case 'status':
              return t(`qualityControl.inspections.statuses.${row.status.charAt(0).toLowerCase()}${row.status.slice(1)}`);
            case 'lineCount':
              return row.lineCount;
            default:
              return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={(columnKey) => {
          if (columnKey !== 'actions') pagedGrid.handleSort(columnKey);
        }}
        renderSortIcon={renderSortIcon}
        isLoading={query.isLoading}
        isError={Boolean(query.error)}
        errorText={query.error instanceof Error ? query.error.message : t('common.generalError')}
        emptyText={t('qualityControl.inspections.list.empty')}
        showActionsColumn={orderedVisibleColumns.includes('actions')}
        actionsHeaderLabel={t('common.actions')}
        renderActionsCell={(row) => (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => navigate(`/quality-control/inspections?id=${row.id}`)}>
              {t('common.update')}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => deleteMutation.mutate(row.id)}>
              {t('common.delete')}
            </Button>
          </div>
        )}
        pageSize={query.data?.pageSize ?? pagedGrid.pageSize}
        pageSizeOptions={pagedGrid.pageSizeOptions}
        onPageSizeChange={pagedGrid.handlePageSizeChange}
        pageNumber={pagedGrid.getDisplayPageNumber(query.data)}
        totalPages={Math.max(query.data?.totalPages ?? 1, 1)}
        hasPreviousPage={Boolean(query.data?.hasPreviousPage)}
        hasNextPage={Boolean(query.data?.hasNextPage)}
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
          exportFileName: 'quality-control-inspections',
          exportColumns,
          exportRows,
          filterColumns: [],
          defaultFilterColumn: '',
          draftFilterRows: [],
          onDraftFilterRowsChange: () => undefined,
          filterLogic: 'and',
          onFilterLogicChange: () => undefined,
          onApplyFilters: () => undefined,
          onClearFilters: () => undefined,
          appliedFilterCount: 0,
          search: {
            value: pagedGrid.searchInput,
            onValueChange: pagedGrid.searchConfig.onValueChange,
            onSearchChange: pagedGrid.searchConfig.onSearchChange,
            placeholder: t('qualityControl.inspections.list.searchPlaceholder'),
          },
          refresh: {
            onRefresh: () => { void query.refetch(); },
            isLoading: query.isLoading,
            label: t('common.refresh'),
          },
        }}
      />
    </div>
  );
}
