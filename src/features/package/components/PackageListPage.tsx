import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { usePHeaders } from '../hooks/usePHeaders';
import { useDeletePHeader } from '../hooks/useDeletePHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { DeleteConfirmDialog, OpsActionButton, OpsListPageShell, PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { cn } from '@/lib/utils';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
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

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  id: 7,
  packingNo: 12,
  packingDate: 10,
  warehouseCode: 9,
  sourceType: 9,
  matchedSource: 9,
  customerCode: 10,
  customerName: 12,
  status: 9,
  totalPackageCount: 8,
  totalQuantity: 8,
  totalGrossWeight: 9,
  trackingNo: 10,
};

const ACTIONS_COLUMN_WEIGHT = 8;

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
  const { t } = useTranslation(['package', 'common']);
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.package');
  const canUpdate = permission.canUpdate;
  const pageKey = 'package-list';
  const showActionsColumn = permission.canView || canUpdate || permission.canDelete;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState<PHeaderDto | null>(null);

  const pagedGrid = usePagedDataGrid<PackageColumnKey>({
    pageKey,
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
      {
        key: 'id',
        label: t('package.list.id'),
        headClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
        cellClassName: 'wms-ops-table-id-col wms-ops-table-center-col',
      },
      { key: 'packingNo', label: t('package.list.packingNo') },
      { key: 'packingDate', label: t('package.list.packingDate'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'warehouseCode', label: t('package.list.warehouseCode'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'sourceType', label: t('package.list.sourceType'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'matchedSource', label: t('package.list.matchedSource'), sortable: false, headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'customerCode', label: t('package.list.customerCode') },
      { key: 'customerName', label: t('package.list.customerName') },
      { key: 'status', label: t('package.list.status'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'totalPackageCount', label: t('package.list.totalPackageCount'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'totalQuantity', label: t('package.list.totalQuantity'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'totalGrossWeight', label: t('package.list.totalGrossWeight'), headClassName: 'wms-ops-table-center-col', cellClassName: 'wms-ops-table-center-col' },
      { key: 'trackingNo', label: t('package.list.trackingNo') },
      { key: 'actions', label: t('package.list.actions'), sortable: false },
    ],
    [t],
  );

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, columnWidths, setColumnOrder, setVisibleColumns, resizeColumnPair } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
    idColumnKey: 'id',
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    actionsColumnWeight: ACTIONS_COLUMN_WEIGHT,
    includeActionsColumn: showActionsColumn,
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

  const getCellText = (row: PHeaderDto, key: PackageColumnKey): string | undefined => {
    switch (key) {
      case 'id':
        return String(row.id);
      case 'packingNo':
        return row.packingNo || '-';
      case 'packingDate':
        return formatDate(row.packingDate);
      case 'warehouseCode':
        return row.warehouseCode || '-';
      case 'sourceType':
        return row.sourceType ? t(`package.sourceType.${row.sourceType.toUpperCase()}`, row.sourceType) : '-';
      case 'matchedSource':
        return row.sourceHeaderId != null ? `#${row.sourceHeaderId}` : '-';
      case 'customerCode':
        return row.customerCode || '-';
      case 'customerName':
        return row.customerName || '-';
      case 'status':
        return row.status ? t(`package.status.${row.status.toLowerCase()}`, row.status) : '-';
      case 'totalPackageCount':
        return String(row.totalPackageCount ?? 0);
      case 'totalQuantity':
        return String(row.totalQuantity ?? 0);
      case 'totalGrossWeight':
        return String(row.totalGrossWeight ?? 0);
      case 'trackingNo':
        return row.trackingNo || '-';
      default:
        return undefined;
    }
  };

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
  });

  return (
    <>
      <OpsListPageShell
        eyebrow={
          <>
            <span>{t('package.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('package.create.breadcrumb.module')}</span>
          </>
        }
        title={t('package.list.title')}
        description={t('package.list.subtitle')}
        actions={
          permission.canCreate ? (
            <OpsActionButton type="button" variant="primary" onClick={() => navigate('/package/create')}>
              <Plus className="size-3.5" aria-hidden />
              {t('package.list.createNew')}
            </OpsActionButton>
          ) : null
        }
      >
        {!permission.canMutate ? <PermissionNotice /> : null}

        <PagedDataGrid<PHeaderDto, PackageColumnKey>
          variant="ops"
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          defaultColumnWidths={DEFAULT_COLUMN_WIDTHS}
          columnWidths={columnWidths}
          onResizeColumnPair={resizeColumnPair}
          getCellText={getCellText}
          rows={data?.data ?? []}
            rowKey={(row) => row.id}
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'id':
                  return <span className="wms-ops-table-id-value">#{row.id}</span>;
                case 'packingNo':
                  return <span className="font-medium font-mono text-xs">{row.packingNo || '-'}</span>;
                case 'packingDate':
                  return <span className="font-mono text-xs">{formatDate(row.packingDate)}</span>;
                case 'warehouseCode':
                  return row.warehouseCode || '-';
                case 'sourceType':
                  return row.sourceType
                    ? <Badge variant="outline" className="wms-ops-code-badge mx-auto rounded-none text-[0.625rem]">{t(`package.sourceType.${row.sourceType.toUpperCase()}`, row.sourceType)}</Badge>
                    : '-';
                case 'matchedSource':
                  return row.sourceHeaderId != null ? <span className="font-medium">#{row.sourceHeaderId}</span> : '-';
                case 'customerCode':
                  return row.customerCode || '-';
                case 'customerName':
                  return row.customerName || '-';
                case 'status': {
                  const statusKey = row.status?.toLowerCase() ?? '';
                  const statusClass =
                    statusKey === 'packed' || statusKey === 'shipped'
                      ? 'wms-ops-status-badge--done'
                      : statusKey === 'packing' || statusKey === 'open'
                        ? 'wms-ops-status-badge--active'
                        : statusKey === 'cancelled'
                          ? 'wms-ops-status-badge--danger'
                          : 'wms-ops-status-badge--pending';
                  return (
                    <Badge variant="outline" className={cn('wms-ops-status-badge mx-auto', statusClass)}>
                      {t(`package.status.${statusKey}`, row.status)}
                    </Badge>
                  );
                }
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
            showActionsColumn={showActionsColumn && orderedVisibleColumns.includes('actions')}
            actionsHeaderLabel={t('common.actions')}
            iconOnlyActions={false}
            actionsCellClassName="wms-ops-table-actions-col"
            renderActionsCell={(row) => (
              <div className="wms-ops-row-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn"
                  aria-label={t('package.list.detail')}
                  title={t('package.list.detail')}
                  onClick={() => navigate(`/package/detail/${row.id}`)}
                  disabled={!permission.canView}
                >
                  <Eye className="size-3" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wms-ops-grid-icon-btn"
                  aria-label={t('common.edit')}
                  title={t('common.edit')}
                  onClick={() => navigate(`/package/edit/${row.id}`)}
                  disabled={!canUpdate}
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
                  onClick={() => {
                    if (!permission.canDelete) return;
                    setSelectedHeader(row);
                    setDeleteDialogOpen(true);
                  }}
                  disabled={!permission.canDelete}
                >
                  <Trash2 className="size-3" aria-hidden />
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
              pageKey,
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
              },
              leftSlot: (
                <VoiceSearchButton
                  onResult={pagedGrid.handleVoiceSearch}
                  size="icon"
                  variant="ghost"
                  className="wms-ops-voice-btn"
                />
              ),
              variant: 'ops',
            }}
          />
      </OpsListPageShell>

      <DeleteConfirmDialog
        open={permission.canDelete && deleteDialogOpen}
        title={t('package.list.deleteConfirm')}
        description={t('package.list.deleteConfirmMessage')}
        isPending={deleteMutation.isPending}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
