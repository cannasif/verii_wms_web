import { type ReactElement, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUIStore } from '@/stores/ui-store';
import { usePHeader } from '../hooks/usePHeader';
import { usePPackagesByHeader } from '../hooks/usePPackagesByHeader';
import { usePLinesByHeader } from '../hooks/usePLinesByHeader';
import { useCreatePPackage } from '../hooks/useCreatePPackage';
import { useCreatePLine } from '../hooks/useCreatePLine';
import { useMatchPlines } from '../hooks/useMatchPlines';
import { useStokBarcode } from '../hooks/useStokBarcode';
import { pPackageFormSchema, pLineFormSchema, type PPackageFormData, type PLineFormData, type StokBarcodeDto } from '../types/package';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, ArrowLeft, Edit, Barcode, Camera, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import type { PPackageDto, PLineDto } from '../types/package';

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

export function PackageDetailPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
  
  const headerId = useMemo(() => {
    if (!id) return undefined;
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? undefined : parsed;
  }, [id]);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [enableSearch, setEnableSearch] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StokBarcodeDto | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [serialNo, setSerialNo] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const { data: header, isLoading: isLoadingHeader } = usePHeader(headerId);
  const { data: packages, isLoading: isLoadingPackages } = usePPackagesByHeader(headerId);
  const { data: lines, isLoading: isLoadingLines } = usePLinesByHeader(headerId);
  const createPackageMutation = useCreatePPackage();
  const createLineMutation = useCreatePLine();
  const matchPlinesMutation = useMatchPlines();
  const { data: barcodeData, isLoading: isSearching } = useStokBarcode(searchBarcode, '1', enableSearch);

  const packageSchema = useMemo(() => pPackageFormSchema(t), [t]);
  const lineSchema = useMemo(() => pLineFormSchema(t), [t]);

  const packageForm = useForm<PPackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      packingHeaderId: headerId || 0,
      packageNo: '',
      packageType: 'Box',
      barcode: '',
      length: undefined,
      width: undefined,
      height: undefined,
      volume: undefined,
      netWeight: undefined,
      tareWeight: undefined,
      grossWeight: undefined,
      isMixed: false,
      status: 'Open',
    },
  });

  const lineForm = useForm<PLineFormData>({
    resolver: zodResolver(lineSchema),
    defaultValues: {
      packingHeaderId: headerId || 0,
      packageId: 0,
      barcode: '',
      stockCode: '',
      yapKod: '',
      quantity: 0,
      serialNo: '',
      serialNo2: '',
      serialNo3: '',
      serialNo4: '',
      sourceRouteId: undefined,
    },
  });

  useEffect(() => {
    if (headerId) {
      packageForm.setValue('packingHeaderId', headerId);
      lineForm.setValue('packingHeaderId', headerId);
    }
  }, [headerId, packageForm, lineForm]);

  useEffect(() => {
    if (header) {
      setPageTitle(t('package.detail.title', 'Paketleme Detayı') + ' - ' + header.packingNo);
    } else {
      setPageTitle(t('package.detail.title', 'Paketleme Detayı'));
    }
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle, header]);

  const handlePackageSubmit = async (data: PPackageFormData): Promise<void> => {
    try {
      const packageNoValue = data.packageNo || '';
      await createPackageMutation.mutateAsync({
        packingHeaderId: data.packingHeaderId,
        packageNo: packageNoValue,
        packageType: data.packageType,
        barcode: packageNoValue,
        length: data.length,
        width: data.width,
        height: data.height,
        volume: data.volume,
        netWeight: data.netWeight,
        tareWeight: data.tareWeight,
        grossWeight: data.grossWeight,
        isMixed: data.isMixed,
        status: data.status,
      });
      toast.success(t('package.detail.packageAddSuccess', 'Paket başarıyla eklendi'));
      setPackageDialogOpen(false);
      packageForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.detail.packageAddError', 'Paket eklenirken bir hata oluştu')
      );
    }
  };

  useEffect(() => {
    if (barcodeData?.success && barcodeData.data && barcodeData.data.length > 0) {
      const stock = barcodeData.data[0];
      setSelectedStock(stock);
      setSerialNo(stock.seriBarkodMu ? stock.barkod : '');
      setEnableSearch(false);
    } else if (barcodeData && !barcodeData.success) {
      toast.error(t('package.detail.stockNotFound', 'Stok bulunamadı'));
      setEnableSearch(false);
    }
  }, [barcodeData, t]);

  const handleBarcodeSearch = useCallback(() => {
    if (!barcodeInput.trim()) {
      toast.error(t('package.detail.enterBarcode', 'Lütfen barkod giriniz'));
      return;
    }
    setSearchBarcode(barcodeInput);
    setEnableSearch(true);
  }, [barcodeInput, t]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBarcodeSearch();
    }
  };

  const handleOpenCamera = () => {
    setIsCameraOpen(true);
  };

  const handleCloseCamera = () => {
    if (qrCodeScannerRef.current) {
      qrCodeScannerRef.current.stop().catch(() => {
      });
      qrCodeScannerRef.current.clear();
      qrCodeScannerRef.current = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    if (!isCameraOpen) return;

    const initCamera = async (): Promise<void> => {
      await new Promise<void>((resolve) => {
        if (scannerContainerRef.current && document.getElementById('barcode-scanner')) {
          resolve();
        } else {
          const checkElement = setInterval(() => {
            if (scannerContainerRef.current && document.getElementById('barcode-scanner')) {
              clearInterval(checkElement);
              resolve();
            }
          }, 50);
          setTimeout(() => {
            clearInterval(checkElement);
            resolve();
          }, 1000);
        }
      });

      if (!scannerContainerRef.current || !document.getElementById('barcode-scanner')) {
        toast.error(t('package.detail.cameraError', 'Kamera açılamadı'));
        setIsCameraOpen(false);
        return;
      }

      const scannerId = 'barcode-scanner';
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
        ],
      };

      const html5QrCode = new Html5Qrcode(scannerId);
      qrCodeScannerRef.current = html5QrCode;

      try {
        const devices = await Html5Qrcode.getCameras();
        let cameraId: string | { facingMode: string } = { facingMode: 'environment' };
        
        const backCamera = devices.find((device) => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        
        if (backCamera) {
          cameraId = backCamera.id;
        }

        await html5QrCode.start(
          cameraId,
          config,
          (decodedText) => {
            setBarcodeInput(decodedText);
            handleCloseCamera();
            toast.success(t('package.detail.barcodeScanned', 'Barkod okundu'));
            setTimeout(() => {
              handleBarcodeSearch();
            }, 100);
          },
          () => {
          }
        );
      } catch (err) {
        toast.error(t('package.detail.cameraError', 'Kamera açılamadı'));
        console.error('Camera error:', err);
        handleCloseCamera();
      }
    };

    const timeoutId = setTimeout(() => {
      initCamera();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current.stop().catch(() => {
        });
        qrCodeScannerRef.current.clear();
        qrCodeScannerRef.current = null;
      }
    };
  }, [isCameraOpen, t, handleBarcodeSearch]);

  const handleLineSubmit = async (): Promise<void> => {
    if (!selectedStock) {
      toast.error(t('package.detail.noStockSelected', 'Lütfen önce stok bilgisi getirin'));
      return;
    }

    if (quantity <= 0) {
      toast.error(t('package.detail.invalidQuantity', 'Geçersiz miktar'));
      return;
    }

    try {
      await createLineMutation.mutateAsync({
        packingHeaderId: headerId || 0,
        packageId: lineForm.getValues('packageId'),
        barcode: selectedStock.barkod,
        stockCode: selectedStock.stokKodu,
        yapKod: selectedStock.yapKod || undefined,
        quantity: quantity,
        serialNo: serialNo || undefined,
        serialNo2: '',
        serialNo3: '',
        serialNo4: '',
        sourceRouteId: undefined,
      });
      toast.success(t('package.detail.lineAddSuccess', 'Satır başarıyla eklendi'));
      setLineDialogOpen(false);
      setBarcodeInput('');
      setSelectedStock(null);
      setQuantity(1);
      setSerialNo('');
      lineForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.detail.lineAddError', 'Satır eklenirken bir hata oluştu')
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

  if (isLoadingHeader) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!header) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{t('package.detail.notFound', 'Paketleme bulunamadı')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <div className="crm-toolbar flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t('package.detail.title', 'Paketleme Detayı')}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{header.packingNo}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/package/list')}>
                <ArrowLeft className="size-4 mr-2" />
                {t('common.back', 'Geri')}
              </Button>
              {header?.sourceType && header?.sourceHeaderId && (
                <Button
                  variant={header.isMatched ? 'destructive' : 'default'}
                  onClick={async () => {
                    if (!headerId) return;
                    try {
                      await matchPlinesMutation.mutateAsync({
                        pHeaderId: headerId,
                        isMatched: !header.isMatched,
                      });
                      toast.success(
                        header.isMatched
                          ? t('package.detail.unmatchSuccess', 'Bağlantı başarıyla kesildi')
                          : t('package.detail.matchSuccess', 'Eşleme başarıyla yapıldı')
                      );
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : t('package.detail.matchError', 'Eşleme işlemi sırasında bir hata oluştu')
                      );
                    }
                  }}
                  disabled={matchPlinesMutation.isPending}
                >
                  {matchPlinesMutation.isPending
                    ? t('common.saving', 'Kaydediliyor...')
                    : header.isMatched
                      ? t('package.detail.unmatch', 'Bağlantıyı Kes')
                      : t('package.detail.match', 'Eşle')}
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate(`/package/edit/${headerId}`)}>
                <Edit className="size-4 mr-2" />
                {t('common.edit', 'Düzenle')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.status', 'Durum')}
                </p>
                <Badge className={getStatusBadgeColor(header.status)}>
                  {t(`package.status.${header.status.toLowerCase()}`, header.status)}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.packingDate', 'Paketleme Tarihi')}
                </p>
                <p className="text-sm font-medium">{formatDate(header.packingDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.warehouseCode', 'Depo Kodu')}
                </p>
                <p className="text-sm font-medium">{header.warehouseCode || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.customerCode', 'Cari Kodu')}
                </p>
                <p className="text-sm font-medium">{header.customerCode || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.trackingNo', 'Takip No')}
                </p>
                <p className="text-sm font-medium">{header.trackingNo || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.customerName', 'Cari Adı')}
                </p>
                <p className="text-sm font-medium">{header.customerName || '-'}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t('package.list.sourceType', 'Kaynak Tipi')}
                  </p>
                  {header.sourceType ? (
                    <Badge variant="outline" className="text-xs">
                      {t(`package.sourceType.${header.sourceType.toUpperCase()}`, header.sourceType.toUpperCase())}
                    </Badge>
                  ) : (
                    <p className="text-sm font-medium">-</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t('package.list.matchedSource', 'Eşleşen Kaynak')}
                  </p>
                  <p className="text-sm font-medium">
                    {header.sourceHeaderId ? `#${header.sourceHeaderId}` : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.totalPackageCount', 'Toplam Paket')}
                </p>
                <p className="text-lg font-semibold">{header.totalPackageCount || 0}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.totalQuantity', 'Toplam Miktar')}
                </p>
                <p className="text-lg font-semibold">{header.totalQuantity || 0}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.totalGrossWeight', 'Toplam Brüt Ağırlık')}
                </p>
                <p className="text-lg font-semibold">{header.totalGrossWeight || 0}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="packages" className="w-full">
            <TabsList>
              <TabsTrigger value="packages">
                {t('package.detail.packages', 'Paketler')} ({packages?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="lines">
                {t('package.detail.lines', 'Satırlar')} ({lines?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="packages" className="mt-4">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setPackageDialogOpen(true)}>
                  <Plus className="size-4 mr-2" />
                  {t('package.detail.addPackage', 'Yeni Paket Ekle')}
                </Button>
              </div>
              {isLoadingPackages ? (
                <p className="text-muted-foreground">{t('common.loading')}</p>
              ) : packages && packages.length > 0 ? (
                <>
                  <div className="hidden md:block rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/[0.03]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('package.detail.packageNo', 'Paket No')}</TableHead>
                          <TableHead>{t('package.detail.packageType', 'Paket Tipi')}</TableHead>
                          <TableHead>{t('package.detail.status', 'Durum')}</TableHead>
                          <TableHead>{t('package.detail.netWeight', 'Net Ağırlık')}</TableHead>
                          <TableHead>{t('package.detail.grossWeight', 'Brüt Ağırlık')}</TableHead>
                          <TableHead>{t('package.detail.volume', 'Hacim')}</TableHead>
                          <TableHead>{t('package.detail.isMixed', 'Karışık')}</TableHead>
                          <TableHead>{t('package.detail.actions', 'İşlemler')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packages.map((pkg: PPackageDto) => (
                          <TableRow key={pkg.id}>
                            <TableCell className="font-medium">
                              <Button
                                variant="link"
                                className="p-0 h-auto"
                                onClick={() => navigate(`/package/package-detail/${pkg.id}`)}
                              >
                                {pkg.packageNo}
                              </Button>
                            </TableCell>
                            <TableCell>{pkg.packageType}</TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeColor(pkg.status)}>
                                {t(`package.packageStatus.${pkg.status.toLowerCase()}`, pkg.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>{pkg.netWeight || '-'}</TableCell>
                            <TableCell>{pkg.grossWeight || '-'}</TableCell>
                            <TableCell>{pkg.volume || '-'}</TableCell>
                            <TableCell>{pkg.isMixed ? t('common.yes') : t('common.no')}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/package/package-detail/${pkg.id}`)}
                                >
                                  <Eye className="size-4" />
                                  <span className="ml-2">{t('package.detail.viewDetails', 'Detay')}</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="md:hidden space-y-4 pb-1">
                    {packages.map((pkg: PPackageDto) => (
                      <Card key={pkg.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.packageNo', 'Paket No')}
                                </p>
                                <Button
                                  variant="link"
                                  className="p-0 h-auto font-semibold"
                                  onClick={() => navigate(`/package/package-detail/${pkg.id}`)}
                                >
                                  {pkg.packageNo}
                                </Button>
                              </div>
                              <Badge className={getStatusBadgeColor(pkg.status)}>
                                {t(`package.packageStatus.${pkg.status.toLowerCase()}`, pkg.status)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 gap-3 pt-3 border-t sm:grid-cols-2">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.packageType', 'Paket Tipi')}
                                </p>
                                <p className="text-sm font-medium">{pkg.packageType}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.isMixed', 'Karışık')}
                                </p>
                                <p className="text-sm font-medium">{pkg.isMixed ? t('common.yes') : t('common.no')}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.netWeight', 'Net Ağırlık')}
                                </p>
                                <p className="text-sm font-medium">{pkg.netWeight || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.grossWeight', 'Brüt Ağırlık')}
                                </p>
                                <p className="text-sm font-medium">{pkg.grossWeight || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.volume', 'Hacim')}
                                </p>
                                <p className="text-sm font-medium">{pkg.volume || '-'}</p>
                              </div>
                            </div>
                            <div className="pt-3 border-t">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate(`/package/package-detail/${pkg.id}`)}
                              >
                                <Eye className="size-4 mr-2" />
                                {t('package.detail.viewDetails', 'Detay')}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {t('package.detail.noPackages', 'Paket bulunamadı')}
                </p>
              )}
            </TabsContent>

            <TabsContent value="lines" className="mt-4">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setLineDialogOpen(true)}>
                  <Plus className="size-4 mr-2" />
                  {t('package.detail.addLine', 'Yeni Satır Ekle')}
                </Button>
              </div>
              {isLoadingLines ? (
                <p className="text-muted-foreground">{t('common.loading')}</p>
              ) : lines && lines.length > 0 ? (
                <>
                  <div className="hidden md:block rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/[0.03]">
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
                        {lines.map((line: PLineDto) => {
                          return (
                            <TableRow key={line.id}>
                              <TableCell>{line.barcode || '-'}</TableCell>
                              <TableCell>{line.stockCode}</TableCell>
                              <TableCell>{line.stockName || '-'}</TableCell>
                              <TableCell>{line.yapKod}</TableCell>
                              <TableCell>{line.yapAcik || '-'}</TableCell>
                              <TableCell>{line.quantity}</TableCell>
                              <TableCell>
                                {line.serialNo || line.serialNo2 || line.serialNo3 || line.serialNo4 || '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="md:hidden space-y-4 pb-1">
                    {lines.map((line: PLineDto) => (
                      <Card key={line.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.barcode', 'Barkod')}
                                </p>
                                <p className="text-sm font-medium">{line.barcode || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.stockCode', 'Stok Kodu')}
                                </p>
                                <p className="text-sm font-medium">{line.stockCode}</p>
                              </div>
                            </div>
                            <div className="pt-3 border-t">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                {t('package.detail.stockName', 'Stok Adı')}
                              </p>
                              <p className="text-sm font-medium">{line.stockName || '-'}</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 pt-3 border-t sm:grid-cols-2">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.yapKod', 'Yap Kodu')}
                                </p>
                                <p className="text-sm font-medium">{line.yapKod}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.quantity', 'Miktar')}
                                </p>
                                <p className="text-sm font-medium">{line.quantity}</p>
                              </div>
                            </div>
                            {line.yapAcik && (
                              <div className="pt-3 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.yapAcik', 'Yap Açıklama')}
                                </p>
                                <p className="text-sm font-medium">{line.yapAcik}</p>
                              </div>
                            )}
                            {(line.serialNo || line.serialNo2 || line.serialNo3 || line.serialNo4) && (
                              <div className="pt-3 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.serialNo', 'Seri No')}
                                </p>
                                <p className="text-sm font-medium">
                                  {line.serialNo || line.serialNo2 || line.serialNo3 || line.serialNo4}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {t('package.detail.noLines', 'Satır bulunamadı')}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>{t('package.detail.addPackage', 'Yeni Paket Ekle')}</DialogTitle>
            <DialogDescription>
              {t('package.detail.addPackageDescription', 'Yeni bir paket ekleyin')}
            </DialogDescription>
          </DialogHeader>
          <Form {...packageForm}>
            <form onSubmit={packageForm.handleSubmit(handlePackageSubmit)} className="space-y-6 crm-page">
              <div className="space-y-4">
                <FormField
                  control={packageForm.control}
                  name="packageNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('package.form.packageNo', 'Paket No')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value);
                            packageForm.setValue('barcode', value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={packageForm.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('package.form.packageType', 'Paket Tipi')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Box">{t('package.packageType.box', 'Kutu')}</SelectItem>
                            <SelectItem value="Pallet">{t('package.packageType.pallet', 'Palet')}</SelectItem>
                            <SelectItem value="Bag">{t('package.packageType.bag', 'Çanta')}</SelectItem>
                            <SelectItem value="Custom">{t('package.packageType.custom', 'Özel')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={packageForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('package.form.status', 'Durum')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Open">{t('package.packageStatus.open', 'Açık')}</SelectItem>
                            <SelectItem value="Closed">{t('package.packageStatus.closed', 'Kapalı')}</SelectItem>
                            <SelectItem value="Loaded">{t('package.packageStatus.loaded', 'Yüklendi')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {t('package.form.dimensions', 'Boyutlar')}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={packageForm.control}
                      name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t('package.form.length', 'Uzunluk')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={packageForm.control}
                      name="width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t('package.form.width', 'Genişlik')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={packageForm.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t('package.form.height', 'Yükseklik')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {t('package.form.weights', 'Ağırlık Bilgileri')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField
                      control={packageForm.control}
                      name="netWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t('package.form.netWeight', 'Net Ağırlık')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={packageForm.control}
                      name="tareWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t('package.form.tareWeight', 'Dara Ağırlık')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={packageForm.control}
                      name="grossWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t('package.form.grossWeight', 'Brüt Ağırlık')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <FormField
                    control={packageForm.control}
                    name="volume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('package.form.volume', 'Hacim')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setPackageDialogOpen(false);
                    packageForm.reset();
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createPackageMutation.isPending} className="w-full sm:w-auto">
                  {createPackageMutation.isPending ? t('common.saving') : t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={lineDialogOpen} onOpenChange={(open) => {
        setLineDialogOpen(open);
        if (!open) {
          setBarcodeInput('');
          setSelectedStock(null);
          setQuantity(1);
          setSerialNo('');
          setEnableSearch(false);
          setSearchBarcode('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>{t('package.detail.addLine', 'Yeni Satır Ekle')}</DialogTitle>
            <DialogDescription>
              {t('package.detail.addLineDescription', 'Barkod okutun veya yazın, sonra ara')}
            </DialogDescription>
          </DialogHeader>
          <Form {...lineForm}>
            <div className="space-y-4">
              <FormField
                control={lineForm.control}
                name="packageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('package.form.package', 'Paket')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      value={field.value ? field.value.toString() : ''}
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('package.form.selectPackage', 'Paket Seçin')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {packages?.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id.toString()}>
                            {pkg.barcode || pkg.packageNo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <Card className="py-0">
              <CardContent className="p-3 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4 hidden md:block" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute left-1 top-1/2 transform -translate-y-1/2 md:hidden h-8 w-8"
                      onClick={handleOpenCamera}
                    >
                      <Camera className="size-4 text-muted-foreground" />
                    </Button>
                    <Input
                      placeholder={t('package.detail.barcodePlaceholder', 'Barkod okutun veya yazın')}
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10 md:pl-9 h-10"
                    />
                  </div>
                  <Button onClick={handleBarcodeSearch} disabled={isSearching} size="default">
                    {isSearching ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      t('common.search', 'Ara')
                    )}
                  </Button>
                </div>

                {selectedStock && (
                  <div className="border rounded-lg p-3 space-y-3 bg-muted/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="mb-1 text-xs">
                          {selectedStock.stokKodu}
                        </Badge>
                        <p className="text-sm font-medium line-clamp-1">{selectedStock.stokAdi}</p>
                        {selectedStock.yapKod && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">{t('package.form.yapKod', 'Yap Kodu')}:</span> {selectedStock.yapKod}
                            </p>
                            {selectedStock.yapAcik && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">{t('package.form.yapAcik', 'Yap Açıklama')}:</span> {selectedStock.yapAcik}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        <Package className="size-3 mr-1" />
                        {selectedStock.olcuAdi}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          {t('package.detail.quantity', 'Miktar')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="h-9"
                          placeholder={t('package.detail.quantity', 'Miktar')}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          {t('package.form.serialNo', 'Seri No')}
                        </label>
                        <Input
                          value={serialNo}
                          onChange={(e) => setSerialNo(e.target.value)}
                          className="h-9"
                          placeholder={t('package.form.serialNo', 'Seri No')}
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button
                        onClick={handleLineSubmit}
                        disabled={createLineMutation.isPending}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 w-full"
                      >
                        {createLineMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin mr-1" />
                        ) : null}
                        {t('package.detail.add', 'Ekle')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {isCameraOpen && (
              <Dialog open={isCameraOpen} onOpenChange={handleCloseCamera}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('package.detail.scanBarcode', 'Barkod Okut')}</DialogTitle>
                    <DialogDescription>
                      {t('package.detail.scanBarcodeDescription', 'Kamerayı barkoda doğrultun')}
                    </DialogDescription>
                  </DialogHeader>
                  <div ref={scannerContainerRef} className="w-full">
                    <div id="barcode-scanner" className="w-full" />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseCamera}>
                      {t('common.cancel')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

