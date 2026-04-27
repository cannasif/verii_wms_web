import { type ReactElement, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { vehicleCheckInApi } from '../api/vehicle-check-in.api';
import type { VehicleCheckInPagedRowDto } from '../types/vehicle-check-in.types';

type VehicleCheckInColumnKey =
  | 'plateNo'
  | 'entryDate'
  | 'entryDay'
  | 'firstName'
  | 'lastName'
  | 'customer'
  | 'imageCount'
  | 'actions';

function mapSortBy(value: VehicleCheckInColumnKey): string {
  switch (value) {
    case 'plateNo':
      return 'PlateNo';
    case 'entryDate':
      return 'EntryDate';
    case 'entryDay':
      return 'EntryDay';
    case 'firstName':
      return 'FirstName';
    case 'lastName':
      return 'LastName';
    case 'customer':
      return 'CustomerName';
    case 'imageCount':
      return 'Id';
    default:
      return 'Id';
  }
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('tr-TR');
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('tr-TR');
}

function buildCustomerLabel(row: VehicleCheckInPagedRowDto): string {
  return [row.customerCode, row.customerName].filter(Boolean).join(' - ') || '-';
}

export function VehicleCheckInListPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const navigate = useNavigate();
  const pageKey = 'vehicle-check-in-list';

  const pagedGrid = usePagedDataGrid<VehicleCheckInColumnKey>({
    pageKey,
    defaultSortBy: 'entryDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    defaultPageNumber: 1,
    pageNumberBase: 1,
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('vehicleCheckIn.list.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<VehicleCheckInColumnKey>[]>(() => [
    { key: 'plateNo', label: t('vehicleCheckIn.list.columns.plate') },
    { key: 'entryDate', label: t('vehicleCheckIn.list.columns.entryDate') },
    { key: 'entryDay', label: t('vehicleCheckIn.fields.entryDate') },
    { key: 'firstName', label: t('vehicleCheckIn.list.columns.firstName') },
    { key: 'lastName', label: t('vehicleCheckIn.list.columns.lastName') },
    { key: 'customer', label: t('vehicleCheckIn.list.columns.customer') },
    { key: 'imageCount', label: t('vehicleCheckIn.list.columns.images') },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'plateNo',
  });

  const query = useQuery({
    queryKey: ['vehicle-check-in', 'list', pagedGrid.queryParams],
    queryFn: () => vehicleCheckInApi.getPaged(pagedGrid.queryParams),
  });

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as VehicleCheckInColumnKey[],
    [orderedVisibleColumns],
  );

  const exportColumns = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions').map((key) => ({
      key,
      label: columns.find((column) => column.key === key)?.label ?? key,
    })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => (
    (query.data?.data ?? []).map((row) => ({
      plateNo: row.plateNo,
      entryDate: formatDateTime(row.entryDate),
      entryDay: formatDate(row.entryDay),
      firstName: row.firstName || '-',
      lastName: row.lastName || '-',
      customer: buildCustomerLabel(row),
      imageCount: row.imageCount,
    }))
  ), [query.data?.data]);

  const range = getPagedRange(query.data, 1);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const renderSortIcon = (columnKey: VehicleCheckInColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) {
      return null;
    }

    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="crm-page space-y-6">
      <Badge variant="secondary">{t('vehicleCheckIn.badge')}</Badge>

      <PagedDataGrid<VehicleCheckInPagedRowDto, VehicleCheckInColumnKey>
        pageKey={pageKey}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={query.data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(row, columnKey) => {
          switch (columnKey) {
            case 'plateNo':
              return <span className="font-medium">{row.plateNo}</span>;
            case 'entryDate':
              return formatDateTime(row.entryDate);
            case 'entryDay':
              return formatDate(row.entryDay);
            case 'firstName':
              return row.firstName || '-';
            case 'lastName':
              return row.lastName || '-';
            case 'customer':
              return buildCustomerLabel(row);
            case 'imageCount':
              return row.imageCount;
            default:
              return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={(columnKey) => {
          if (columnKey !== 'actions') {
            pagedGrid.handleSort(columnKey);
          }
        }}
        renderSortIcon={renderSortIcon}
        isLoading={query.isLoading}
        isError={Boolean(query.error)}
        errorText={query.error instanceof Error ? query.error.message : t('common.generalError')}
        emptyText={t('vehicleCheckIn.list.empty')}
        showActionsColumn={orderedVisibleColumns.includes('actions')}
        actionsHeaderLabel={t('common.actions')}
        renderActionsCell={(row) => (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => navigate(`/vehicle-check-in?id=${row.id}`)}>
              {t('vehicleCheckIn.list.actions.open')}
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
          exportFileName: 'vehicle-check-in-list',
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
            placeholder: t('vehicleCheckIn.list.searchPh'),
          },
          leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
          refresh: {
            onRefresh: () => {
              void query.refetch();
            },
            isLoading: query.isLoading,
            label: t('common.refresh'),
          },
        }}
      />
    </div>
  );
}
