import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { useWarehouseInboundHeadersPaged } from '../hooks/useWarehouseHeaders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { WarehouseDetailDialog } from './WarehouseDetailDialog';
import { Eye, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import type { WarehouseHeader } from '../types/warehouse';
import type { PagedFilter } from '@/types/api';
import { AdvancedFilter, ColumnPreferencesPopover, GridExportMenu, type ColumnDef } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePageSizePreference } from '@/hooks/usePageSizePreference';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GridExportColumn } from '@/lib/grid-export';
import type { FilterColumnConfig, FilterRow } from '@/lib/advanced-filter-types';
import { rowsToBackendFilters } from '@/lib/advanced-filter-types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function WarehouseInboundListPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(0);
  const { pageSize, pageSizeOptions, setPageSize } = usePageSizePreference({
    pageKey: 'warehouse-inbound-list',
    defaultPageSize: 10,
  });
  const [sortBy] = useState<string>('Id');
  const [sortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [draftFilterRows, setDraftFilterRows] = useState<FilterRow[]>([]);
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = useState<PagedFilter[]>([]);
  const advancedFilterColumns = useMemo<readonly FilterColumnConfig[]>(
    () => [
      { value: 'documentNo', type: 'string', labelKey: 'warehouse.inbound.list.documentNo' },
      { value: 'documentDate', type: 'date', labelKey: 'warehouse.inbound.list.documentDate' },
      { value: 'customerCode', type: 'string', labelKey: 'warehouse.inbound.list.customerCode' },
      { value: 'customerName', type: 'string', labelKey: 'warehouse.inbound.list.customerName' },
      { value: 'targetWarehouse', type: 'string', labelKey: 'warehouse.inbound.list.targetWarehouse' },
      { value: 'documentType', type: 'string', labelKey: 'warehouse.inbound.list.documentType' },
      { value: 'isCompleted', type: 'boolean', labelKey: 'warehouse.inbound.list.status' },
    ],
    []
  );
  const columns = useMemo<ColumnDef[]>(
    () => [
      { key: 'documentNo', label: t('warehouse.inbound.list.documentNo', 'Belge No') },
      { key: 'documentDate', label: t('warehouse.inbound.list.documentDate', 'Belge Tarihi') },
      { key: 'customerCode', label: t('warehouse.inbound.list.customerCode', 'Cari Kodu') },
      { key: 'customerName', label: t('warehouse.inbound.list.customerName', 'Cari Adı') },
      { key: 'targetWarehouse', label: t('warehouse.inbound.list.targetWarehouse', 'Giriş Deposu') },
      { key: 'documentType', label: t('warehouse.inbound.list.documentType', 'Belge Tipi') },
      { key: 'status', label: t('warehouse.inbound.list.status', 'Durum') },
      { key: 'createdDate', label: t('warehouse.inbound.list.createdDate', 'Oluşturulma Tarihi') },
      { key: 'actions', label: t('warehouse.inbound.list.actions', 'İşlemler') },
    ],
    [t]
  );
  const {
    userId,
    columnOrder,
    visibleColumns,
    orderedVisibleColumns,
    setColumnOrder,
    setVisibleColumns,
  } = useColumnPreferences({
    pageKey: 'warehouse-inbound-list',
    columns,
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

  const { data, isLoading, error } = useWarehouseInboundHeadersPaged({
    pageNumber,
    pageSize,
    sortBy,
    sortDirection,
    filters,
  });

  useEffect(() => {
    setPageTitle(t('warehouse.inbound.list.title', 'Ambar Giriş Emri Listesi'));
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

  const handleRowClick = (header: WarehouseHeader): void => {
    setSelectedHeaderId(header.id);
    setSelectedDocumentType(header.documentType);
  };

  const getStatusLabel = (item: WarehouseHeader): string => {
    if (item.isCompleted) return t('warehouse.inbound.list.completed', 'Tamamlandı');
    if (item.isPendingApproval) return t('warehouse.inbound.list.pendingApproval', 'Onay Bekliyor');
    return t('warehouse.inbound.list.inProgress', 'Devam Ediyor');
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
      documentNo: item.documentNo || '-',
      documentDate: formatDate(item.documentDate),
      customerCode: item.customerCode || '-',
      customerName: item.customerName || '-',
      targetWarehouse: item.targetWarehouse || '-',
      documentType: item.documentType || '-',
      status: getStatusLabel(item),
      createdDate: formatDateTime(item.createdDate),
    }));
  }, [data?.data, t]);

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
        <p className="text-destructive">{t('warehouse.inbound.list.error', 'Veri yüklenirken bir hata oluştu')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <div className="crm-toolbar flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>{t('warehouse.inbound.list.title', 'Ambar Giriş Emri Listesi')}</CardTitle>
            <div className="flex items-center gap-2">
              <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-dashed border-slate-300 dark:border-white/20 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-xs sm:text-sm"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {t('common.filter', 'Filtrele')}
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
                fileName="warehouse-inbound-list"
                columns={exportColumns}
                rows={exportRows}
              />
              <ColumnPreferencesPopover
                pageKey="warehouse-inbound-list"
                userId={userId}
                columns={columns}
                visibleColumns={visibleColumns}
                columnOrder={columnOrder}
                onVisibleColumnsChange={setVisibleColumns}
                onColumnOrderChange={setColumnOrder}
              />
              <div className="relative flex items-center w-full md:w-auto">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder={t('warehouse.inbound.list.searchPlaceholder', 'Belge No, Cari Kodu, Depo...')}
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
          <div className="hidden md:block rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/3">
            <Table>
              <TableHeader>
                <TableRow>
                  {orderedVisibleColumns.map((key) => {
                    if (key === 'documentNo') return <TableHead key={key}>{t('warehouse.inbound.list.documentNo', 'Belge No')}</TableHead>;
                    if (key === 'documentDate') return <TableHead key={key}>{t('warehouse.inbound.list.documentDate', 'Belge Tarihi')}</TableHead>;
                    if (key === 'customerCode') return <TableHead key={key}>{t('warehouse.inbound.list.customerCode', 'Cari Kodu')}</TableHead>;
                    if (key === 'customerName') return <TableHead key={key}>{t('warehouse.inbound.list.customerName', 'Cari Adı')}</TableHead>;
                    if (key === 'targetWarehouse') return <TableHead key={key}>{t('warehouse.inbound.list.targetWarehouse', 'Giriş Deposu')}</TableHead>;
                    if (key === 'documentType') return <TableHead key={key}>{t('warehouse.inbound.list.documentType', 'Belge Tipi')}</TableHead>;
                    if (key === 'status') return <TableHead key={key}>{t('warehouse.inbound.list.status', 'Durum')}</TableHead>;
                    if (key === 'createdDate') return <TableHead key={key}>{t('warehouse.inbound.list.createdDate', 'Oluşturulma Tarihi')}</TableHead>;
                    if (key === 'actions') return <TableHead key={key}>{t('warehouse.inbound.list.actions', 'İşlemler')}</TableHead>;
                    return null;
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data && data.data.length > 0 ? (
                  data.data.map((item: WarehouseHeader) => (
                    <TableRow key={item.id} className="cursor-pointer" onClick={() => handleRowClick(item)}>
                      {orderedVisibleColumns.map((key) => {
                        if (key === 'documentNo') return <TableCell key={key} className="font-medium">{item.documentNo || '-'}</TableCell>;
                        if (key === 'documentDate') return <TableCell key={key}>{formatDate(item.documentDate)}</TableCell>;
                        if (key === 'customerCode') return <TableCell key={key}>{item.customerCode || '-'}</TableCell>;
                        if (key === 'customerName') return <TableCell key={key}>{item.customerName || '-'}</TableCell>;
                        if (key === 'targetWarehouse') return <TableCell key={key}>{item.targetWarehouse || '-'}</TableCell>;
                        if (key === 'documentType') {
                          return (
                            <TableCell key={key}>
                              <Badge variant="outline">{item.documentType || '-'}</Badge>
                            </TableCell>
                          );
                        }
                        if (key === 'status') {
                          return (
                            <TableCell key={key}>
                              <div className="flex flex-col gap-1">
                                {item.isCompleted ? (
                                  <Badge variant="default" className="w-fit">
                                    {t('warehouse.inbound.list.completed', 'Tamamlandı')}
                                  </Badge>
                                ) : item.isPendingApproval ? (
                                  <Badge variant="secondary" className="w-fit">
                                    {t('warehouse.inbound.list.pendingApproval', 'Onay Bekliyor')}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="w-fit">
                                    {t('warehouse.inbound.list.inProgress', 'Devam Ediyor')}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          );
                        }
                        if (key === 'createdDate') return <TableCell key={key}>{formatDateTime(item.createdDate)}</TableCell>;
                        if (key === 'actions') {
                          return (
                            <TableCell key={key} onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRowClick(item)}
                              >
                                <Eye className="size-4" />
                                <span className="ml-2">{t('warehouse.inbound.list.viewDetails', 'Detay')}</span>
                              </Button>
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
                        {t('warehouse.inbound.list.noData', 'Veri bulunamadı')}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-4 pb-1">
            {data?.data && data.data.length > 0 ? (
              data.data.map((item: WarehouseHeader) => (
                <Card key={item.id} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        {item.isCompleted ? (
                          <Badge variant="default" className="w-fit">
                            {t('warehouse.inbound.list.completed', 'Tamamlandı')}
                          </Badge>
                        ) : item.isPendingApproval ? (
                          <Badge variant="secondary" className="w-fit">
                            {t('warehouse.inbound.list.pendingApproval', 'Onay Bekliyor')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-fit">
                            {t('warehouse.inbound.list.inProgress', 'Devam Ediyor')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('warehouse.inbound.list.documentNo', 'Belge No')}
                        </p>
                        <p className="text-base">{item.documentNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('warehouse.inbound.list.documentDate', 'Belge Tarihi')}
                        </p>
                        <p className="text-base">{formatDate(item.documentDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('warehouse.inbound.list.customerCode', 'Cari Kodu')}
                        </p>
                        <p className="text-base">{item.customerCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('warehouse.inbound.list.customerName', 'Cari Adı')}
                        </p>
                        <p className="text-base">{item.customerName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('warehouse.inbound.list.targetWarehouse', 'Giriş Deposu')}
                        </p>
                        <p className="text-base">{item.targetWarehouse || '-'}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleRowClick(item)}
                      >
                        <Eye className="size-4 mr-2" />
                        {t('warehouse.inbound.list.viewDetails', 'Detay')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('warehouse.inbound.list.noData', 'Veri bulunamadı')}
                </p>
              </div>
            )}
          </div>
          {data && (
            <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="text-sm text-muted-foreground">
                  {t('common.paginationInfo', '{{current}} - {{total}} of {{totalCount}}', {
                    current: data.totalCount > 0 ? data.pageNumber * data.pageSize + 1 : 0,
                    total: Math.min((data.pageNumber + 1) * data.pageSize, data.totalCount),
                    totalCount: data.totalCount,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t('common.rowsPerPage', 'Sayfada')}
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
                    {t('common.records', 'kayıt')}
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
                  {t('common.previous', 'Önceki')}
                </Button>
                <span className="text-sm">
                  {t('common.page', 'Sayfa')} {data.pageNumber + 1} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!data.hasNextPage}
                >
                  {t('common.next', 'Sonraki')}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedHeaderId && selectedDocumentType && (
        <WarehouseDetailDialog
          headerId={selectedHeaderId}
          documentType={selectedDocumentType}
          isOpen={!!selectedHeaderId}
          onClose={() => {
            setSelectedHeaderId(null);
            setSelectedDocumentType(null);
          }}
        />
      )}
    </div>
  );
}
