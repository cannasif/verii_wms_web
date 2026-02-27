import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { usePHeader } from '../hooks/usePHeader';
import { usePPackagesByHeader } from '../hooks/usePPackagesByHeader';
import { usePLinesByHeader } from '../hooks/usePLinesByHeader';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PackageDetailDialogProps {
  headerId: number;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'Draft':
      return 'bg-gray-100 text-gray-800';
    case 'Packing':
      return 'bg-blue-100 text-blue-800';
    case 'Packed':
      return 'bg-green-100 text-green-800';
    case 'Shipped':
      return 'bg-purple-100 text-purple-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    case 'Open':
      return 'bg-yellow-100 text-yellow-800';
    case 'Closed':
      return 'bg-gray-100 text-gray-800';
    case 'Loaded':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function PackageDetailDialog({
  headerId,
  isOpen,
  onClose,
}: PackageDetailDialogProps): ReactElement {
  const { t } = useTranslation();
  const { data: header, isLoading: isLoadingHeader } = usePHeader(headerId);
  const { data: packages, isLoading: isLoadingPackages } = usePPackagesByHeader(headerId);
  const { data: lines, isLoading: isLoadingLines } = usePLinesByHeader(headerId);

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (isLoadingHeader) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('package.list.detailTitle', 'Paketleme Detayı')}</DialogTitle>
            <DialogDescription>{t('common.loading', 'Yükleniyor...')}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (!header) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('package.list.detailTitle', 'Paketleme Detayı')}</DialogTitle>
            <DialogDescription>
              {t('package.detail.notFound', 'Paketleme bulunamadı')}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-7xl w-[95vw] h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl">
            {t('package.list.detailTitle', 'Paketleme Detayı')} - {header.packingNo}
          </DialogTitle>
          <DialogDescription>
            {t('package.list.detailDescription', 'Paketleme detaylı bilgileri')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 shrink-0">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {t('package.detail.basicInfo', 'Temel Bilgiler')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('package.form.packingNo', 'Paketleme No')}
                    </span>
                    <span className="text-sm font-semibold">{header.packingNo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('package.form.packingDate', 'Paketleme Tarihi')}
                    </span>
                    <span className="text-sm">{formatDate(header.packingDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('package.form.warehouseCode', 'Depo Kodu')}
                    </span>
                    <span className="text-sm">{header.warehouseCode || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('package.form.customerCode', 'Cari Kodu')}
                    </span>
                    <span className="text-sm">
                      {header.customerCode || '-'}
                      {header.customerName && ` (${header.customerName})`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('package.form.status', 'Durum')}
                    </span>
                    <Badge className={getStatusBadgeColor(header.status)}>
                      {t(`package.status.${header.status.toLowerCase()}`, header.status)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {t('package.detail.summary', 'Özet Bilgiler')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('package.detail.totalPackageCount', 'Toplam Paket Sayısı')}
                    </span>
                    <span className="text-sm font-semibold">{header.totalPackageCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('package.detail.totalQuantity', 'Toplam Miktar')}
                    </span>
                    <span className="text-sm font-semibold">{header.totalQuantity || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('package.detail.totalGrossWeight', 'Toplam Brüt Ağırlık')}
                    </span>
                    <span className="text-sm font-semibold">{header.totalGrossWeight || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('package.detail.totalVolume', 'Toplam Hacim')}
                    </span>
                    <span className="text-sm font-semibold">{header.totalVolume || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {t('package.detail.shippingInfo', 'Kargo Bilgileri')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('package.form.trackingNo', 'Takip No')}
                    </span>
                    <span className="text-sm">{header.trackingNo || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('package.form.carrierServiceType', 'Kargo Servis Tipi')}
                    </span>
                    <span className="text-sm">{header.carrierServiceType || '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="packages" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="shrink-0">
              <TabsTrigger value="packages">
                {t('package.detail.packages', 'Paketler')} ({packages?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="lines">
                {t('package.detail.lines', 'Satırlar')} ({lines?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="packages" className="flex-1 overflow-auto mt-4">
              {isLoadingPackages ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('common.loading', 'Yükleniyor...')}</p>
                </div>
              ) : packages && packages.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('package.detail.packageNo', 'Paket No')}</TableHead>
                      <TableHead>{t('package.detail.packageType', 'Paket Tipi')}</TableHead>
                      <TableHead>{t('package.detail.barcode', 'Barkod')}</TableHead>
                      <TableHead>{t('package.detail.status', 'Durum')}</TableHead>
                      <TableHead>{t('package.detail.netWeight', 'Net Ağırlık')}</TableHead>
                      <TableHead>{t('package.detail.grossWeight', 'Brüt Ağırlık')}</TableHead>
                      <TableHead>{t('package.detail.volume', 'Hacim')}</TableHead>
                      <TableHead>{t('package.detail.isMixed', 'Karışık')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell>{pkg.packageNo}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{pkg.packageType}</Badge>
                        </TableCell>
                        <TableCell>{pkg.barcode || '-'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(pkg.status)}>
                            {String(t(`package.packageStatus.${pkg.status.toLowerCase()}`, pkg.status))}
                          </Badge>
                        </TableCell>
                        <TableCell>{pkg.netWeight || '-'}</TableCell>
                        <TableCell>{pkg.grossWeight || '-'}</TableCell>
                        <TableCell>{pkg.volume || '-'}</TableCell>
                        <TableCell>{pkg.isMixed ? t('common.yes', 'Evet') : t('common.no', 'Hayır')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {t('package.detail.noPackages', 'Paket bulunamadı')}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="lines" className="flex-1 overflow-auto mt-4">
              {isLoadingLines ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('common.loading', 'Yükleniyor...')}</p>
                </div>
              ) : lines && lines.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('package.detail.barcode', 'Barkod')}</TableHead>
                      <TableHead>{t('package.detail.stockCode', 'Stok Kodu')}</TableHead>
                      <TableHead>{t('package.detail.stockName', 'Stok Adı')}</TableHead>
                      <TableHead>{t('package.detail.yapKod', 'Yap Kodu')}</TableHead>
                      <TableHead>{t('package.detail.yapAcik', 'Yap Açıklama')}</TableHead>
                      <TableHead>{t('package.detail.quantity', 'Miktar')}</TableHead>
                      <TableHead>{t('package.detail.serialNo', 'Seri No')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line) => {
                      const packageBarcode = packages?.find((p) => p.id === line.packageId)?.barcode || '-';
                      return (
                        <TableRow key={line.id}>
                          <TableCell>{packageBarcode}</TableCell>
                          <TableCell>{line.stockCode}</TableCell>
                          <TableCell>{line.stockName || '-'}</TableCell>
                          <TableCell>{line.yapKod}</TableCell>
                          <TableCell>{line.yapAcik || '-'}</TableCell>
                          <TableCell>{line.quantity}</TableCell>
                          <TableCell>
                            {[line.serialNo, line.serialNo2, line.serialNo3, line.serialNo4]
                              .filter(Boolean)
                              .join(', ') || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('package.detail.noLines', 'Satır bulunamadı')}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

