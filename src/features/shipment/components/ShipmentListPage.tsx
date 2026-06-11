import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Pencil, Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { PermissionNotice } from '@/features/access-control/components/PermissionNotice';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useShipmentHeadersPaged } from '../hooks/useShipmentHeaders';
import type { ShipmentHeader } from '../types/shipment';
import { ShipmentDetailDialog } from './ShipmentDetailDialog';
import { shipmentApi } from '../api/shipment-api';

type ShipmentColumnKey =
  | 'documentNo'
  | 'documentDate'
  | 'customerCode'
  | 'customerName'
  | 'sourceWarehouse'
  | 'targetWarehouse'
  | 'documentType'
  | 'status'
  | 'createdDate'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'shipment.list.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'shipment.list.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'shipment.list.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'shipment.list.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'shipment.list.sourceWarehouse' },
  { value: 'targetWarehouse', type: 'string', labelKey: 'shipment.list.targetWarehouse' },
  { value: 'documentType', type: 'string', labelKey: 'shipment.list.documentType' },
  { value: 'isCompleted', type: 'boolean', labelKey: 'shipment.list.status' },
];

function mapSortBy(value: ShipmentColumnKey): string {
  switch (value) {
    case 'documentNo':
      return 'DocumentNo';
    case 'documentDate':
      return 'DocumentDate';
    case 'customerCode':
      return 'CustomerCode';
    case 'customerName':
      return 'CustomerName';
    case 'sourceWarehouse':
      return 'SourceWarehouse';
    case 'targetWarehouse':
      return 'TargetWarehouse';
    case 'documentType':
      return 'DocumentType';
    case 'createdDate':
    default:
      return 'CreatedDate';
  }
}

