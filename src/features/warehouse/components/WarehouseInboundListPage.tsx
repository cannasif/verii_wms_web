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
import { Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import type { WarehouseHeader } from '../types/warehouse';
import type { PagedFilter } from '@/types/api';

export function WarehouseInboundListPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(10);
  const [sortBy] = useState<string>('Id');
  const [sortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const filters: PagedFilter[] = useMemo(() => {
    const result: PagedFilter[] = [];
    if (searchTerm) {
      result.push({ column: 'documentNo', operator: 'contains', value: searchTerm });
    }
    return result;
  }, [searchTerm]);

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
          <div className="hidden md:block rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/[0.03]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('warehouse.inbound.list.documentNo', 'Belge No')}</TableHead>
                  <TableHead>{t('warehouse.inbound.list.documentDate', 'Belge Tarihi')}</TableHead>
                  <TableHead>{t('warehouse.inbound.list.customerCode', 'Cari Kodu')}</TableHead>
                  <TableHead>{t('warehouse.inbound.list.customerName', 'Cari Adı')}</TableHead>
                  <TableHead>{t('warehouse.inbound.list.targetWarehouse', 'Giriş Deposu')}</TableHead>
                  <TableHead>{t('warehouse.inbound.list.documentType', 'Belge Tipi')}</TableHead>
                  <TableHead>{t('warehouse.inbound.list.status', 'Durum')}</TableHead>
                  <TableHead>{t('warehouse.inbound.list.createdDate', 'Oluşturulma Tarihi')}</TableHead>
                  <TableHead>{t('warehouse.inbound.list.actions', 'İşlemler')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data && data.data.length > 0 ? (
                  data.data.map((item: WarehouseHeader) => (
                    <TableRow key={item.id} className="cursor-pointer" onClick={() => handleRowClick(item)}>
                      <TableCell className="font-medium">{item.documentNo || '-'}</TableCell>
                      <TableCell>{formatDate(item.documentDate)}</TableCell>
                      <TableCell>{item.customerCode || '-'}</TableCell>
                      <TableCell>{item.customerName || '-'}</TableCell>
                      <TableCell>{item.targetWarehouse || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.documentType || '-'}</Badge>
                      </TableCell>
                      <TableCell>
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
                      <TableCell>{formatDateTime(item.createdDate)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRowClick(item)}
                        >
                          <Eye className="size-4" />
                          <span className="ml-2">{t('warehouse.inbound.list.viewDetails', 'Detay')}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
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
                    <div className="grid grid-cols-2 gap-3">
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
            <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 dark:border-white/10">
              <div className="text-sm text-muted-foreground">
                {t('common.paginationInfo', '{{current}} - {{total}} of {{totalCount}}', {
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

