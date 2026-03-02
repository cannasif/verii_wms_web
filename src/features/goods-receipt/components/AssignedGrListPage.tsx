import { type ReactElement, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { useAssignedGrHeaders } from '../hooks/useAssignedGrHeaders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GoodsReceiptDetailDialog } from './GoodsReceiptDetailDialog';
import { Eye, Search } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import type { GrHeader } from '../types/goods-receipt';

export function AssignedGrListPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useAssignedGrHeaders();

  useEffect(() => {
    setPageTitle(t('goodsReceipt.assignedList.title', 'Atanmış Mal Kabul Emirleri'));
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

  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    if (!searchTerm) return data.data;
    const searchLower = searchTerm.toLowerCase();
    return data.data.filter((item) => {
      return (
        item.orderId?.toLowerCase().includes(searchLower) ||
        item.customerCode?.toLowerCase().includes(searchLower) ||
        item.description1?.toLowerCase().includes(searchLower) ||
        item.description2?.toLowerCase().includes(searchLower)
      );
    });
  }, [data?.data, searchTerm]);

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
          {t('goodsReceipt.assignedList.error', 'Veri yüklenirken bir hata oluştu')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <div className="crm-toolbar flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>{t('goodsReceipt.assignedList.title', 'Atanmış Mal Kabul Emirleri')}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center w-full md:w-auto">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder={t(
                    'goodsReceipt.assignedList.searchPlaceholder',
                    'Sipariş No, Cari Kodu...'
                  )}
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
                  <TableHead>{t('goodsReceipt.report.id', 'ID')}</TableHead>
                  <TableHead>{t('goodsReceipt.report.orderId', 'Sipariş No')}</TableHead>
                  <TableHead>{t('goodsReceipt.report.customerCode', 'Cari Kodu')}</TableHead>
                  <TableHead>{t('goodsReceipt.report.projectCode', 'Proje Kodu')}</TableHead>
                  <TableHead>{t('goodsReceipt.report.documentType', 'Belge Tipi')}</TableHead>
                  <TableHead>{t('goodsReceipt.report.plannedDate', 'Planlanan Tarih')}</TableHead>
                  <TableHead>{t('goodsReceipt.report.status', 'Durum')}</TableHead>
                  <TableHead>{t('goodsReceipt.report.createdDate', 'Oluşturulma Tarihi')}</TableHead>
                  <TableHead>{t('goodsReceipt.report.actions', 'İşlemler')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((item: GrHeader) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedHeaderId(item.id)}
                    >
                      <TableCell>{item.id}</TableCell>
                      <TableCell className="font-medium">{item.orderId || '-'}</TableCell>
                      <TableCell>{item.customerCode || '-'}</TableCell>
                      <TableCell>{item.projectCode || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.documentType || '-'}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(item.plannedDate)}</TableCell>
                      <TableCell>
                        {item.isCompleted ? (
                          <Badge variant="default" className="w-fit">
                            {t('goodsReceipt.report.completed', 'Tamamlandı')}
                          </Badge>
                        ) : item.isPendingApproval ? (
                          <Badge variant="secondary" className="w-fit">
                            {t('goodsReceipt.report.pendingApproval', 'Onay Bekliyor')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-fit">
                            {t('goodsReceipt.report.inProgress', 'Devam Ediyor')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDateTime(item.createdDate)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedHeaderId(item.id)}
                          >
                            <Eye className="size-4" />
                            <span className="ml-2">
                              {t('goodsReceipt.report.viewDetails', 'Detay')}
                            </span>
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            onClick={() => navigate(`/goods-receipt/collection/${item.id}`)}
                          >
                            {t('common.start', 'Başla')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t('goodsReceipt.assignedList.noData', 'Atanmış mal kabul emri bulunamadı')}
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
                      <div>
                        {item.isCompleted ? (
                          <Badge variant="default" className="w-fit">
                            {t('goodsReceipt.report.completed', 'Tamamlandı')}
                          </Badge>
                        ) : item.isPendingApproval ? (
                          <Badge variant="secondary" className="w-fit">
                            {t('goodsReceipt.report.pendingApproval', 'Onay Bekliyor')}
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
                          {t('goodsReceipt.report.plannedDate', 'Planlanan Tarih')}
                        </p>
                        <p className="text-base">{formatDate(item.plannedDate)}</p>
                      </div>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedHeaderId(item.id)}
                      >
                        <Eye className="size-4 mr-2" />
                        {t('goodsReceipt.report.viewDetails', 'Detay')}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => navigate(`/goods-receipt/collection/${item.id}`)}
                      >
                        {t('common.start', 'Başla')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('goodsReceipt.assignedList.noData', 'Atanmış mal kabul emri bulunamadı')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedHeaderId && (
        <GoodsReceiptDetailDialog
          grHeaderId={selectedHeaderId}
          isOpen={!!selectedHeaderId}
          onClose={() => setSelectedHeaderId(null)}
        />
      )}
    </div>
  );
}

