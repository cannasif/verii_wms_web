import { type ReactElement, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { useGrHeaders } from '../hooks/useGrHeaders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GoodsReceiptDetailDialog } from './GoodsReceiptDetailDialog';
import { ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import type { GrHeader } from '../types/goods-receipt';

export function GoodsReceiptReportPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>('createdDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedGrHeaderId, setSelectedGrHeaderId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useGrHeaders({
    pageNumber,
    pageSize,
    sortBy,
    sortDirection,
  });

  useEffect(() => {
    setPageTitle(t('goodsReceipt.report.title', 'Mal Kabul Raporu'));
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

  const filteredData = data?.data.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.orderId?.toLowerCase().includes(searchLower) ||
      item.customerCode?.toLowerCase().includes(searchLower) ||
      item.description1?.toLowerCase().includes(searchLower) ||
      item.projectCode?.toLowerCase().includes(searchLower)
    );
  });

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
        <p className="text-destructive">{t('goodsReceipt.report.error', 'Veri yüklenirken bir hata oluştu')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <div className="crm-toolbar flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>{t('goodsReceipt.report.title', 'Mal Kabul Raporu')}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center w-full md:w-auto">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder={t('goodsReceipt.report.searchPlaceholder', 'Sipariş No, Cari Kodu, Belge No...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('id')}
                  >
                    {t('goodsReceipt.report.id', 'ID')}
                    {sortBy === 'id' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('orderId')}
                  >
                    {t('goodsReceipt.report.orderId', 'Sipariş No')}
                    {sortBy === 'orderId' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('customerCode')}
                  >
                    {t('goodsReceipt.report.customerCode', 'Cari Kodu')}
                    {sortBy === 'customerCode' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('projectCode')}
                  >
                    {t('goodsReceipt.report.projectCode', 'Proje Kodu')}
                    {sortBy === 'projectCode' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('documentType')}
                  >
                    {t('goodsReceipt.report.documentType', 'Belge Tipi')}
                    {sortBy === 'documentType' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('plannedDate')}
                  >
                    {t('goodsReceipt.report.plannedDate', 'Planlanan Tarih')}
                    {sortBy === 'plannedDate' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                  <TableHead>
                    {t('goodsReceipt.report.status', 'Durum')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('createdDate')}
                  >
                    {t('goodsReceipt.report.createdDate', 'Oluşturulma Tarihi')}
                    {sortBy === 'createdDate' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                  <TableHead>
                    {t('goodsReceipt.report.actions', 'İşlemler')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((item: GrHeader) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell className="font-medium">{item.orderId || '-'}</TableCell>
                      <TableCell>{item.customerCode || '-'}</TableCell>
                      <TableCell>{item.projectCode || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={item.documentType === 'E-İrsaliye' ? 'secondary' : 'default'}>
                          {item.documentType || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(item.plannedDate)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {item.isCompleted ? (
                            <Badge variant="default" className="w-fit">
                              {t('goodsReceipt.report.completed', 'Tamamlandı')}
                            </Badge>
                          ) : item.isPendingApproval ? (
                            <Badge variant="secondary" className="w-fit">
                              {t('goodsReceipt.report.pendingApproval', 'Onay Bekliyor')}
                            </Badge>
                          ) : item.completionDate ? (
                            <Badge variant="default" className="w-fit">
                              {t('goodsReceipt.report.completed', 'Tamamlandı')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="w-fit">
                              {t('goodsReceipt.report.inProgress', 'Devam Ediyor')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(item.createdDate)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedGrHeaderId(item.id)}
                        >
                          <Eye className="size-4" />
                          <span className="ml-2">{t('goodsReceipt.report.viewDetails', 'Detay')}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t('goodsReceipt.report.noData', 'Veri bulunamadı')}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-4 pb-1">
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((item: GrHeader) => (
                <Card key={item.id} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('goodsReceipt.report.id', 'ID')}
                        </p>
                        <p className="text-base font-semibold">{item.id}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {item.isCompleted ? (
                          <Badge variant="default" className="w-fit">
                            {t('goodsReceipt.report.completed', 'Tamamlandı')}
                          </Badge>
                        ) : item.isPendingApproval ? (
                          <Badge variant="secondary" className="w-fit">
                            {t('goodsReceipt.report.pendingApproval', 'Onay Bekliyor')}
                          </Badge>
                        ) : item.completionDate ? (
                          <Badge variant="default" className="w-fit">
                            {t('goodsReceipt.report.completed', 'Tamamlandı')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-fit">
                            {t('goodsReceipt.report.inProgress', 'Devam Ediyor')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('goodsReceipt.report.orderId', 'Sipariş No')}
                        </p>
                        <p className="text-base">{item.orderId || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('goodsReceipt.report.customerCode', 'Cari Kodu')}
                        </p>
                        <p className="text-base">{item.customerCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('goodsReceipt.report.projectCode', 'Proje Kodu')}
                        </p>
                        <p className="text-base">{item.projectCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('goodsReceipt.report.documentType', 'Belge Tipi')}
                        </p>
                        <Badge variant={item.documentType === 'E-İrsaliye' ? 'secondary' : 'default'} className="mt-1">
                          {item.documentType || '-'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('goodsReceipt.report.plannedDate', 'Planlanan Tarih')}
                        </p>
                        <p className="text-base">{formatDate(item.plannedDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('goodsReceipt.report.createdDate', 'Oluşturulma Tarihi')}
                        </p>
                        <p className="text-base">{formatDateTime(item.createdDate)}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedGrHeaderId(item.id)}
                      >
                        <Eye className="size-4 mr-2" />
                        {t('goodsReceipt.report.viewDetails', 'Detay')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('goodsReceipt.report.noData', 'Veri bulunamadı')}
                </p>
              </div>
            )}
          </div>
          {data && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                {t('goodsReceipt.report.paginationInfo', '{{current}} - {{total}} arası, Toplam: {{totalCount}}', {
                  current: (data.pageNumber - 1) * data.pageSize + 1,
                  total: Math.min(data.pageNumber * data.pageSize, data.totalCount),
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
                <span className="text-sm text-muted-foreground">
                  {t('goodsReceipt.report.page', 'Sayfa {{page}} / {{totalPages}}', {
                    page: data.pageNumber,
                    totalPages: data.totalPages,
                  })}
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

      {selectedGrHeaderId && (
        <GoodsReceiptDetailDialog
          grHeaderId={selectedGrHeaderId}
          isOpen={!!selectedGrHeaderId}
          onClose={() => setSelectedGrHeaderId(null)}
        />
      )}
    </div>
  );
}

