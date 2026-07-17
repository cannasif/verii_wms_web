import { type ReactElement, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsListPageShell, OpsServiceEyebrow, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { getPagedRange } from '@/lib/paged';
import { localizeStatus } from '@/lib/localize-status';
import { useUIStore } from '@/stores/ui-store';
import { MasterDataOpsSection } from '@/features/shared';
import { steelGoodReciptAcceptanseApi } from '../api/steel-good-recipt-acceptanse.api';
import type { SteelGoodReciptAcceptanseLineListItemDto } from '../types/steel-good-recipt-acceptanse.types';

type ColumnKey =
  | 'excelRecordNo'
  | 'dCode'
  | 'supplier'
  | 'netsisOrderNo'
  | 'stockCode'
  | 'description'
  | 'combinedSize'
  | 'serialNo'
  | 'expectedQuantity'
  | 'arrivedQuantity'
  | 'approvedQuantity'
  | 'rejectedQuantity'
  | 'status';

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  excelRecordNo: 8,
  dCode: 8,
  supplier: 14,
  netsisOrderNo: 9,
  stockCode: 9,
  description: 14,
  combinedSize: 10,
  serialNo: 10,
  expectedQuantity: 8,
  arrivedQuantity: 8,
  approvedQuantity: 8,
  rejectedQuantity: 8,
  status: 9,
};

const filterColumns: readonly FilterColumnConfig[] = [
  { value: 'excelRecordNo', type: 'string', labelKey: 'steelGoodReceiptAcceptance.list.colRecNo' },
  { value: 'dCode', type: 'string', labelKey: 'steelGoodReceiptAcceptance.list.colD' },
  { value: 'supplierCode', type: 'string', labelKey: 'steelGoodReceiptAcceptance.list.colSup' },
  { value: 'supplierName', type: 'string', labelKey: 'steelGoodReceiptAcceptance.list.colSup' },
  { value: 'netsisOrderNo', type: 'string', labelKey: 'steelGoodReceiptAcceptance.list.colOrd' },
  { value: 'stockCode', type: 'string', labelKey: 'steelGoodReceiptAcceptance.list.colSt' },
  { value: 'description', type: 'string', labelKey: 'steelGoodReceiptAcceptance.list.colStockName' },
  { value: 'combinedSize', type: 'string', labelKey: 'steelGoodReceiptAcceptance.list.colCombinedSize' },
  { value: 'serialNo', type: 'string', labelKey: 'steelGoodReceiptAcceptance.list.colPlate' },
  { value: 'expectedQuantity', type: 'number', labelKey: 'steelGoodReceiptAcceptance.list.colExp' },
  { value: 'arrivedQuantity', type: 'number', labelKey: 'steelGoodReceiptAcceptance.list.colArr' },
  { value: 'approvedQuantity', type: 'number', labelKey: 'steelGoodReceiptAcceptance.list.colAp' },
  { value: 'rejectedQuantity', type: 'number', labelKey: 'steelGoodReceiptAcceptance.list.colRejected' },
  { value: 'status', type: 'string', labelKey: 'steelGoodReceiptAcceptance.list.colStat' },
];

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'excelRecordNo': return 'ExcelRecordNo';
    case 'dCode': return 'DCode';
    case 'supplier': return 'SupplierCode';
    case 'netsisOrderNo': return 'NetsisOrderNo';
    case 'stockCode': return 'StockCode';
    case 'description': return 'Description';
    case 'combinedSize': return 'CombinedSize';
    case 'serialNo': return 'SerialNo';
    case 'expectedQuantity': return 'ExpectedQuantity';
    case 'arrivedQuantity': return 'ArrivedQuantity';
    case 'approvedQuantity': return 'ApprovedQuantity';
    case 'rejectedQuantity': return 'RejectedQuantity';
    case 'status': return 'Status';
    default: return 'Id';
  }
}

