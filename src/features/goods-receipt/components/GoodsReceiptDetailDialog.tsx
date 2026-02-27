import { type ReactElement, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useGrHeaderDetail } from '../hooks/useGrHeaderDetail';
import { useGrLines } from '../hooks/useGrLines';
import { useGrImportLinesWithRoutes } from '../hooks/useGrImportLinesWithRoutes';
import type { GrLine, GrImportLine } from '../types/goods-receipt';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog as ImportLineDialog,
  DialogContent as ImportLineDialogContent,
  DialogDescription as ImportLineDialogDescription,
  DialogHeader as ImportLineDialogHeader,
  DialogTitle as ImportLineDialogTitle,
} from '@/components/ui/dialog';

interface GoodsReceiptDetailDialogProps {
  grHeaderId: number;
  isOpen: boolean;
  onClose: () => void;
}

interface ImportLineDetailDialogProps {
  importLine: GrImportLine | null;
  orderLine: GrLine | null;
  isOpen: boolean;
  onClose: () => void;
}

function ImportLineDetailDialog({
  importLine,
  orderLine,
  isOpen,
  onClose,
}: ImportLineDetailDialogProps): ReactElement {
  const { t } = useTranslation();

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

  if (!importLine) return <></>;

  const totalImportQuantity = importLine.routes.reduce((sum, route) => sum + route.quantity, 0);
  const warehouses = Array.from(
    new Set(importLine.routes.map((route) => route.targetWarehouse).filter((wh): wh is number => wh !== null))
  );

  return (
    <ImportLineDialog open={isOpen} onOpenChange={onClose}>
      <ImportLineDialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <ImportLineDialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <ImportLineDialogTitle className="text-xl">
            {t('goodsReceipt.report.importLineDetail', 'İçerik Satır Detayı')}
          </ImportLineDialogTitle>
          <ImportLineDialogDescription>
            {importLine.routes.find((route) => route.stockName)?.stockName || importLine.description1 || importLine.stockCode}
          </ImportLineDialogDescription>
        </ImportLineDialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <Tabs defaultValue="order" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="order">
                {t('goodsReceipt.report.orderInfo', 'Sipariş Bilgisi')}
              </TabsTrigger>
              <TabsTrigger value="import">
                {t('goodsReceipt.report.importInfo', 'İçerik Bilgisi')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="order" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {orderLine ? (
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableHead className="w-1/3">
                            {t('goodsReceipt.report.stockCode', 'Stok Kodu')}
                          </TableHead>
                          <TableCell>{orderLine.stockCode}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.description', 'Açıklama')}</TableHead>
                          <TableCell>{orderLine.description}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.quantity', 'Miktar')}</TableHead>
                          <TableCell>
                            {orderLine.quantity} {orderLine.unit}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.unit', 'Ölçü Birimi')}</TableHead>
                          <TableCell>{orderLine.unit}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.erpOrderNo', 'ERP Sipariş No')}</TableHead>
                          <TableCell>{orderLine.erpOrderNo}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.erpOrderId', 'ERP Sipariş ID')}</TableHead>
                          <TableCell>{orderLine.erpOrderId}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.createdDate', 'Oluşturulma Tarihi')}</TableHead>
                          <TableCell>{formatDateTime(orderLine.createdDate)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.createdBy', 'Oluşturan')}</TableHead>
                          <TableCell>{orderLine.createdByFullUser || '-'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      {t('goodsReceipt.report.noOrderInfo', 'Sipariş bilgisi bulunamadı')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="import" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableHead className="w-1/3">
                            {t('goodsReceipt.report.stockCode', 'Stok Kodu')}
                          </TableHead>
                          <TableCell>{importLine.stockCode}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.stockName', 'Stok Adı')}</TableHead>
                          <TableCell>{importLine.routes.find((route) => route.stockName)?.stockName || importLine.description1 || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.description2', 'Açıklama 2')}</TableHead>
                          <TableCell>{importLine.description2 || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.totalImportQuantity', 'Toplam İçerik Miktarı')}</TableHead>
                          <TableCell className="font-semibold">
                            {totalImportQuantity}
                            {warehouses.length > 0 && (
                              <span className="ml-2 text-muted-foreground font-normal">
                                ({t('goodsReceipt.report.targetWarehouse', 'Hedef Depo')}: {warehouses.join(', ')})
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.createdDate', 'Oluşturulma Tarihi')}</TableHead>
                          <TableCell>{formatDateTime(importLine.createdDate)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ImportLineDialogContent>
    </ImportLineDialog>
  );
}

export function GoodsReceiptDetailDialog({
  grHeaderId,
  isOpen,
  onClose,
}: GoodsReceiptDetailDialogProps): ReactElement {
  const { t } = useTranslation();
  const { data, isLoading, error } = useGrHeaderDetail(grHeaderId);
  const { data: grLines } = useGrLines(grHeaderId);
  const { data: grImportLines } = useGrImportLinesWithRoutes(grHeaderId);
  const [selectedImportLine, setSelectedImportLine] = useState<GrImportLine | null>(null);
  const [isImportLineDialogOpen, setIsImportLineDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleImportLineClick = (importLine: GrImportLine): void => {
    setSelectedImportLine(importLine);
    setIsImportLineDialogOpen(true);
  };

  const getOrderLineForImportLine = (importLine: GrImportLine): GrLine | null => {
    if (!grLines) return null;
    return grLines.find((line) => line.id === importLine.lineId) || null;
  };

  const getImportLineStockName = (importLine: GrImportLine): string => {
    const routeWithStockName = importLine.routes.find((route) => route.stockName);
    return routeWithStockName?.stockName || importLine.description1 || importLine.stockCode;
  };

  const getImportLineMessage = (importLine: GrImportLine, orderLine: GrLine | null): string => {
    if (!orderLine) {
      const totalQuantity = importLine.routes.reduce((sum, route) => sum + route.quantity, 0);
      return `${totalQuantity} ${importLine.stockCode} için sipariş bilgisi bulunamadı`;
    }
    const totalImportQuantity = importLine.routes.reduce((sum, route) => sum + route.quantity, 0);
    return `Siparişte talep edilen ${orderLine.quantity} ${orderLine.unit} stok doğrultusunda ${totalImportQuantity} ${orderLine.unit} kadar giriş yapıldı`;
  };

  const filteredImportLines = useMemo(() => {
    if (!grImportLines) return [];
    if (!searchQuery.trim()) return grImportLines;
    
    const query = searchQuery.toLowerCase();
    return grImportLines.filter((importLine) => {
      const stockCode = importLine.stockCode.toLowerCase();
      const routeWithStockName = importLine.routes.find((route) => route.stockName);
      const stockName = (routeWithStockName?.stockName || importLine.description1 || importLine.stockCode).toLowerCase();
      return stockCode.includes(query) || stockName.includes(query);
    });
  }, [grImportLines, searchQuery]);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-7xl w-[95vw] h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl">
            {t('goodsReceipt.report.detailTitle', 'Mal Kabul Detayı')} - #{grHeaderId}
          </DialogTitle>
          <DialogDescription>
            {t('goodsReceipt.report.detailDescription', 'Mal kabul işleminin detaylı bilgileri')}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
            <div className="flex items-center justify-center py-12 flex-1">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        )}

        {error && (
            <div className="flex items-center justify-center py-12 flex-1">
            <p className="text-destructive">
              {t('goodsReceipt.report.detailError', 'Detay yüklenirken bir hata oluştu')}
            </p>
          </div>
        )}

        {data && (
            <div className="flex-1 overflow-hidden flex flex-col px-4 py-2">
              <Tabs defaultValue="info" className="w-full h-full flex flex-col">
                <TabsList className="w-full justify-start px-6 shrink-0">
                  <TabsTrigger value="info">
                    {t('goodsReceipt.report.info', 'Bilgiler')}
                  </TabsTrigger>
                  <TabsTrigger value="content">
                    {t('goodsReceipt.report.content', 'Mal Kabul İçeriği')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
                  <div className="space-y-4">
            <Card>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">{t('goodsReceipt.report.orderId', 'Sipariş No')}: </span>
                            <span className="font-semibold">{data.orderId || '-'}</span>
                  </div>
                          <div>
                            <span className="text-muted-foreground">{t('goodsReceipt.report.customerCode', 'Cari Kodu')}: </span>
                            <span className="font-semibold">{data.customerCode || '-'}</span>
                  </div>
                          <div>
                            <span className="text-muted-foreground">{t('goodsReceipt.report.projectCode', 'Proje Kodu')}: </span>
                            <span className="font-semibold">{data.projectCode || '-'}</span>
                  </div>
                          <div>
                            <span className="text-muted-foreground">{t('goodsReceipt.report.documentType', 'Belge Tipi')}: </span>
                            <Badge variant={data.documentType === 'E-İrsaliye' ? 'secondary' : 'default'} className="ml-1">
                      {data.documentType || '-'}
                    </Badge>
                  </div>
                          <div>
                            <span className="text-muted-foreground">{t('goodsReceipt.report.plannedDate', 'Planlanan Tarih')}: </span>
                            <span className="font-semibold">{formatDate(data.plannedDate)}</span>
                  </div>
                          <div>
                            <span className="text-muted-foreground">{t('goodsReceipt.report.branchCode', 'Şube Kodu')}: </span>
                            <span className="font-semibold">{data.branchCode || '-'}</span>
                  </div>
                          <div>
                            <span className="text-muted-foreground">{t('goodsReceipt.report.yearCode', 'Yıl Kodu')}: </span>
                            <span className="font-semibold">{data.yearCode || '-'}</span>
                  </div>
                          <div>
                            <span className="text-muted-foreground">{t('goodsReceipt.report.isPlanned', 'Planlı')}: </span>
                            <Badge variant={data.isPlanned ? 'default' : 'outline'} className="ml-1">
                      {data.isPlanned ? t('common.yes', 'Evet') : t('common.no', 'Hayır')}
                    </Badge>
                  </div>
                          <div>
                            <span className="text-muted-foreground">{t('goodsReceipt.report.priorityLevel', 'Öncelik Seviyesi')}: </span>
                            <span className="font-semibold">{data.priorityLevel}</span>
                  </div>
                  {data.description1 && (
                            <div className="col-span-3">
                              <span className="text-muted-foreground">{t('goodsReceipt.report.description1', 'Açıklama 1')}: </span>
                              <span>{data.description1}</span>
                    </div>
                  )}
                  {data.description2 && (
                            <div className="col-span-3">
                              <span className="text-muted-foreground">{t('goodsReceipt.report.description2', 'Açıklama 2')}: </span>
                              <span>{data.description2}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="status" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="status">
                  {t('goodsReceipt.report.statusInfo', 'Durum')}
                </TabsTrigger>
                <TabsTrigger value="erp">
                  {t('goodsReceipt.report.erpInfo', 'ERP')}
                </TabsTrigger>
                <TabsTrigger value="additional">
                  {t('goodsReceipt.report.additionalInfo', 'Ek Bilgiler')}
                </TabsTrigger>
                <TabsTrigger value="audit">
                  {t('goodsReceipt.report.auditInfo', 'Denetim')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="status" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableHead className="w-1/3 md:w-1/4">
                            {t('goodsReceipt.report.isCompleted', 'Tamamlandı')}
                          </TableHead>
                          <TableCell>
                            <Badge variant={data.isCompleted ? 'default' : 'outline'}>
                              {data.isCompleted ? t('common.yes', 'Evet') : t('common.no', 'Hayır')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.completionDate', 'Tamamlanma Tarihi')}</TableHead>
                          <TableCell>{formatDate(data.completionDate)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.isPendingApproval', 'Onay Bekliyor')}</TableHead>
                          <TableCell>
                            <Badge variant={data.isPendingApproval ? 'secondary' : 'outline'}>
                              {data.isPendingApproval ? t('common.yes', 'Evet') : t('common.no', 'Hayır')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.approvalStatus', 'Onay Durumu')}</TableHead>
                          <TableCell>
                            {data.approvalStatus !== null ? (
                              <Badge variant={data.approvalStatus ? 'default' : 'destructive'}>
                                {data.approvalStatus
                                  ? t('goodsReceipt.report.approved', 'Onaylandı')
                                  : t('goodsReceipt.report.rejected', 'Reddedildi')}
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.approvedBy', 'Onaylayan')}</TableHead>
                          <TableCell>{data.approvedByUserId || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.approvalDate', 'Onay Tarihi')}</TableHead>
                          <TableCell>{formatDateTime(data.approvalDate)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="erp" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableHead className="w-1/3 md:w-1/4">
                            {t('goodsReceipt.report.isERPIntegrated', 'ERP Entegre')}
                          </TableHead>
                          <TableCell>
                            <Badge variant={data.isERPIntegrated ? 'default' : 'outline'}>
                              {data.isERPIntegrated ? t('common.yes', 'Evet') : t('common.no', 'Hayır')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.erpReferenceNumber', 'ERP Referans No')}</TableHead>
                          <TableCell>{data.erpReferenceNumber || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.erpIntegrationDate', 'ERP Entegrasyon Tarihi')}</TableHead>
                          <TableCell>{formatDateTime(data.erpIntegrationDate)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.erpIntegrationStatus', 'ERP Entegrasyon Durumu')}</TableHead>
                          <TableCell>{data.erpIntegrationStatus || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.erpErrorMessage', 'ERP Hata Mesajı')}</TableHead>
                          <TableCell>
                            {data.erpErrorMessage ? (
                              <span className="text-destructive text-sm">{data.erpErrorMessage}</span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="additional" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableHead className="w-1/3 md:w-1/4">
                            {t('goodsReceipt.report.returnCode', 'İade Kodu')}
                          </TableHead>
                          <TableCell>
                            <Badge variant={data.returnCode ? 'secondary' : 'outline'}>
                              {data.returnCode ? t('common.yes', 'Evet') : t('common.no', 'Hayır')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.ocrSource', 'OCR Kaynağı')}</TableHead>
                          <TableCell>
                            <Badge variant={data.ocrSource ? 'secondary' : 'outline'}>
                              {data.ocrSource ? t('common.yes', 'Evet') : t('common.no', 'Hayır')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        {data.description3 && (
                          <TableRow>
                            <TableHead>{t('goodsReceipt.report.description3', 'Açıklama 3')}</TableHead>
                            <TableCell>{data.description3}</TableCell>
                          </TableRow>
                        )}
                        {data.description4 && (
                          <TableRow>
                            <TableHead>{t('goodsReceipt.report.description4', 'Açıklama 4')}</TableHead>
                            <TableCell>{data.description4}</TableCell>
                          </TableRow>
                        )}
                        {data.description5 && (
                          <TableRow>
                            <TableHead>{t('goodsReceipt.report.description5', 'Açıklama 5')}</TableHead>
                            <TableCell>{data.description5}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audit" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableHead className="w-1/3 md:w-1/4">
                            {t('goodsReceipt.report.createdBy', 'Oluşturan')}
                          </TableHead>
                          <TableCell>{data.createdByFullUser || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{t('goodsReceipt.report.createdDate', 'Oluşturulma Tarihi')}</TableHead>
                          <TableCell>{formatDateTime(data.createdDate)}</TableCell>
                        </TableRow>
                        {data.updatedByFullUser && (
                          <TableRow>
                            <TableHead>{t('goodsReceipt.report.updatedBy', 'Güncelleyen')}</TableHead>
                            <TableCell>{data.updatedByFullUser}</TableCell>
                          </TableRow>
                        )}
                        {data.updatedDate && (
                          <TableRow>
                            <TableHead>{t('goodsReceipt.report.updatedDate', 'Güncellenme Tarihi')}</TableHead>
                            <TableCell>{formatDateTime(data.updatedDate)}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
                  <div className="space-y-4">
                    <div className="relative flex items-center">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('goodsReceipt.report.searchContent', 'Stok kodu veya adı ile ara...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-10"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <VoiceSearchButton
                          onResult={(text) => setSearchQuery(text)}
                          size="sm"
                          variant="ghost"
                        />
                      </div>
                    </div>

                    {filteredImportLines && filteredImportLines.length > 0 ? (
                      <Accordion type="single" collapsible className="w-full">
                        {filteredImportLines.map((importLine) => {
                          const orderLine = getOrderLineForImportLine(importLine);
                          const message = getImportLineMessage(importLine, orderLine);
                          const totalQuantity = importLine.routes.reduce((sum, route) => sum + route.quantity, 0);
                          const warehouses = Array.from(
                            new Set(importLine.routes.map((route) => route.targetWarehouse).filter((wh): wh is number => wh !== null))
                          );

                          return (
                            <AccordionItem key={importLine.id} value={`item-${importLine.id}`}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <div className="flex items-center gap-3 flex-1 text-left">
                                    <Badge>{importLine.stockCode}</Badge>
                                    <span className="font-medium">{getImportLineStockName(importLine)}</span>
                                    {orderLine && (
                                      <Badge variant="secondary" className="text-xs">
                                        {orderLine.quantity} {orderLine.unit}
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {totalQuantity} {orderLine?.unit || ''}
                                    </Badge>
                                    {warehouses.length > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        Depo: {warehouses.join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="pt-2 space-y-3">
                                  <p className="text-sm text-muted-foreground">{message}</p>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    {orderLine && (
                                      <>
                                        <div>
                                          <span className="text-muted-foreground">{t('goodsReceipt.report.erpOrderNo', 'ERP Sipariş No')}: </span>
                                          <span>{orderLine.erpOrderNo}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">{t('goodsReceipt.report.description', 'Açıklama')}: </span>
                                          <span>{orderLine.description}</span>
                                        </div>
                                      </>
                                    )}
                                    <div>
                                      <span className="text-muted-foreground">{t('goodsReceipt.report.totalImportQuantity', 'Toplam İçerik Miktarı')}: </span>
                                      <span className="font-semibold">{totalQuantity}</span>
                                    </div>
                                    {warehouses.length > 0 && (
                                      <div>
                                        <span className="text-muted-foreground">{t('goodsReceipt.report.targetWarehouse', 'Hedef Depo')}: </span>
                                        <span>{warehouses.join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleImportLineClick(importLine)}
                                    className="w-full"
                                  >
                                    {t('common.details', 'Detaylar')}
                                  </Button>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    ) : (
                      <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">
                          {searchQuery
                            ? t('goodsReceipt.report.noSearchResults', 'Arama sonucu bulunamadı')
                            : t('goodsReceipt.report.noImportLines', 'İçerik satırı bulunamadı')}
                        </p>
                      </div>
                    )}
                  </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>

      <ImportLineDetailDialog
        importLine={selectedImportLine}
        orderLine={selectedImportLine ? getOrderLineForImportLine(selectedImportLine) : null}
        isOpen={isImportLineDialogOpen}
        onClose={() => {
          setIsImportLineDialogOpen(false);
          setSelectedImportLine(null);
        }}
      />
    </>
  );
}
