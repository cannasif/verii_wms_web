import { type ReactElement, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { OpsActionButton, OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { qualityControlApi } from '../api/quality-control.api';
import type { InventoryQualityRulePagedRowDto } from '../types/quality-control.types';
import { createGkkTestRule } from '../utils/create-gkk-test-records';

type ColumnKey =
  | 'scopeType'
  | 'stock'
  | 'stockGroup'
  | 'inspectionMode'
  | 'onFailAction'
  | 'autoQuarantine'
  | 'requireLot'
  | 'requireSerial'
  | 'requireExpiry'
  | 'isActive'
  | 'actions';

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'scopeType', type: 'string', labelKey: 'qualityControl.rules.list.columns.scopeType' },
  { value: 'stockCode', type: 'string', labelKey: 'qualityControl.rules.list.columns.stock' },
  { value: 'stockGroupCode', type: 'string', labelKey: 'qualityControl.rules.list.columns.stockGroup' },
  { value: 'inspectionMode', type: 'string', labelKey: 'qualityControl.rules.list.columns.inspectionMode' },
  { value: 'onFailAction', type: 'string', labelKey: 'qualityControl.rules.list.columns.onFailAction' },
  { value: 'autoQuarantine', type: 'boolean', labelKey: 'qualityControl.rules.list.columns.autoQuarantine' },
  { value: 'requireLot', type: 'boolean', labelKey: 'qualityControl.rules.list.columns.requireLot' },
  { value: 'requireSerial', type: 'boolean', labelKey: 'qualityControl.rules.list.columns.requireSerial' },
  { value: 'requireExpiry', type: 'boolean', labelKey: 'qualityControl.rules.list.columns.requireExpiry' },
  { value: 'isActive', type: 'boolean', labelKey: 'qualityControl.rules.list.columns.isActive' },
];

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'scopeType': return 'ScopeType';
    case 'stock': return 'StockCode';
    case 'stockGroup': return 'StockGroupCode';
    case 'inspectionMode': return 'InspectionMode';
    case 'onFailAction': return 'OnFailAction';
    case 'autoQuarantine': return 'AutoQuarantine';
    case 'requireLot': return 'RequireLot';
    case 'requireSerial': return 'RequireSerial';
    case 'requireExpiry': return 'RequireExpiry';
    case 'isActive': return 'IsActive';
    default: return 'Id';
  }
}

