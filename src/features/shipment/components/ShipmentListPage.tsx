import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { useShipmentHeadersPaged } from '../hooks/useShipmentHeaders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { ShipmentDetailDialog } from './ShipmentDetailDialog';
import type { ShipmentHeader } from '../types/shipment';
import { Button } from '@/components/ui/button';
import type { PagedFilter } from '@/types/api';

export function ShipmentListPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(10);
  const [sortBy] = useState<string>('Id');
  const [sortDirection] = useState<'asc' | 'desc'>('desc');

  const filters: PagedFilter[] = useMemo(() => {
    const result: PagedFilter[] = [];
    if (searchTerm) {
      result.push({ column: 'documentNo', operator: 'contains', value: searchTerm });
    }
    return result;
  }, [searchTerm]);

  const { data, isLoading, error } = useShipmentHeadersPaged({
    pageNumber,
    pageSize,
    sortBy,
    sortDirection,
    filters,
  });

  useEffect(() => {
    setPageTitle(t('shipment.list.title', 'Sevkiyat Emri Listesi'));
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
        <p className="text-destructive">{t('shipment.list.error', 'Veri yüklenirken bir hata oluştu')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>{t('shipment.list.title', 'Sevkiyat Emri Listesi')}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center w-full md:w-auto">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder={t('shipment.list.searchPlaceholder', 'Belge No, Cari Kodu, Depo...')}
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
                  <TableHead>{t('shipment.list.documentNo', 'Belge No')}</TableHead>
                  <TableHead>{t('shipment.list.documentDate', 'Belge Tarihi')}</TableHead>
                  <TableHead>{t('shipment.list.customerCode', 'Cari Kodu')}</TableHead>
                  <TableHead>{t('shipment.list.customerName', 'Cari Adı')}</TableHead>
                  <TableHead>{t('shipment.list.sourceWarehouse', 'Çıkış Deposu')}</TableHead>
                  <TableHead>{t('shipment.list.targetWarehouse', 'Varış Deposu')}</TableHead>
                  <TableHead>{t('shipment.list.documentType', 'Belge Tipi')}</TableHead>
                  <TableHead>{t('shipment.list.status', 'Durum')}</TableHead>
                  <TableHead>{t('shipment.list.createdDate', 'Oluşturulma Tarihi')}</TableHead>
                  <TableHead>{t('shipment.list.actions', 'İşlemler')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data && data.data.length > 0 ? (
                  data.data.map((item: ShipmentHeader) => (
                    <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelectedHeaderId(item.id)}>
                      <TableCell className="font-medium">{item.documentNo || '-'}</TableCell>
                      <TableCell>{formatDate(item.documentDate)}</TableCell>
                      <TableCell>{item.customerCode || '-'}</TableCell>
                      <TableCell>{item.customerName || '-'}</TableCell>
                      <TableCell>{item.sourceWarehouse || '-'}</TableCell>
                      <TableCell>{item.targetWarehouse || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.documentType || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {item.isCompleted ? (
                            <Badge variant="default" className="w-fit">
                              {t('shipment.list.completed', 'Tamamlandı')}
                            </Badge>
                          ) : item.isPendingApproval ? (
                            <Badge variant="secondary" className="w-fit">
                              {t('shipment.list.pendingApproval', 'Onay Bekliyor')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="w-fit">
                              {t('shipment.list.inProgress', 'Devam Ediyor')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(item.createdDate)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedHeaderId(item.id)}>
                          <Eye className="size-4" />
                          <span className="ml-2">{t('shipment.list.viewDetails', 'Detay')}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t('shipment.list.noData', 'Veri bulunamadı')}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-4">
            {data?.data && data.data.length > 0 ? (
              data.data.map((item: ShipmentHeader) => (
                <Card key={item.id} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        {item.isCompleted ? (
                          <Badge variant="default" className="w-fit">
                            {t('shipment.list.completed', 'Tamamlandı')}
                          </Badge>
                        ) : item.isPendingApproval ? (
                          <Badge variant="secondary" className="w-fit">
                            {t('shipment.list.pendingApproval', 'Onay Bekliyor')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-fit">
                            {t('shipment.list.inProgress', 'Devam Ediyor')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.list.documentNo', 'Belge No')}
                        </p>
                        <p className="text-base">{item.documentNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.list.documentDate', 'Belge Tarihi')}
                        </p>
                        <p className="text-base">{formatDate(item.documentDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.list.customerCode', 'Cari Kodu')}
                        </p>
                        <p className="text-base">{item.customerCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.list.customerName', 'Cari Adı')}
                        </p>
                        <p className="text-base">{item.customerName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.list.sourceWarehouse', 'Çıkış Deposu')}
                        </p>
                        <p className="text-base">{item.sourceWarehouse || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('shipment.list.targetWarehouse', 'Varış Deposu')}
                        </p>
                        <p className="text-base">{item.targetWarehouse || '-'}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedHeaderId(item.id)}>
                        <Eye className="size-4 mr-2" />
                        {t('shipment.list.viewDetails', 'Detay')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('shipment.list.noData', 'Veri bulunamadı')}
                </p>
              </div>
            )}
          </div>
          {data && (
            <div className="flex items-center justify-between border-t pt-4">
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
