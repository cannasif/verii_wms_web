import { type ReactElement, useEffect, useMemo } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import type { BusinessDocumentLinkRow } from '../types/service-allocation.types';
import { useDocumentLinksQuery } from '../hooks/useDocumentLinksQuery';
import { renderDocumentLinkPurpose, renderDocumentModule } from '../utils/service-allocation-display';

type ColumnKey =
  | 'documentModule'
  | 'documentHeaderId'
  | 'linkPurpose'
  | 'sequenceNo'
  | 'serviceCaseId'
  | 'orderAllocationLineId'
  | 'linkedAt';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentModule', type: 'string', labelKey: 'serviceAllocation.documentModule' },
  { value: 'documentHeaderId', type: 'number', labelKey: 'serviceAllocation.documentHeaderId' },
  { value: 'linkPurpose', type: 'number', labelKey: 'serviceAllocation.linkPurpose' },
  { value: 'serviceCaseId', type: 'number', labelKey: 'serviceAllocation.serviceCaseId' },
  { value: 'orderAllocationLineId', type: 'number', labelKey: 'serviceAllocation.orderAllocationLineId' },
  { value: 'linkedAt', type: 'date', labelKey: 'serviceAllocation.linkedAt' },
];

function mapSortBy(value: ColumnKey): string {
  switch (value) {
    case 'documentModule':
      return 'DocumentModule';
    case 'documentHeaderId':
      return 'DocumentHeaderId';
    case 'linkPurpose':
      return 'LinkPurpose';
    case 'sequenceNo':
      return 'SequenceNo';
    case 'serviceCaseId':
      return 'ServiceCaseId';
    case 'orderAllocationLineId':
      return 'OrderAllocationLineId';
    case 'linkedAt':
      return 'LinkedAt';
    default:
      return 'Id';
  }
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

export function DocumentLinksPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey: 'service-allocation-document-links',
    defaultSortBy: 'linkedAt',
    defaultSortDirection: 'desc',
    defaultPageNumber: 1,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('serviceAllocation.documentLinks.title', { defaultValue: 'Document Links' }));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ColumnKey>[]>(
    () => [
      { key: 'documentModule', label: t('serviceAllocation.documentModule', { defaultValue: 'Module' }) },
      { key: 'documentHeaderId', label: t('serviceAllocation.documentHeaderId', { defaultValue: 'Document Id' }) },
      { key: 'linkPurpose', label: t('serviceAllocation.linkPurpose', { defaultValue: 'Purpose' }) },
      { key: 'sequenceNo', label: t('serviceAllocation.sequence', { defaultValue: 'Seq' }) },
      { key: 'serviceCaseId', label: t('serviceAllocation.serviceCaseId', { defaultValue: 'Service Case' }) },
      { key: 'orderAllocationLineId', label: t('serviceAllocation.orderAllocationLineId', { defaultValue: 'Allocation Line' }) },
      { key: 'linkedAt', label: t('serviceAllocation.linkedAt', { defaultValue: 'Linked At' }) },
    ],
    [t],
  );

  const { data, isLoading, isFetching, error, refetch } = useDocumentLinksQuery(pagedGrid.queryParams);
  const rows = data?.data ?? [];

  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const range = getPagedRange(data, 1);
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
          <CardTitle>{t('serviceAllocation.documentLinks.title', { defaultValue: 'Document Links' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<BusinessDocumentLinkRow, ColumnKey>
            pageKey="service-allocation-document-links"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'documentModule':
                  return renderDocumentModule(row.documentModule);
                case 'documentHeaderId':
                  return row.documentHeaderId;
                case 'linkPurpose':
                  return renderDocumentLinkPurpose(row.linkPurpose);
                case 'sequenceNo':
                  return row.sequenceNo;
                case 'serviceCaseId':
                  return row.serviceCaseId ?? '-';
                case 'orderAllocationLineId':
                  return row.orderAllocationLineId ?? '-';
                case 'linkedAt':
                  return formatDate(row.linkedAt);
                default:
                  return null;
              }
            }}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            renderSortIcon={renderSortIcon}
            isLoading={isLoading}
            isError={Boolean(error)}
            errorText={t('serviceAllocation.documentLinks.error', { defaultValue: 'Document links could not be loaded.' })}
            emptyText={t('serviceAllocation.documentLinks.empty', { defaultValue: 'No document links found.' })}
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
            filterColumns={advancedFilterColumns}
            defaultFilterColumn="documentModule"
            draftFilterRows={pagedGrid.draftFilterRows}
            onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
            filterLogic={pagedGrid.filterLogic}
            onFilterLogicChange={pagedGrid.setFilterLogic}
            onApplyFilters={pagedGrid.applyAdvancedFilters}
            onClearFilters={pagedGrid.clearAdvancedFilters}
            appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
            search={{
              value: pagedGrid.searchInput,
              onValueChange: pagedGrid.searchConfig.onValueChange,
              onSearchChange: pagedGrid.searchConfig.onSearchChange,
              placeholder: t('serviceAllocation.documentLinks.search', { defaultValue: 'Search document links...' }),
            }}
            refresh={{
              onRefresh: () => {
                void refetch();
              },
              isLoading: isFetching,
              label: t('common.refresh', { defaultValue: 'Refresh' }),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
