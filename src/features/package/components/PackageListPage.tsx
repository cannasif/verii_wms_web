import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, Eye, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { usePHeaders } from '../hooks/usePHeaders';
import { useDeletePHeader } from '../hooks/useDeletePHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import type { PHeaderDto } from '../types/package';

type PackageColumnKey =
  | 'id'
  | 'packingNo'
  | 'packingDate'
  | 'warehouseCode'
  | 'sourceType'
  | 'matchedSource'
  | 'customerCode'
  | 'customerName'
  | 'status'
  | 'totalPackageCount'
  | 'totalQuantity'
  | 'totalGrossWeight'
  | 'trackingNo'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'id', type: 'number', labelKey: 'package.list.id' },
  { value: 'packingNo', type: 'string', labelKey: 'package.list.packingNo' },
  { value: 'packingDate', type: 'date', labelKey: 'package.list.packingDate' },
  { value: 'warehouseCode', type: 'string', labelKey: 'package.list.warehouseCode' },
  { value: 'customerCode', type: 'string', labelKey: 'package.list.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'package.list.customerName' },
  { value: 'status', type: 'string', labelKey: 'package.list.status' },
  { value: 'trackingNo', type: 'string', labelKey: 'package.list.trackingNo' },
];

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'Draft':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200';
    case 'Packing':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-500/25 dark:text-blue-200';
    case 'Packed':
      return 'bg-green-100 text-green-800 dark:bg-green-500/25 dark:text-green-200';
    case 'Shipped':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/25 dark:text-indigo-200';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-500/25 dark:text-red-200';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200';
  }
};

function mapSortBy(value: PackageColumnKey): string {
  switch (value) {
    case 'id':
      return 'Id';
    case 'packingNo':
      return 'PackingNo';
    case 'packingDate':
      return 'PackingDate';
    case 'warehouseCode':
      return 'WarehouseCode';
    case 'customerCode':
      return 'CustomerCode';
    case 'customerName':
      return 'CustomerName';
    case 'status':
      return 'Status';
    case 'trackingNo':
      return 'TrackingNo';
    case 'totalPackageCount':
      return 'TotalPackageCount';
    case 'totalQuantity':
      return 'TotalQuantity';
    case 'totalGrossWeight':
      return 'TotalGrossWeight';
    default:
      return 'Id';
  }
}