export function SteelGoodReciptAcceptanseListPage(): ReactElement {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const pageKey = 'sgra-lines-list';
  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey,
    defaultSortBy: 'dCode',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    defaultPageNumber: 1,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('steelGoodReceiptAcceptance.list.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(() => [
    { key: 'excelRecordNo', label: t('steelGoodReceiptAcceptance.list.colRecNo') },
    { key: 'dCode', label: t('steelGoodReceiptAcceptance.list.colD') },
    { key: 'supplier', label: t('steelGoodReceiptAcceptance.list.colSup') },
    { key: 'netsisOrderNo', label: t('steelGoodReceiptAcceptance.list.colOrd') },
    { key: 'stockCode', label: t('steelGoodReceiptAcceptance.list.colSt') },
    { key: 'description', label: t('steelGoodReceiptAcceptance.list.colStockName') },
    { key: 'combinedSize', label: t('steelGoodReceiptAcceptance.list.colCombinedSize') },
    { key: 'serialNo', label: t('steelGoodReceiptAcceptance.list.colPlate') },
    { key: 'expectedQuantity', label: t('steelGoodReceiptAcceptance.list.colExp') },
    { key: 'arrivedQuantity', label: t('steelGoodReceiptAcceptance.list.colArr') },
    { key: 'approvedQuantity', label: t('steelGoodReceiptAcceptance.list.colAp') },
    { key: 'rejectedQuantity', label: t('steelGoodReceiptAcceptance.list.colRejected') },
    { key: 'status', label: t('steelGoodReceiptAcceptance.list.colStat') },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'dCode',
  });

  const query = useQuery({
    queryKey: ['sgra-lines', pagedGrid.queryParams],
    queryFn: () => steelGoodReciptAcceptanseApi.getLinesPaged(pagedGrid.queryParams),
  });

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns as ColumnKey[],
    [orderedVisibleColumns],
  );

  const exportColumns = useMemo(
    () => orderedVisibleColumns.map((key) => ({
      key,
      label: columns.find((column) => column.key === key)?.label ?? key,
    })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => (
    (query.data?.data ?? []).map((row) => ({
      excelRecordNo: row.excelRecordNo || '-',
      dCode: row.dCode,
      supplier: `${row.supplierCode} - ${row.supplierName}`,
      netsisOrderNo: row.netsisOrderNo || '-',
      stockCode: row.stockCode || '-',
      description: row.description || '-',
      combinedSize: row.combinedSize || '-',
      serialNo: row.serialNo || '-',
      expectedQuantity: row.expectedQuantity,
      arrivedQuantity: row.arrivedQuantity,
      approvedQuantity: row.approvedQuantity,
      rejectedQuantity: row.rejectedQuantity,
      status: localizeStatus(row.status, t),
    }))
  ), [query.data?.data, t]);

  const range = getPagedRange(query.data, 1);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  return (
    <OpsListPageShell
      className="wms-ops-sac-mal-page"
      eyebrow={<OpsServiceEyebrow module={t('steelGoodReceiptAcceptance.breadcrumb.module')} />}
      title={t('steelGoodReceiptAcceptance.list.title')}
      description={t('steelGoodReceiptAcceptance.list.description')}
      actions={
        <>
          <OpsActionButton type="button" variant="secondary" onClick={() => void query.refetch()} disabled={query.isLoading}>
            {t('steelGoodReceiptAcceptance.list.refresh')}
          </OpsActionButton>
          <OpsActionButton type="button" variant="primary" onClick={() => navigate('/sac-mal-kabul/import')}>
            {t('steelGoodReceiptAcceptance.import.previewBtn', { defaultValue: t('common.add') })}
          </OpsActionButton>
        </>
      }
    >
      <MasterDataOpsSection title={t('steelGoodReceiptAcceptance.list.title')}>
        <PagedDataGrid<SteelGoodReciptAcceptanseLineListItemDto, ColumnKey>
          variant="ops"
          pageKey={pageKey}
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          rows={query.data?.data ?? []}
          rowKey={(row) => row.id}
          defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
          enableColumnResize
          renderCell={(row, columnKey) => {
            switch (columnKey) {
              case 'excelRecordNo': return row.excelRecordNo || '-';
              case 'dCode': return <span className="font-mono text-xs font-medium">{row.dCode}</span>;
              case 'supplier': return `${row.supplierCode} - ${row.supplierName}`;
              case 'netsisOrderNo': return row.netsisOrderNo || '-';
              case 'stockCode': return row.stockCode || '-';
              case 'description': return row.description || '-';
              case 'combinedSize': return row.combinedSize || '-';
              case 'serialNo': return row.serialNo || '-';
              case 'expectedQuantity': return row.expectedQuantity;
              case 'arrivedQuantity': return row.arrivedQuantity;
              case 'approvedQuantity': return row.approvedQuantity;
              case 'rejectedQuantity': return row.rejectedQuantity;
              case 'status': return localizeStatus(row.status, t);
              default: return '-';
            }
          }}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={pagedGrid.handleSort}
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
          isLoading={query.isLoading}
          isError={Boolean(query.error)}
          errorText={query.error instanceof Error ? query.error.message : t('common.generalError')}
          emptyText={t('steelGoodReceiptAcceptance.list.empty')}
          actionBar={{
            pageKey,
            userId,
            columns: columns.map(({ key, label }) => ({ key, label })),
            visibleColumns,
            columnOrder,
            onVisibleColumnsChange: setVisibleColumns,
            onColumnOrderChange: setColumnOrder,
            exportFileName: 'sac-mal-kabul-listesi',
            exportColumns,
            exportRows,
            filterColumns,
            defaultFilterColumn: 'dCode',
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
              placeholder: t('steelGoodReceiptAcceptance.list.searchPh'),
            },
            refresh: {
              onRefresh: () => void query.refetch(),
              isLoading: query.isLoading,
              label: t('steelGoodReceiptAcceptance.list.refresh'),
            },
            variant: 'ops',
          }}
        />
      </MasterDataOpsSection>
    </OpsListPageShell>
  );
}