export function ShipmentListPage(): ReactElement {
  const { t } = useTranslation(['shipment', 'common']);
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.shipment');
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [headerToDelete, setHeaderToDelete] = useState<ShipmentHeader | null>(null);

  const pagedGrid = usePagedDataGrid<ShipmentColumnKey>({
    pageKey: 'shipment-list',
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('shipment.list.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<ShipmentColumnKey>[]>(
    () => [
      { key: 'documentNo', label: t('shipment.list.documentNo') },
      { key: 'documentDate', label: t('shipment.list.documentDate') },
      { key: 'customerCode', label: t('shipment.list.customerCode') },
      { key: 'customerName', label: t('shipment.list.customerName') },
      { key: 'sourceWarehouse', label: t('shipment.list.sourceWarehouse') },
      { key: 'targetWarehouse', label: t('shipment.list.targetWarehouse') },
      { key: 'documentType', label: t('shipment.list.documentType') },
      { key: 'status', label: t('shipment.list.status'), sortable: false },
      { key: 'createdDate', label: t('shipment.list.createdDate') },
      { key: 'actions', label: t('shipment.list.actions'), sortable: false },
    ],
    [t],
  );

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey: 'shipment-list',
    columns: columns.map(({ key, label }) => ({ key, label })),
  });

  const { data, isLoading, error, refetch } = useShipmentHeadersPaged(pagedGrid.queryParams);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => shipmentApi.deleteShipmentHeader(id),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('common.errors.deleteFailed'));
      }
      toast.success(response.message || t('common.deleteSuccess'));
      setHeaderToDelete(null);
      await refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message || t('common.errors.deleteFailed'));
    },
  });

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = useCallback((item: ShipmentHeader): string => {
    if (item.isCompleted) return t('shipment.list.completed');
    if (item.isPendingApproval) return t('shipment.list.pendingApproval');
    return t('shipment.list.inProgress');
  }, [t]);

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
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as ShipmentColumnKey[],
    [orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    if (!data?.data) return [];
    return data.data.map((item) => ({
      documentNo: item.documentNo || '-',
      documentDate: formatDate(item.documentDate),
      customerCode: item.customerCode || '-',
      customerName: item.customerName || '-',
      sourceWarehouse: item.sourceWarehouse || '-',
      targetWarehouse: item.targetWarehouse || '-',
      documentType: item.documentType || '-',
      status: getStatusLabel(item),
      createdDate: formatDateTime(item.createdDate),
    }));
  }, [data?.data, getStatusLabel]);

  const renderSortIcon = (columnKey: ShipmentColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
  });

  return (
    <div className="crm-page space-y-6">
      {!permission.canMutate ? <PermissionNotice /> : null}
      <Card>
        <CardHeader>
          <CardTitle>{t('shipment.list.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<ShipmentHeader, ShipmentColumnKey>
            columns={columns}
            visibleColumnKeys={visibleColumnKeys}
            rows={data?.data ?? []}
            rowKey={(row) => row.id}
            renderCell={(row, columnKey) => {
              switch (columnKey) {
                case 'documentNo':
                  return <span className="font-medium">{row.documentNo || '-'}</span>;
                case 'documentDate':
                  return formatDate(row.documentDate);
                case 'customerCode':
                  return row.customerCode || '-';
                case 'customerName':
                  return row.customerName || '-';
                case 'sourceWarehouse':
                  return row.sourceWarehouse || '-';
                case 'targetWarehouse':
                  return row.targetWarehouse || '-';
                case 'documentType':
                  return <Badge variant="outline">{row.documentType || '-'}</Badge>;
                case 'status':
                  return row.isCompleted ? (
                    <Badge variant="default" className="w-fit">{t('shipment.list.completed')}</Badge>
                  ) : row.isPendingApproval ? (
                    <Badge variant="secondary" className="w-fit">{t('shipment.list.pendingApproval')}</Badge>
                  ) : (
                    <Badge variant="outline" className="w-fit">{t('shipment.list.inProgress')}</Badge>
                  );
                case 'createdDate':
                  return formatDateTime(row.createdDate);
                case 'actions':
                default:
                  return null;
              }
            }}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={(columnKey) => {
              if (columnKey === 'status' || columnKey === 'actions') return;
              pagedGrid.handleSort(columnKey);
            }}
            renderSortIcon={renderSortIcon}
            isLoading={isLoading}
            isError={Boolean(error)}
            errorText={t('shipment.list.error')}
            emptyText={t('shipment.list.noData')}
            showActionsColumn={orderedVisibleColumns.includes('actions') && (permission.canView || permission.canUpdate || permission.canDelete)}
            actionsHeaderLabel={t('shipment.list.actions')}
            renderActionsCell={(row) => (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedHeaderId(row.id)} disabled={!permission.canView}>
                  <Eye className="size-4" />
                  <span className="ml-2">{t('shipment.list.viewDetails')}</span>
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/shipment/edit/${row.id}`)} disabled={!permission.canUpdate || row.isCompleted}>
                  <Pencil className="size-4" />
                  <span className="ml-2">{t('common.edit')}</span>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setHeaderToDelete(row)} disabled={!permission.canDelete || deleteMutation.isPending}>
                  <Trash2 className="size-4" />
                  <span className="ml-2">{t('common.delete')}</span>
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
              pageKey: 'shipment-list',
              userId,
              columns: columns.map(({ key, label }) => ({ key, label })),
              visibleColumns,
              columnOrder,
              onVisibleColumnsChange: setVisibleColumns,
              onColumnOrderChange: setColumnOrder,
              exportFileName: 'shipment-list',
              exportColumns,
              exportRows,
              filterColumns: advancedFilterColumns,
              defaultFilterColumn: 'documentNo',
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
                placeholder: t('shipment.list.searchPlaceholder'),
                className: 'h-9 w-full md:w-64',
              },
              leftSlot: (
                <VoiceSearchButton
                  onResult={pagedGrid.handleVoiceSearch}
                  size="sm"
                  variant="outline"
                />
              ),
            }}
          />
        </CardContent>
      </Card>

      <ShipmentDetailDialog
        headerId={selectedHeaderId ?? 0}
        isOpen={selectedHeaderId !== null}
        onClose={() => setSelectedHeaderId(null)}
      />
      <DeleteConfirmDialog
        open={Boolean(headerToDelete)}
        itemLabel={headerToDelete?.documentNo || `#${headerToDelete?.id ?? ''}`}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setHeaderToDelete(null);
        }}
        onConfirm={() => {
          if (headerToDelete) deleteMutation.mutate(headerToDelete.id);
        }}
      />
    </div>
  );
}