export function PackageListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState<PHeaderDto | null>(null);

  const pagedGrid = usePagedDataGrid<PackageColumnKey>({
    pageKey: 'package-list',
    defaultSortBy: 'id',
    defaultSortDirection: 'desc',
    defaultPageNumber: 1,
    pageNumberBase: 1,
    mapSortBy,
  });

  const deleteMutation = useDeletePHeader();

  useEffect(() => {
    setPageTitle(t('package.list.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<PackageColumnKey>[]>(
    () => [
      { key: 'id', label: t('package.list.id') },
      { key: 'packingNo', label: t('package.list.packingNo') },
      { key: 'packingDate', label: t('package.list.packingDate') },
      { key: 'warehouseCode', label: t('package.list.warehouseCode') },
      { key: 'sourceType', label: t('package.list.sourceType'), sortable: false },
      { key: 'matchedSource', label: t('package.list.matchedSource'), sortable: false },
      { key: 'customerCode', label: t('package.list.customerCode') },
      { key: 'customerName', label: t('package.list.customerName') },
      { key: 'status', label: t('package.list.status') },
      { key: 'totalPackageCount', label: t('package.list.totalPackageCount') },
      { key: 'totalQuantity', label: t('package.list.totalQuantity') },
      { key: 'totalGrossWeight', label: t('package.list.totalGrossWeight') },
      { key: 'trackingNo', label: t('package.list.trackingNo') },
      { key: 'actions', label: t('package.list.actions'), sortable: false },
    ],
    [t],
  );

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey: 'package-list',
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
  });

  const { data, isLoading, isFetching, error } = usePHeaders(pagedGrid.queryParams);

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const exportColumns = useMemo(
    () => orderedVisibleColumns
      .filter((key) => key !== 'actions')
      .map((key) => ({
        key,
        label: columns.find((column) => column.key === key)?.label ?? key,
      })),
    [columns, orderedVisibleColumns],
  );

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as PackageColumnKey[],
    [orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    if (!data?.data) return [];
    return data.data.map((item) => ({
      id: item.id,
      packingNo: item.packingNo || '-',
      packingDate: formatDate(item.packingDate),
      warehouseCode: item.warehouseCode || '-',
      sourceType: item.sourceType ? t(`package.sourceType.${item.sourceType.toUpperCase()}`, item.sourceType) : '-',
      matchedSource: item.sourceHeaderId != null ? `#${item.sourceHeaderId}` : '-',
      customerCode: item.customerCode || '-',
      customerName: item.customerName || '-',
      status: item.status ? t(`package.status.${item.status.toLowerCase()}`, item.status) : '-',
      totalPackageCount: item.totalPackageCount ?? 0,
      totalQuantity: item.totalQuantity ?? 0,
      totalGrossWeight: item.totalGrossWeight ?? 0,
      trackingNo: item.trackingNo || '-',
    }));
  }, [data?.data, t]);

  const handleDelete = async (): Promise<void> => {
    if (!selectedHeader) return;

    try {
      await deleteMutation.mutateAsync(selectedHeader.id);
      toast.success(t('package.list.deleteSuccess'));
      setDeleteDialogOpen(false);
      setSelectedHeader(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('package.list.deleteError'));
    }
  };

  const renderSortIcon = (columnKey: PackageColumnKey): ReactElement | null => {
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
          <CardTitle>{t('package.list.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<PHeaderDto, PackageColumnKey>
            columns={columns}
            visibleColumnKeys={visibleColumnKeys}
            rows={data?.data ?? []}
            rowKey={(row) => row.id}
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'id':
                  return <span className="font-medium">#{row.id}</span>;
                case 'packingNo':
                  return <span className="font-medium">{row.packingNo || '-'}</span>;
                case 'packingDate':
                  return formatDate(row.packingDate);
                case 'warehouseCode':
                  return row.warehouseCode || '-';
                case 'sourceType':
                  return row.sourceType
                    ? <Badge variant="outline">{t(`package.sourceType.${row.sourceType.toUpperCase()}`, row.sourceType)}</Badge>
                    : '-';
                case 'matchedSource':
                  return row.sourceHeaderId != null ? <span className="font-medium">#{row.sourceHeaderId}</span> : '-';
                case 'customerCode':
                  return row.customerCode || '-';
                case 'customerName':
                  return row.customerName || '-';
                case 'status':
                  return (
                    <Badge className={getStatusBadgeColor(row.status)}>
                      {t(`package.status.${row.status.toLowerCase()}`, row.status)}
                    </Badge>
                  );
                case 'totalPackageCount':
                  return row.totalPackageCount || 0;
                case 'totalQuantity':
                  return row.totalQuantity || 0;
                case 'totalGrossWeight':
                  return row.totalGrossWeight || 0;
                case 'trackingNo':
                  return row.trackingNo || '-';
                case 'actions':
                default:
                  return null;
              }
            }}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={(columnKey) => {
              if (columnKey === 'sourceType' || columnKey === 'matchedSource' || columnKey === 'actions') return;
              pagedGrid.handleSort(columnKey);
            }}
            renderSortIcon={renderSortIcon}
            isLoading={isLoading || isFetching}
            isError={Boolean(error)}
            errorText={t('package.list.error')}
            emptyText={t('package.list.noData')}
            showActionsColumn={orderedVisibleColumns.includes('actions')}
            actionsHeaderLabel={t('package.list.actions')}
            renderActionsCell={(row) => (
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/package/detail/${row.id}`)}>
                  <Eye className="size-4" />
                  <span className="ml-2">{t('package.list.detail')}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedHeader(row);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="size-4" />
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
              pageKey: 'package-list',
              userId,
              columns: columns.map(({ key, label }) => ({ key, label })),
              visibleColumns,
              columnOrder,
              onVisibleColumnsChange: setVisibleColumns,
              onColumnOrderChange: setColumnOrder,
              exportFileName: 'package-list',
              exportColumns,
              exportRows,
              filterColumns: advancedFilterColumns,
              defaultFilterColumn: 'packingNo',
              draftFilterRows: pagedGrid.draftFilterRows,
              onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
              filterLogic: pagedGrid.filterLogic,
              onFilterLogicChange: pagedGrid.setFilterLogic,
              onApplyFilters: pagedGrid.applyAdvancedFilters,
              onClearFilters: pagedGrid.clearAdvancedFilters,
              translationNamespace: 'common',
              appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
              search: {
                ...pagedGrid.searchConfig,
                placeholder: t('package.list.searchPlaceholder'),
                className: 'h-9 w-full md:w-64',
              },
              leftSlot: (
                <div className="flex items-center gap-2">
                  <VoiceSearchButton
                    onResult={pagedGrid.handleVoiceSearch}
                    size="sm"
                    variant="outline"
                  />
                  <Button onClick={() => navigate('/package/create')}>
                    <Plus className="mr-2 size-4" />
                    {t('package.list.createNew')}
                  </Button>
                </div>
              ),
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('package.list.deleteConfirm')}</DialogTitle>
            <DialogDescription>{t('package.list.deleteConfirmMessage')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? t('common.loading') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