export function QualityControlRuleListPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const navigate = useNavigate();
  const pageKey = 'quality-control-rule-list';

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'scopeType',
    defaultSortDirection: 'asc',
    defaultPageNumber: 1,
    defaultPageSize: 20,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('qualityControl.rules.list.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'scopeType', label: t('qualityControl.rules.list.columns.scopeType') },
    { key: 'stock', label: t('qualityControl.rules.list.columns.stock') },
    { key: 'stockGroup', label: t('qualityControl.rules.list.columns.stockGroup') },
    { key: 'inspectionMode', label: t('qualityControl.rules.list.columns.inspectionMode') },
    { key: 'onFailAction', label: t('qualityControl.rules.list.columns.onFailAction') },
    { key: 'autoQuarantine', label: t('qualityControl.rules.list.columns.autoQuarantine') },
    { key: 'requireLot', label: t('qualityControl.rules.list.columns.requireLot') },
    { key: 'requireSerial', label: t('qualityControl.rules.list.columns.requireSerial') },
    { key: 'requireExpiry', label: t('qualityControl.rules.list.columns.requireExpiry') },
    { key: 'isActive', label: t('qualityControl.rules.list.columns.isActive') },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const query = useQuery({
    queryKey: ['quality-control', 'rules', pagedGrid.queryParams],
    queryFn: () => qualityControlApi.getRulesPaged(pagedGrid.queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => qualityControlApi.removeRule(id),
    onSuccess: async () => {
      toast.success(t('qualityControl.messages.ruleDeleted'));
      await query.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const createTestMutation = useMutation({
    mutationFn: () => createGkkTestRule(),
    onSuccess: async (data) => {
      toast.success(t('qualityControl.messages.testRuleCreated'));
      await query.refetch();
      navigate(`/quality-control/rules?id=${data.id}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.generalError')),
  });

  const exportColumns = useMemo(() => columns
    .filter((column) => column.key !== 'actions')
    .map((column) => ({ key: column.key, label: column.label })), [columns]);

  const exportRows = useMemo<Record<string, unknown>[]>(() => (
    (query.data?.data ?? []).map((row) => ({
      scopeType: row.scopeType,
      stock: [row.stockCode, row.stockName].filter(Boolean).join(' - ') || '-',
      stockGroup: [row.stockGroupCode, row.stockGroupName].filter(Boolean).join(' - ') || '-',
      inspectionMode: row.inspectionMode,
      onFailAction: row.onFailAction,
      autoQuarantine: row.autoQuarantine ? t('common.yes') : t('common.no'),
      requireLot: row.requireLot ? t('common.yes') : t('common.no'),
      requireSerial: row.requireSerial ? t('common.yes') : t('common.no'),
      requireExpiry: row.requireExpiry ? t('common.yes') : t('common.no'),
      isActive: row.isActive ? t('ocrGoodsReceiptMatch.options.active') : t('ocrGoodsReceiptMatch.options.passive'),
    }))
  ), [query.data?.data, t]);

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

  const handleImportCompleted = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const definitionExcel = useMemo(() => ({
    definitionKey: 'quality-control-rule',
    fileNamePrefix: 'kalite-kontrol-kurallari',
    onImportCompleted: handleImportCompleted,
  }), [handleImportCompleted]);

  const gridSearch = useMemo(() => ({
    value: pagedGrid.searchInput,
    onValueChange: pagedGrid.searchConfig.onValueChange,
    onSearchChange: pagedGrid.searchConfig.onSearchChange,
    placeholder: t('qualityControl.rules.list.searchPlaceholder'),
  }), [pagedGrid.searchConfig.onSearchChange, pagedGrid.searchConfig.onValueChange, pagedGrid.searchInput, t]);

  const gridRefresh = useMemo(() => ({
    onRefresh: () => { void query.refetch(); },
    isLoading: query.isLoading,
    label: t('common.refresh'),
  }), [query.isLoading, query.refetch, t]);

  return (
    <OpsListPageShell
      eyebrow={
        <>
          <span>{t('qualityControl.breadcrumb.parent')}</span>
          <span className="mx-2 opacity-60">/</span>
          <span>{t('qualityControl.breadcrumb.module')}</span>
        </>
      }
      title={t('qualityControl.rules.list.pageTitle')}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <OpsActionButton
            type="button"
            variant="secondary"
            onClick={() => createTestMutation.mutate()}
            disabled={createTestMutation.isPending}
          >
            {createTestMutation.isPending
              ? t('common.saving')
              : t('qualityControl.rules.list.createTest')}
          </OpsActionButton>
          <OpsActionButton type="button" variant="primary" onClick={() => navigate('/quality-control/rules')}>
            <Plus className="size-3.5" aria-hidden />
            {t('common.add')}
          </OpsActionButton>
        </div>
      }
    >
      <PagedDataGrid<InventoryQualityRulePagedRowDto, ColumnKey>
        variant="ops"
        pageKey={pageKey}
          columns={columns}
          rows={query.data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(row, columnKey) => {
            switch (columnKey) {
              case 'scopeType':
                return row.scopeType === 'Stock' ? t('qualityControl.rules.scopeTypes.stock') : t('qualityControl.rules.scopeTypes.stockGroup');
              case 'stock':
                return [row.stockCode, row.stockName].filter(Boolean).join(' - ') || '-';
              case 'stockGroup':
                return [row.stockGroupCode, row.stockGroupName].filter(Boolean).join(' - ') || '-';
              case 'inspectionMode':
                return t(`qualityControl.rules.inspectionModes.${row.inspectionMode.charAt(0).toLowerCase()}${row.inspectionMode.slice(1)}`);
              case 'onFailAction':
                return t(`qualityControl.rules.failActions.${row.onFailAction.charAt(0).toLowerCase()}${row.onFailAction.slice(1)}`);
              case 'autoQuarantine':
              case 'requireLot':
              case 'requireSerial':
              case 'requireExpiry':
                return row[columnKey] ? t('common.yes') : t('common.no');
              case 'isActive':
                return row.isActive ? t('ocrGoodsReceiptMatch.options.active') : t('ocrGoodsReceiptMatch.options.passive');
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
          emptyText={t('qualityControl.rules.list.empty')}
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
                onClick={() => navigate(`/quality-control/rules?id=${row.id}`)}
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
          exportFileName="quality-control-rules"
          exportColumns={exportColumns}
          exportRows={exportRows}
          filterColumns={filterColumns}
          defaultFilterColumn="stockCode"
          draftFilterRows={pagedGrid.draftFilterRows}
          onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
          filterLogic={pagedGrid.filterLogic}
          onFilterLogicChange={pagedGrid.setFilterLogic}
          onApplyFilters={pagedGrid.applyAdvancedFilters}
          onClearFilters={pagedGrid.clearAdvancedFilters}
          appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
          translationNamespace="common"
          search={gridSearch}
          refresh={gridRefresh}
          definitionExcel={definitionExcel}
          idColumnKey="scopeType"
        />
    </OpsListPageShell>
  );
}
