import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/ui-store';
import { usePHeaders } from '../hooks/usePHeaders';
import { useDeletePHeader } from '../hooks/useDeletePHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Trash2, ChevronLeft, ChevronRight, Eye, Filter } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { toast } from 'sonner';
import type { PHeaderDto } from '../types/package';
import type { PagedFilter } from '@/types/api';
import { AdvancedFilter, ColumnPreferencesPopover, GridExportMenu, type ColumnDef } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePageSizePreference } from '@/hooks/usePageSizePreference';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GridExportColumn } from '@/lib/grid-export';
import type { FilterColumnConfig, FilterRow } from '@/lib/advanced-filter-types';
import { rowsToBackendFilters } from '@/lib/advanced-filter-types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

export function PackageListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const [pageNumber, setPageNumber] = useState(1);
  const { pageSize, pageSizeOptions, setPageSize } = usePageSizePreference({
    pageKey: 'package-list',
    defaultPageSize: 10,
  });
  const [sortBy, setSortBy] = useState<string>('Id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState<PHeaderDto | null>(null);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [draftFilterRows, setDraftFilterRows] = useState<FilterRow[]>([]);
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = useState<PagedFilter[]>([]);

  const columns = useMemo<ColumnDef[]>(
    () => [
      { key: 'id', label: t('package.list.id') },
      { key: 'packingNo', label: t('package.list.packingNo') },
      { key: 'packingDate', label: t('package.list.packingDate') },
      { key: 'warehouseCode', label: t('package.list.warehouseCode') },
      { key: 'sourceType', label: t('package.list.sourceType') },
      { key: 'matchedSource', label: t('package.list.matchedSource') },
      { key: 'customerCode', label: t('package.list.customerCode') },
      { key: 'customerName', label: t('package.list.customerName') },
      { key: 'status', label: t('package.list.status') },
      { key: 'totalPackageCount', label: t('package.list.totalPackageCount') },
      { key: 'totalQuantity', label: t('package.list.totalQuantity') },
      { key: 'totalGrossWeight', label: t('package.list.totalGrossWeight') },
      { key: 'trackingNo', label: t('package.list.trackingNo') },
      { key: 'actions', label: t('package.list.actions') },
    ],
    [t]
  );
  const advancedFilterColumns = useMemo<readonly FilterColumnConfig[]>(
    () => [
      { value: 'id', type: 'number', labelKey: 'package.list.id' },
      { value: 'packingNo', type: 'string', labelKey: 'package.list.packingNo' },
      { value: 'packingDate', type: 'date', labelKey: 'package.list.packingDate' },
      { value: 'warehouseCode', type: 'string', labelKey: 'package.list.warehouseCode' },
      { value: 'customerCode', type: 'string', labelKey: 'package.list.customerCode' },
      { value: 'customerName', type: 'string', labelKey: 'package.list.customerName' },
      { value: 'status', type: 'string', labelKey: 'package.list.status' },
      { value: 'trackingNo', type: 'string', labelKey: 'package.list.trackingNo' },
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
    pageKey: 'package-list',
    columns,
    idColumnKey: 'id',
  });

  const filters: PagedFilter[] = useMemo(() => {
    const result: PagedFilter[] = [];
    if (searchTerm) {
      result.push({ column: 'packingNo', operator: 'contains', value: searchTerm });
    }
    result.push(...appliedAdvancedFilters);
    return result;
  }, [searchTerm, appliedAdvancedFilters]);

  const applyAdvancedFilters = (): void => {
    setAppliedAdvancedFilters(rowsToBackendFilters(draftFilterRows));
    setPageNumber(1);
    setFilterPopoverOpen(false);
  };

  const clearAdvancedFilters = (): void => {
    setDraftFilterRows([]);
    setAppliedAdvancedFilters([]);
    setPageNumber(1);
    setFilterPopoverOpen(false);
  };

  const { data, isLoading, error } = usePHeaders({
    pageNumber,
    pageSize,
    sortBy,
    sortDirection,
    filters,
  });

  const deleteMutation = useDeletePHeader();

  useEffect(() => {
    setPageTitle(t('package.list.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  const handleSort = (column: string): void => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
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

  const formatDateForExport = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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
      packingNo: item.packingNo || '-',
      packingDate: formatDateForExport(item.packingDate),
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
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.list.deleteError')
      );
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };


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
        <p className="text-destructive">{t('package.list.error')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <div className="crm-toolbar flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>{t('package.list.title')}</CardTitle>
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
                    defaultColumn="packingNo"
                    draftRows={draftFilterRows}
                    onDraftRowsChange={setDraftFilterRows}
                    onSearch={applyAdvancedFilters}
                    onClear={clearAdvancedFilters}
                    embedded
                  />
                </PopoverContent>
              </Popover>
              <GridExportMenu
                fileName="package-list"
                columns={exportColumns}
                rows={exportRows}
              />
              <ColumnPreferencesPopover
                pageKey="package-list"
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
                  placeholder={t('package.list.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPageNumber(1);
                  }}
                  className="pl-8 pr-10 w-full md:w-64"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <VoiceSearchButton
                    onResult={(text) => {
                      setSearchTerm(text);
                      setPageNumber(1);
                    }}
                    size="sm"
                    variant="ghost"
                  />
                </div>
              </div>
              <Button onClick={() => navigate('/package/create')}>
                <Plus className="size-4 mr-2" />
                {t('package.list.createNew')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>

          <div className="hidden md:block rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/3">
            <Table>
              <TableHeader>
                <TableRow>
                  {orderedVisibleColumns.map((key) => {
                    if (key === 'id') return <TableHead key={key} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('Id')}>{t('package.list.id')}{sortBy === 'Id' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}</TableHead>;
                    if (key === 'packingNo') return <TableHead key={key} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('packingNo')}>{t('package.list.packingNo')}{sortBy === 'packingNo' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}</TableHead>;
                    if (key === 'packingDate') return <TableHead key={key} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('packingDate')}>{t('package.list.packingDate')}{sortBy === 'packingDate' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}</TableHead>;
                    if (key === 'warehouseCode') return <TableHead key={key}>{t('package.list.warehouseCode')}</TableHead>;
                    if (key === 'sourceType') return <TableHead key={key}>{t('package.list.sourceType')}</TableHead>;
                    if (key === 'matchedSource') return <TableHead key={key}>{t('package.list.matchedSource')}</TableHead>;
                    if (key === 'customerCode') return <TableHead key={key}>{t('package.list.customerCode')}</TableHead>;
                    if (key === 'customerName') return <TableHead key={key}>{t('package.list.customerName')}</TableHead>;
                    if (key === 'status') return <TableHead key={key}>{t('package.list.status')}</TableHead>;
                    if (key === 'totalPackageCount') return <TableHead key={key}>{t('package.list.totalPackageCount')}</TableHead>;
                    if (key === 'totalQuantity') return <TableHead key={key}>{t('package.list.totalQuantity')}</TableHead>;
                    if (key === 'totalGrossWeight') return <TableHead key={key}>{t('package.list.totalGrossWeight')}</TableHead>;
                    if (key === 'trackingNo') return <TableHead key={key}>{t('package.list.trackingNo')}</TableHead>;
                    if (key === 'actions') return <TableHead key={key}>{t('package.list.actions')}</TableHead>;
                    return null;
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data && data.data.length > 0 ? (
                  data.data.map((item: PHeaderDto) => (
                    <TableRow key={item.id}>
                      {orderedVisibleColumns.map((key) => {
                        if (key === 'id') return <TableCell key={key} className="font-medium">#{item.id}</TableCell>;
                        if (key === 'packingNo') return <TableCell key={key} className="font-medium">{item.packingNo || '-'}</TableCell>;
                        if (key === 'packingDate') return <TableCell key={key}>{formatDate(item.packingDate)}</TableCell>;
                        if (key === 'warehouseCode') return <TableCell key={key}>{item.warehouseCode || '-'}</TableCell>;
                        if (key === 'sourceType') return <TableCell key={key}>{item.sourceType ? <Badge variant="outline">{t(`package.sourceType.${item.sourceType.toUpperCase()}`, item.sourceType.toUpperCase())}</Badge> : '-'}</TableCell>;
                        if (key === 'matchedSource') return <TableCell key={key}>{item.sourceHeaderId ? <span className="font-medium">#{item.sourceHeaderId}</span> : '-'}</TableCell>;
                        if (key === 'customerCode') return <TableCell key={key}>{item.customerCode || '-'}</TableCell>;
                        if (key === 'customerName') return <TableCell key={key}>{item.customerName || '-'}</TableCell>;
                        if (key === 'status') return <TableCell key={key}><Badge className={getStatusBadgeColor(item.status)}>{t(`package.status.${item.status.toLowerCase()}`, item.status)}</Badge></TableCell>;
                        if (key === 'totalPackageCount') return <TableCell key={key}>{item.totalPackageCount || 0}</TableCell>;
                        if (key === 'totalQuantity') return <TableCell key={key}>{item.totalQuantity || 0}</TableCell>;
                        if (key === 'totalGrossWeight') return <TableCell key={key}>{item.totalGrossWeight || 0}</TableCell>;
                        if (key === 'trackingNo') return <TableCell key={key}>{item.trackingNo || '-'}</TableCell>;
                        if (key === 'actions') return <TableCell key={key} onClick={(e) => e.stopPropagation()}><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => navigate(`/package/detail/${item.id}`)}><Eye className="size-4 mr-2" />{t('package.list.detail')}</Button><Button variant="ghost" size="sm" onClick={() => { setSelectedHeader(item); setDeleteDialogOpen(true); }}><Trash2 className="size-4" /></Button></div></TableCell>;
                        return null;
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={Math.max(orderedVisibleColumns.length, 1)} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t('package.list.noData')}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-4 pb-1">
            {data?.data && data.data.length > 0 ? (
              data.data.map((item: PHeaderDto) => (
                <Card key={item.id} className="border border-slate-200/70 bg-white/85 dark:border-white/10 dark:bg-white/4">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="font-medium">#{item.id} - {item.packingNo || '-'}</p>
                        <Badge className={getStatusBadgeColor(item.status)}>
                          {t(`package.status.${item.status.toLowerCase()}`, item.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.packingDate')}
                        </p>
                        <p className="text-base">{formatDate(item.packingDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.warehouseCode')}
                        </p>
                        <p className="text-base">{item.warehouseCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.sourceType')}
                        </p>
                        <p className="text-base">
                          {item.sourceType ? (
                            <Badge variant="outline" className="text-xs">
                              {t(`package.sourceType.${item.sourceType.toUpperCase()}`, item.sourceType)}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.matchedSource')}
                        </p>
                        <p className="text-base">
                          {item.sourceHeaderId ? `#${item.sourceHeaderId}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.customerCode')}
                        </p>
                        <p className="text-base">{item.customerCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.customerName')}
                        </p>
                        <p className="text-base">{item.customerName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('package.list.totalPackageCount')}
                        </p>
                        <p className="text-base">{item.totalPackageCount || 0}</p>
                      </div>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/package/detail/${item.id}`)}
                      >
                        <Eye className="size-4 mr-2" />
                        {t('package.list.detail')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedHeader(item);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('package.list.noData')}
                </p>
              </div>
            )}
          </div>

          {data && (
            <div className="mt-4 flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="text-sm text-muted-foreground">
                  {t('common.paginationInfo', {
                    current: data.totalCount > 0 ? (data.pageNumber - 1) * data.pageSize + 1 : 0,
                    total: Math.min(data.pageNumber * data.pageSize, data.totalCount),
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
                      setPageNumber(1);
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
                  {t('common.page')} {data.pageNumber} / {data.totalPages}
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('package.list.deleteConfirm')}</DialogTitle>
            <DialogDescription>
              {t('package.list.deleteConfirmMessage')}
            </DialogDescription>
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
