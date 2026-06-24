import { type ReactElement, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OpsActionButton, OpsListPageShell, OpsServiceEyebrow, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
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

  const query = useQuery({
    queryKey: ['sgra-lines', pagedGrid.queryParams],
    queryFn: () => steelGoodReciptAcceptanseApi.getLinesPaged(pagedGrid.queryParams),
  });

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
          search={{
            value: pagedGrid.searchInput,
            onValueChange: pagedGrid.searchConfig.onValueChange,
            onSearchChange: pagedGrid.searchConfig.onSearchChange,
            placeholder: t('steelGoodReceiptAcceptance.list.searchPh'),
          }}
        />
      </MasterDataOpsSection>
    </OpsListPageShell>
  );
}
