import { type ReactElement, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUIStore } from '@/stores/ui-store';
import { usePPackage } from '../hooks/usePPackage';
import { usePLinesByPackage } from '../hooks/usePLinesByPackage';
import { useDeletePPackage } from '../hooks/useDeletePPackage';
import { useCreatePLine } from '../hooks/useCreatePLine';
import { useDeletePLine } from '../hooks/useDeletePLine';
import { useStokBarcode } from '../hooks/useStokBarcode';
import { pLineFormSchema, type PLineFormData, type StokBarcodeDto } from '../types/package';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ArrowLeft, Barcode, Camera, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import type { PLineDto } from '../types/package';

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
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

export function PackagePackageDetailPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
  const packageId = id ? parseInt(id, 10) : undefined;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  const { data: packageData, isLoading: isLoadingPackage } = usePPackage(packageId);
  const { data: lines, isLoading: isLoadingLines } = usePLinesByPackage(packageId);
  const deleteMutation = useDeletePPackage();
  const createLineMutation = useCreatePLine();
  const deleteLineMutation = useDeletePLine();
  const { data: barcodeData, isLoading: isSearching } = useStokBarcode(searchBarcode, '1', enableSearch);

  const lineSchema = useMemo(() => pLineFormSchema(t), [t]);

  const lineForm = useForm<PLineFormData>({
    resolver: zodResolver(lineSchema),
    defaultValues: {
      packingHeaderId: packageData?.packingHeaderId || 0,
      packageId: packageId || 0,
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
    if (packageData) {
      lineForm.setValue('packingHeaderId', packageData.packingHeaderId);
      lineForm.setValue('packageId', packageData.id);
    }
  }, [packageData, lineForm]);

  useEffect(() => {
    if (packageData) {
      setPageTitle(t('package.packageDetail.title') + ' - ' + packageData.packageNo);
    } else {
      setPageTitle(t('package.packageDetail.title'));
    }
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle, packageData]);

  const handleDelete = async (): Promise<void> => {
    if (!packageId || !packageData) return;

    try {
      await deleteMutation.mutateAsync(packageId);
      toast.success(t('package.packageDetail.deleteSuccess'));
      navigate(`/package/detail/${packageData.packingHeaderId}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.packageDetail.deleteError')
      );
    }
  };

  const handleDeleteLine = async (lineId: number): Promise<void> => {
    try {
      await deleteLineMutation.mutateAsync(lineId);
      toast.success(t('package.packageDetail.lineDeleteSuccess'));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.packageDetail.lineDeleteError')
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
      toast.error(t('package.packageDetail.stockNotFound'));
      setEnableSearch(false);
    }
  }, [barcodeData, t]);

  const handleBarcodeSearch = useCallback(() => {
    if (!barcodeInput.trim()) {
      toast.error(t('package.packageDetail.enterBarcode'));
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
        if (scannerContainerRef.current && document.getElementById('barcode-scanner-package')) {
          resolve();
        } else {
          const checkElement = setInterval(() => {
            if (scannerContainerRef.current && document.getElementById('barcode-scanner-package')) {
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

      if (!scannerContainerRef.current || !document.getElementById('barcode-scanner-package')) {
        toast.error(t('package.packageDetail.cameraError'));
        setIsCameraOpen(false);
        return;
      }

      const scannerId = 'barcode-scanner-package';
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
            toast.success(t('package.packageDetail.barcodeScanned'));
            setTimeout(() => {
              handleBarcodeSearch();
            }, 100);
          },
          () => {
          }
        );
      } catch (err) {
        toast.error(t('package.packageDetail.cameraError'));
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
      toast.error(t('package.packageDetail.noStockSelected'));
      return;
    }

    if (quantity <= 0) {
      toast.error(t('package.packageDetail.invalidQuantity'));
      return;
    }

    if (!packageData) {
      toast.error(t('package.packageDetail.packageNotFound'));
      return;
    }

    try {
      await createLineMutation.mutateAsync({
        packingHeaderId: packageData.packingHeaderId,
        packageId: packageData.id,
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
      toast.success(t('package.packageDetail.lineAddSuccess'));
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
          : t('package.packageDetail.lineAddError')
      );
    }
  };

  if (isLoadingPackage) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{t('package.packageDetail.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <div className="crm-toolbar flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t('package.packageDetail.title')}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{packageData.packageNo}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(`/package/detail/${packageData.packingHeaderId}`)}>
                <ArrowLeft className="size-4 mr-2" />
                {t('package.packageDetail.backToHeader')}
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="size-4 mr-2" />
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.packageDetail.status')}
                </p>
                <Badge className={getStatusBadgeColor(packageData.status)}>
                  {t(`package.packageStatus.${packageData.status.toLowerCase()}`, packageData.status)}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.packageDetail.packageType')}
                </p>
                <p className="text-sm font-medium">{packageData.packageType}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.packageDetail.barcode')}
                </p>
                <p className="text-sm font-medium">{packageData.barcode || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.packageDetail.isMixed')}
                </p>
                <p className="text-sm font-medium">{packageData.isMixed ? t('common.yes') : t('common.no')}</p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-3">
                {t('package.packageDetail.dimensions')}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t('package.packageDetail.length')}
                  </p>
                  <p className="text-sm font-medium">{packageData.length || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t('package.packageDetail.width')}
                  </p>
                  <p className="text-sm font-medium">{packageData.width || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t('package.packageDetail.height')}
                  </p>
                  <p className="text-sm font-medium">{packageData.height || '-'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.packageDetail.volume')}
                </p>
                <p className="text-sm font-medium">{packageData.volume || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.packageDetail.netWeight')}
                </p>
                <p className="text-sm font-medium">{packageData.netWeight || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.packageDetail.grossWeight')}
                </p>
                <p className="text-sm font-medium">{packageData.grossWeight || '-'}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <Button onClick={() => setLineDialogOpen(true)}>
              <Plus className="size-4 mr-2" />
              {t('package.packageDetail.addLine')}
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
                      <TableHead>{t('package.packageDetail.barcode')}</TableHead>
                      <TableHead>{t('package.packageDetail.stockCode')}</TableHead>
                      <TableHead>{t('package.packageDetail.stockName')}</TableHead>
                      <TableHead>{t('package.packageDetail.yapKod')}</TableHead>
                      <TableHead>{t('package.packageDetail.yapAcik')}</TableHead>
                      <TableHead>{t('package.packageDetail.quantity')}</TableHead>
                      <TableHead>{t('package.packageDetail.serialNo')}</TableHead>
                      <TableHead>{t('package.packageDetail.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line: PLineDto) => (
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLine(line.id)}
                              disabled={deleteLineMutation.isPending}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                              {t('package.packageDetail.barcode')}
                            </p>
                            <p className="text-sm font-medium">{line.barcode || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {t('package.packageDetail.stockCode')}
                            </p>
                            <p className="text-sm font-medium">{line.stockCode}</p>
                          </div>
                        </div>
                        <div className="pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {t('package.packageDetail.stockName')}
                          </p>
                          <p className="text-sm font-medium">{line.stockName || '-'}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 pt-3 border-t sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {t('package.packageDetail.yapKod')}
                            </p>
                            <p className="text-sm font-medium">{line.yapKod}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {t('package.packageDetail.quantity')}
                            </p>
                            <p className="text-sm font-medium">{line.quantity}</p>
                          </div>
                        </div>
                        {line.yapAcik && (
                          <div className="pt-3 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {t('package.packageDetail.yapAcik')}
                            </p>
                            <p className="text-sm font-medium">{line.yapAcik}</p>
                          </div>
                        )}
                        {(line.serialNo || line.serialNo2 || line.serialNo3 || line.serialNo4) && (
                          <div className="pt-3 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {t('package.packageDetail.serialNo')}
                            </p>
                            <p className="text-sm font-medium">
                              {line.serialNo || line.serialNo2 || line.serialNo3 || line.serialNo4}
                            </p>
                          </div>
                        )}
                        <div className="pt-3 border-t">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={() => handleDeleteLine(line.id)}
                            disabled={deleteLineMutation.isPending}
                          >
                            <Trash2 className="size-4 mr-2" />
                            {t('common.delete')}
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
              {t('package.packageDetail.noLines')}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('package.packageDetail.deleteConfirm')}</DialogTitle>
            <DialogDescription>
              {t('package.packageDetail.deleteConfirmMessage')}
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
            <DialogTitle>{t('package.packageDetail.addLine')}</DialogTitle>
            <DialogDescription>
              {t('package.packageDetail.addLineDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                      placeholder={t('package.packageDetail.barcodePlaceholder')}
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
                      t('common.search')
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
                              <span className="font-medium">{t('package.form.yapKod')}:</span> {selectedStock.yapKod}
                            </p>
                            {selectedStock.yapAcik && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">{t('package.form.yapAcik')}:</span> {selectedStock.yapAcik}
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
                          {t('package.packageDetail.quantity')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="h-9"
                          placeholder={t('package.packageDetail.quantity')}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          {t('package.form.serialNo')}
                        </label>
                        <Input
                          value={serialNo}
                          onChange={(e) => setSerialNo(e.target.value)}
                          className="h-9"
                          placeholder={t('package.form.serialNo')}
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
                        {t('package.packageDetail.add')}
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
                    <DialogTitle>{t('package.packageDetail.scanBarcode')}</DialogTitle>
                    <DialogDescription>
                      {t('package.packageDetail.scanBarcodeDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div ref={scannerContainerRef} className="w-full">
                    <div id="barcode-scanner-package" className="w-full" />
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
        </DialogContent>
      </Dialog>
    </div>
  );
}

