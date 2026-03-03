import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { useAwaitingApprovalShipmentHeaders } from '../hooks/useAwaitingApprovalHeaders';
import { useApproveShipment } from '../hooks/useApproveShipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShipmentDetailDialog } from './ShipmentDetailDialog';
import { Eye, Search, Check, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { toast } from 'sonner';
import type { ShipmentHeader } from '../types/shipment';
import type { PagedFilter } from '@/types/api';
import { AdvancedFilter, ColumnPreferencesPopover, GridExportMenu, type ColumnDef } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePageSizePreference } from '@/hooks/usePageSizePreference';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GridExportColumn } from '@/lib/grid-export';
import type { FilterColumnConfig, FilterRow } from '@/lib/advanced-filter-types';
import { rowsToBackendFilters } from '@/lib/advanced-filter-types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function ShipmentApprovalPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(0);
  const { pageSize, pageSizeOptions, setPageSize } = usePageSizePreference({
    pageKey: 'shipment-approval-list',
    defaultPageSize: 10,
  });
  const [sortBy] = useState<string>('Id');
  const [sortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [draftFilterRows, setDraftFilterRows] = useState<FilterRow[]>([]);
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = useState<PagedFilter[]>([]);
  const columns = useMemo<ColumnDef[]>(
    () => [
      { key: 'id', label: t('shipment.approval.id') },
      { key: 'documentNo', label: t('shipment.approval.documentNo') },
      { key: 'documentDate', label: t('shipment.approval.documentDate') },
      { key: 'customerCode', label: t('shipment.approval.customerCode') },
      { key: 'customerName', label: t('shipment.approval.customerName') },
      { key: 'sourceWarehouse', label: t('shipment.approval.sourceWarehouse') },
      { key: 'targetWarehouse', label: t('shipment.approval.targetWarehouse') },
      { key: 'completionDate', label: t('shipment.approval.completionDate') },
      { key: 'actions', label: t('shipment.approval.actions') },
    ],
    [t]
  );
  const advancedFilterColumns = useMemo<readonly FilterColumnConfig[]>(
    () => [
      { value: 'id', type: 'number', labelKey: 'shipment.approval.id' },
      { value: 'documentNo', type: 'string', labelKey: 'shipment.approval.documentNo' },
      { value: 'documentDate', type: 'date', labelKey: 'shipment.approval.documentDate' },
      { value: 'customerCode', type: 'string', labelKey: 'shipment.approval.customerCode' },
      { value: 'customerName', type: 'string', labelKey: 'shipment.approval.customerName' },
      { value: 'sourceWarehouse', type: 'string', labelKey: 'shipment.approval.sourceWarehouse' },
      { value: 'targetWarehouse', type: 'string', labelKey: 'shipment.approval.targetWarehouse' },
      { value: 'completionDate', type: 'date', labelKey: 'shipment.approval.completionDate' },
    ],
    []
  );
  const {
    userId,
    columnOrder,
    visibleColumns,
    orderedVisibleColumns,
    setColumnOrder,
    setVisibleColumns,
  } = useColumnPreferences({
    pageKey: 'shipment-approval-list',
    columns,
    idColumnKey: 'id',
  });

  const filters: PagedFilter[] = useMemo(() => {
    const result: PagedFilter[] = [];
    if (searchTerm) {
      result.push({ column: 'documentNo', operator: 'contains', value: searchTerm });
    }
    result.push(...appliedAdvancedFilters);
    return result;
  }, [searchTerm, appliedAdvancedFilters]);

  const applyAdvancedFilters = (): void => {
    setAppliedAdvancedFilters(rowsToBackendFilters(draftFilterRows));
    setPageNumber(0);
    setFilterPopoverOpen(false);
  };

  const clearAdvancedFilters = (): void => {
    setDraftFilterRows([]);
    setAppliedAdvancedFilters([]);
    setPageNumber(0);
    setFilterPopoverOpen(false);
  };

  const { data, isLoading, error } = useAwaitingApprovalShipmentHeaders({
    pageNumber,
    pageSize,
    sortBy,
    sortDirection,
    filters,
  });
  const approveMutation = useApproveShipment();

  useEffect(() => {
    setPageTitle(t('shipment.approval.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

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

  const handleApprove = async (id: number): Promise<void> => {
    try {
      await approveMutation.mutateAsync({ id, approved: true });
      toast.success(t('shipment.approval.approveSuccess'));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('shipment.approval.approveError')
      );
    }
  };

  const handleReject = async (id: number): Promise<void> => {
    try {
      await approveMutation.mutateAsync({ id, approved: false });
      toast.success(t('shipment.approval.rejectSuccess'));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('shipment.approval.rejectError')
      );
    }
  };

  const handlePreviousPage = (): void => {
    if (data?.hasPreviousPage) {
      setPageNumber((prev) => prev - 1);
    }
  };

  const handleNextPage = (): void => {
    if (data?.hasNextPage) {
      setPageNumber((prev) => prev + 1);
    }
  };

  const exportColumns = useMemo<GridExportColumn[]>(
    () =>
      orderedVisibleColumns
        .filter((key) => key !== 'actions')
        .map((key) => ({
          key,
          label: columns.find((column) => column.key === key)?.label ?? key,
        })),
    [columns, orderedVisibleColumns]
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    if (!data?.data) return [];
    return data.data.map((item) => ({
      id: item.id,
      documentNo: item.documentNo || '-',
      documentDate: formatDate(item.documentDate),
      customerCode: item.customerCode || '-',
      customerName: item.customerName || '-',
      sourceWarehouse: item.sourceWarehouse || '-',
      targetWarehouse: item.targetWarehouse || '-',
      completionDate: formatDateTime(item.completionDate),
    }));
  }, [data?.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">
          {t('shipment.approval.error')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>{t('shipment.approval.title')}</CardTitle>
            <div className="flex items-center gap-2">
              <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-dashed border-slate-300 dark:border-white/20 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-xs sm:text-sm"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {t('common.filter')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-full min-w-[320px] max-w-[420px] p-0 bg-white/95 dark:bg-[#1a1025]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-xl rounded-xl z-50"
                >
                  <AdvancedFilter
                    columns={advancedFilterColumns}
                    defaultColumn="documentNo"
                    draftRows={draftFilterRows}
                    onDraftRowsChange={setDraftFilterRows}
                    onSearch={applyAdvancedFilters}
                    onClear={clearAdvancedFilters}
                    embedded
                  />
                </PopoverContent>
              </Popover>
              <GridExportMenu
                fileName="shipment-approval-list"
                columns={exportColumns}
                rows={exportRows}
              />
              <ColumnPreferencesPopover
                pageKey="shipment-approval-list"
                userId={userId}
                columns={columns}
                visibleColumns={visibleColumns}
                columnOrder={columnOrder}
                lockedKeys={['id']}
                onVisibleColumnsChange={setVisibleColumns}
                onColumnOrderChange={setColumnOrder}
              />
              <div className="relative flex items-center w-full md:w-auto">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder={t('shipment.approval.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPageNumber(0);
                  }}
                  className="pl-8 pr-10 w-full md:w-64"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <VoiceSearchButton
                    onResult={(text) => setSearchTerm(text)}
                    size="sm"
                    variant="ghost"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {orderedVisibleColumns.map((key) => {
                    if (key === 'id') return <TableHead key={key}>{t('shipment.approval.id')}</TableHead>;
                    if (key === 'documentNo') return <TableHead key={key}>{t('shipment.approval.documentNo')}</TableHead>;
                    if (key === 'documentDate') return <TableHead key={key}>{t('shipment.approval.documentDate')}</TableHead>;
                    if (key === 'customerCode') return <TableHead key={key}>{t('shipment.approval.customerCode')}</TableHead>;
                    if (key === 'customerName') return <TableHead key={key}>{t('shipment.approval.customerName')}</TableHead>;
                    if (key === 'sourceWarehouse') return <TableHead key={key}>{t('shipment.approval.sourceWarehouse')}</TableHead>;
                    if (key === 'targetWarehouse') return <TableHead key={key}>{t('shipment.approval.targetWarehouse')}</TableHead>;
                    if (key === 'completionDate') return <TableHead key={key}>{t('shipment.approval.completionDate')}</TableHead>;
                    if (key === 'actions') return <TableHead key={key}>{t('shipment.approval.actions')}</TableHead>;
                    return null;
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data && data.data.length > 0 ? (
                  data.data.map((item: ShipmentHeader) => (
                    <TableRow key={item.id}>
                      {orderedVisibleColumns.map((key) => {
                        if (key === 'id') return <TableCell key={key}>{item.id}</TableCell>;
                        if (key === 'documentNo') return <TableCell key={key} className="font-medium">{item.documentNo || '-'}</TableCell>;
                        if (key === 'documentDate') return <TableCell key={key}>{formatDate(item.documentDate)}</TableCell>;
                        if (key === 'customerCode') return <TableCell key={key}>{item.customerCode || '-'}</TableCell>;
                        if (key === 'customerName') return <TableCell key={key}>{item.customerName || '-'}</TableCell>;
                        if (key === 'sourceWarehouse') return <TableCell key={key}>{item.sourceWarehouse || '-'}</TableCell>;
                        if (key === 'targetWarehouse') return <TableCell key={key}>{item.targetWarehouse || '-'}</TableCell>;
                        if (key === 'completionDate') return <TableCell key={key}>{formatDateTime(item.completionDate)}</TableCell>;
                        if (key === 'actions') {
                          return (
                            <TableCell key={key}>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedHeaderId(item.id)}
                                >
                                  <Eye className="size-4" />
                                  <span className="ml-2">{t('shipment.approval.viewDetails')}</span>
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApprove(item.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <Check className="size-4" />
                                  <span className="ml-2">{t('shipment.approval.approve')}</span>
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleReject(item.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <X className="size-4" />
                                  <span className="ml-2">{t('shipment.approval.reject')}</span>
                                </Button>
                              </div>
                            </TableCell>
                          );
                        }
                        return null;
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={Math.max(orderedVisibleColumns.length, 1)} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t('shipment.approval.noData')}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {data && (
            <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="text-sm text-muted-foreground">
                  {t('common.paginationInfo', {
                    current: data.totalCount > 0 ? data.pageNumber * data.pageSize + 1 : 0,
                    total: Math.min((data.pageNumber + 1) * data.pageSize, data.totalCount),
                    totalCount: data.totalCount,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t('common.rowsPerPage')}
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number.parseInt(value, 10));
                      setPageNumber(0);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[88px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pageSizeOptions.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    {t('common.records')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={!data.hasPreviousPage}
                >
                  <ChevronLeft className="size-4" />
                  {t('common.previous')}
                </Button>
                <span className="text-sm">
                  {t('common.page')} {data.pageNumber + 1} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!data.hasNextPage}
                >
                  {t('common.next')}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
          <div className="md:hidden space-y-4">
            {data?.data && data.data.length > 0 ? (
              data.data.map((item: ShipmentHeader) => (
                <Card key={item.id} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.approval.id')}
                        </p>
                        <p className="text-base font-semibold">{item.id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.approval.documentNo')}
                        </p>
                        <p className="text-base">{item.documentNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.approval.documentDate')}
                        </p>
                        <p className="text-base">{formatDate(item.documentDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.approval.customerCode')}
                        </p>
                        <p className="text-base">{item.customerCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.approval.customerName')}
                        </p>
                        <p className="text-base">{item.customerName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.approval.sourceWarehouse')}
                        </p>
                        <p className="text-base">{item.sourceWarehouse || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.approval.targetWarehouse')}
                        </p>
                        <p className="text-base">{item.targetWarehouse || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.approval.completionDate')}
                        </p>
                        <p className="text-base">{formatDateTime(item.completionDate)}</p>
                      </div>
                    </div>
                    <div className="pt-2 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedHeaderId(item.id)}
                      >
                        <Eye className="size-4 mr-2" />
                        {t('shipment.approval.viewDetails')}
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleApprove(item.id)}
                          disabled={approveMutation.isPending}
                        >
                          <Check className="size-4 mr-2" />
                          {t('shipment.approval.approve')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleReject(item.id)}
                          disabled={approveMutation.isPending}
                        >
                          <X className="size-4 mr-2" />
                          {t('shipment.approval.reject')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('shipment.approval.noData')}
                </p>
              </div>
            )}
          </div>
          {data && (
            <div className="flex flex-col items-center justify-between gap-4 pt-4 border-t md:hidden">
              <div className="text-sm text-muted-foreground">
                {t('common.paginationInfo', {
                  current: data.pageNumber * data.pageSize + 1,
                  total: Math.min((data.pageNumber + 1) * data.pageSize, data.totalCount),
                  totalCount: data.totalCount,
                })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={!data.hasPreviousPage}
                >
                  <ChevronLeft className="size-4" />
                  {t('common.previous')}
                </Button>
                <span className="text-sm">
                  {t('common.page')} {data.pageNumber + 1} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!data.hasNextPage}
                >
                  {t('common.next')}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedHeaderId && (
        <ShipmentDetailDialog
          headerId={selectedHeaderId}
          isOpen={!!selectedHeaderId}
          onClose={() => setSelectedHeaderId(null)}
        />
      )}
    </div>
  );
}
