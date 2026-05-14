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
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useWarehouseOutboundHeadersPaged } from '../hooks/useWarehouseHeaders';
import type { WarehouseHeader } from '../types/warehouse';
import { WarehouseDetailDialog } from './WarehouseDetailDialog';
import { warehouseApi } from '../api/warehouse-api';

type WarehouseOutboundColumnKey =
  | 'documentNo'
  | 'documentDate'
  | 'customerCode'
  | 'customerName'
  | 'sourceWarehouse'
  | 'documentType'
  | 'status'
  | 'createdDate'
  | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'documentNo', type: 'string', labelKey: 'warehouse.outbound.list.documentNo' },
  { value: 'documentDate', type: 'date', labelKey: 'warehouse.outbound.list.documentDate' },
  { value: 'customerCode', type: 'string', labelKey: 'warehouse.outbound.list.customerCode' },
  { value: 'customerName', type: 'string', labelKey: 'warehouse.outbound.list.customerName' },
  { value: 'sourceWarehouse', type: 'string', labelKey: 'warehouse.outbound.list.sourceWarehouse' },
  { value: 'documentType', type: 'string', labelKey: 'warehouse.outbound.list.documentType' },
  { value: 'isCompleted', type: 'boolean', labelKey: 'warehouse.outbound.list.status' },
];

function mapSortBy(value: WarehouseOutboundColumnKey): string {
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
    case 'documentType':
      return 'DocumentType';
    case 'createdDate':
    default:
      return 'CreatedDate';
  }
}

export function WarehouseOutboundListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.warehouse.outbound');
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [headerToDelete, setHeaderToDelete] = useState<WarehouseHeader | null>(null);

  const pagedGrid = usePagedDataGrid<WarehouseOutboundColumnKey>({
    pageKey: 'warehouse-outbound-list',
    defaultSortBy: 'createdDate',
    defaultSortDirection: 'desc',
    mapSortBy,
  });

  useEffect(() => {
    setPageTitle(t('warehouse.outbound.list.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const columns = useMemo<PagedDataGridColumn<WarehouseOutboundColumnKey>[]>(
    () => [
      { key: 'documentNo', label: t('warehouse.outbound.list.documentNo') },
      { key: 'documentDate', label: t('warehouse.outbound.list.documentDate') },
      { key: 'customerCode', label: t('warehouse.outbound.list.customerCode') },
      { key: 'customerName', label: t('warehouse.outbound.list.customerName') },
      { key: 'sourceWarehouse', label: t('warehouse.outbound.list.sourceWarehouse') },
      { key: 'documentType', label: t('warehouse.outbound.list.documentType') },
      { key: 'status', label: t('warehouse.outbound.list.status'), sortable: false },
      { key: 'createdDate', label: t('warehouse.outbound.list.createdDate') },
      { key: 'actions', label: t('warehouse.outbound.list.actions'), sortable: false },
    ],
    [t],
  );

  const { data, isLoading, error, refetch } = useWarehouseOutboundHeadersPaged(pagedGrid.queryParams);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => warehouseApi.deleteOutboundHeader(id),
    onSuccess: async (response) => {
      if (!response.success) {
        throw new Error(response.message || t('common.errors.deleteFailed'));
      }
      toast.success(response.message || t('common.deleteSuccess', { defaultValue: 'Kayıt silindi.' }));
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

  const getStatusLabel = useCallback((item: WarehouseHeader): string => {
    if (item.isCompleted) return t('warehouse.outbound.list.completed');
    if (item.isPendingApproval) return t('warehouse.outbound.list.pendingApproval');
    return t('warehouse.outbound.list.inProgress');
  }, [t]);

  const handleRowClick = (header: WarehouseHeader): void => {
    setSelectedHeaderId(header.id);
    setSelectedDocumentType(header.documentType);
  };

  const exportColumns = useMemo(
    () => columns
      .filter((column) => column.key !== 'actions')
      .map((column) => ({
        key: column.key,
        label: column.label,
      })),
    [columns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    if (!data?.data) return [];
    return data.data.map((item) => ({
      documentNo: item.documentNo || '-',
      documentDate: formatDate(item.documentDate),
      customerCode: item.customerCode || '-',
      customerName: item.customerName || '-',
      sourceWarehouse: item.sourceWarehouse || '-',
      documentType: item.documentType || '-',
      status: getStatusLabel(item),
      createdDate: formatDateTime(item.createdDate),
    }));
  }, [data?.data, getStatusLabel]);

  const renderSortIcon = (columnKey: WarehouseOutboundColumnKey): ReactElement | null => {
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
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  return (
    <div className="crm-page space-y-6">
      {!permission.canMutate ? <PermissionNotice /> : null}
      <Card>
        <CardHeader>
          <CardTitle>{t('warehouse.outbound.list.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PagedDataGrid<WarehouseHeader, WarehouseOutboundColumnKey>
            pageKey="warehouse-outbound-list"
            columns={columns}
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
                case 'documentType':
                  return <Badge variant="outline">{row.documentType || '-'}</Badge>;
                case 'status':
                  return row.isCompleted ? (
                    <Badge variant="default" className="w-fit">{t('warehouse.outbound.list.completed')}</Badge>
                  ) : row.isPendingApproval ? (
                    <Badge variant="secondary" className="w-fit">{t('warehouse.outbound.list.pendingApproval')}</Badge>
                  ) : (
                    <Badge variant="outline" className="w-fit">{t('warehouse.outbound.list.inProgress')}</Badge>
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
            errorText={t('warehouse.outbound.list.error')}
            emptyText={t('warehouse.outbound.list.noData')}
            rowClassName="cursor-pointer"
            onRowClick={permission.canView ? handleRowClick : undefined}
            showActionsColumn={permission.canView || permission.canUpdate || permission.canDelete}
            actionsHeaderLabel={t('warehouse.outbound.list.actions')}
            renderActionsCell={(row) => (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleRowClick(row)} disabled={!permission.canView}>
                  <Eye className="size-4" />
                  <span className="ml-2">{t('warehouse.outbound.list.viewDetails')}</span>
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/warehouse/outbound/edit/${row.id}`)} disabled={!permission.canUpdate || row.isCompleted}>
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
            exportFileName="warehouse-outbound-list"
            exportColumns={exportColumns}
            exportRows={exportRows}
            filterColumns={advancedFilterColumns}
            defaultFilterColumn="documentNo"
            draftFilterRows={pagedGrid.draftFilterRows}
            onDraftFilterRowsChange={pagedGrid.setDraftFilterRows}
            filterLogic={pagedGrid.filterLogic}
            onFilterLogicChange={pagedGrid.setFilterLogic}
            onApplyFilters={pagedGrid.applyAdvancedFilters}
            onClearFilters={pagedGrid.clearAdvancedFilters}
            translationNamespace="common"
            appliedFilterCount={pagedGrid.appliedAdvancedFilters.length}
            search={{
              ...pagedGrid.searchConfig,
              placeholder: t('warehouse.outbound.list.searchPlaceholder'),
              className: 'h-9 w-full md:w-64',
            }}
            leftSlot={(
              <VoiceSearchButton
                onResult={pagedGrid.handleVoiceSearch}
                size="sm"
                variant="outline"
              />
            )}
          />
        </CardContent>
      </Card>

      <WarehouseDetailDialog
        headerId={selectedHeaderId ?? 0}
        documentType={selectedDocumentType ?? ''}
        isOpen={selectedHeaderId !== null}
        onClose={() => {
          setSelectedHeaderId(null);
          setSelectedDocumentType(null);
        }}
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
