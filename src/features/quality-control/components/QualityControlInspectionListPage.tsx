import { type ReactElement, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { OpsActionButton, OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { qualityControlApi } from '../api/quality-control.api';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import type { InventoryQualityInspectionPagedRowDto } from '../types/quality-control.types';
import { createGkkTestBundle } from '../utils/create-gkk-test-records';

type ColumnKey = 'documentType' | 'documentNumber' | 'warehouse' | 'supplier' | 'inspectionDate' | 'status' | 'lineCount' | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentType', type: 'string', labelKey: 'qualityControl.inspections.list.columns.documentType' },
  { value: 'documentNumber', type: 'string', labelKey: 'qualityControl.inspections.list.columns.documentNumber' },
  { value: 'warehouseCode', type: 'string', labelKey: 'qualityControl.inspections.list.columns.warehouse' },
  { value: 'supplierCode', type: 'string', labelKey: 'qualityControl.inspections.list.columns.supplier' },
  { value: 'status', type: 'string', labelKey: 'qualityControl.inspections.list.columns.status' },
  { value: 'inspectionDate', type: 'date', labelKey: 'qualityControl.inspections.list.columns.inspectionDate' },
];

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
  const [searchParams, setSearchParams] = useSearchParams();
  const autoCreateStarted = useRef(false);
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

  const createTestMutation = useMutation({
    mutationFn: () => createGkkTestBundle(),
    onSuccess: async (data) => {
      toast.success(t('qualityControl.messages.testBundleCreated', {
        documentNo: data.inspection.documentNumber || data.inspection.id,
        stockCode: data.stockCode,
        ruleId: data.rule.id,
      }));
      await query.refetch();
      navigate(`/quality-control/inspections?id=${data.inspection.id}`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '';
      if (message === 'TEST_WAREHOUSE_REQUIRED') {
        toast.error(t('qualityControl.messages.testWarehouseRequired'));
        return;
      }
      if (message === 'TEST_STOCK_REQUIRED') {
        toast.error(t('qualityControl.messages.testStockRequired'));
        return;
      }
      toast.error(message || t('common.generalError'));
    },
  });

  const createTestMutate = createTestMutation.mutate;

  useEffect(() => {
    if (autoCreateStarted.current) return;
    if (searchParams.get('autoCreateTest') !== '1') return;
    autoCreateStarted.current = true;
    const next = new URLSearchParams(searchParams);
    next.delete('autoCreateTest');
    setSearchParams(next, { replace: true });
    createTestMutate();
  }, [createTestMutate, searchParams, setSearchParams]);

  const exportColumns = useMemo(() => columns
    .filter((column) => column.key !== 'actions')
    .map((column) => ({ key: column.key, label: column.label })), [columns]);
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
    <OpsListPageShell
      eyebrow={
        <>
          <span>{t('qualityControl.breadcrumb.parent')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('qualityControl.breadcrumb.module')}</span>
        </>
      }
      title={t('qualityControl.inspections.list.pageTitle')}
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          <OpsActionButton
            type="button"
            variant="secondary"
            onClick={() => createTestMutation.mutate()}
            disabled={createTestMutation.isPending}
          >
            {createTestMutation.isPending
              ? t('common.saving')
              : t('qualityControl.inspections.list.createTest')}
          </OpsActionButton>
          <OpsActionButton
            type="button"
            variant="primary"
            onClick={() => navigate('/quality-control/inspections')}
          >
            <Plus className="size-3.5" aria-hidden />
            {t('common.add')}
          </OpsActionButton>
        </div>
      )}
    >
      <PagedDataGrid<InventoryQualityInspectionPagedRowDto, ColumnKey>
        variant="ops"
        pageKey={pageKey}
        columns={columns}
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
        showActionsColumn
        actionsHeaderLabel={t('common.actions')}
        renderActionsCell={(row) => (
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn"
              aria-label={t('common.update')}
              title={t('common.update')}
              onClick={() => navigate(`/quality-control/inspections?id=${row.id}`)}
            >
              <Pencil className="size-3" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="wms-ops-grid-icon-btn wms-ops-grid-icon-btn--danger"
              aria-label={t('common.delete')}
              title={t('common.delete')}
              onClick={() => deleteMutation.mutate(row.id)}
            >
              <Trash2 className="size-3" aria-hidden />
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
        exportFileName="quality-control-inspections"
        exportColumns={exportColumns}
        exportRows={exportRows}
        filterColumns={filterColumns}
        defaultFilterColumn="documentNumber"
        draftFilterRows={pagedGrid.draftFilterRows}
        onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
        filterLogic={pagedGrid.filterLogic}
        onFilterLogicChange={pagedGrid.setFilterLogic}
        onApplyFilters={pagedGrid.applyAdvancedFilters}
        onClearFilters={pagedGrid.clearAdvancedFilters}
        appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
        translationNamespace="common"
        search={{
          value: pagedGrid.searchInput,
          onValueChange: pagedGrid.searchConfig.onValueChange,
          onSearchChange: pagedGrid.searchConfig.onSearchChange,
          placeholder: t('qualityControl.inspections.list.searchPlaceholder'),
        }}
        refresh={{
          onRefresh: () => { void query.refetch(); },
          isLoading: query.isLoading,
          label: t('common.refresh'),
        }}
        idColumnKey="documentType"
      />
    </OpsListPageShell>
  );
}
