import { type ReactElement, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePPackagesByHeader } from '../../hooks/usePPackagesByHeader';
import { usePLinesByHeader } from '../../hooks/usePLinesByHeader';
import { useCreatePLine } from '../../hooks/useCreatePLine';
import { useDeletePLine } from '../../hooks/useDeletePLine';
import { useStokBarcode } from '../../hooks/useStokBarcode';
import { pLineFormSchema, type PLineFormData, type StokBarcodeDto } from '../../types/package';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Trash2, Barcode, Camera, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface Step3LineFormProps {
  packingHeaderId: number;
  onPrevious: () => void;
  onNext: () => void;
  onSaveAndExit: () => void;
}

export function Step3LineForm({
  packingHeaderId,
  onPrevious,
  onNext,
  onSaveAndExit,
}: Step3LineFormProps): ReactElement {
  const { t } = useTranslation();
  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<number | undefined>(undefined);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [enableSearch, setEnableSearch] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StokBarcodeDto | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const { data: packagesData } = usePPackagesByHeader(packingHeaderId);
  const { data: linesData, isLoading: isLoadingLines } = usePLinesByHeader(packingHeaderId);
  const { data: barcodeData, isLoading: isSearching } = useStokBarcode(searchBarcode, '1', enableSearch);
  const createMutation = useCreatePLine();
  const deleteMutation = useDeletePLine();

  const packages = packagesData || [];
  const lines = linesData || [];

  const schema = useMemo(() => pLineFormSchema(t), [t]);

  const form = useForm<PLineFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      packingHeaderId,
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
    if (barcodeData?.success && barcodeData.data && barcodeData.data.length > 0) {
      const stock = barcodeData.data[0];
      setSelectedStock(stock);
      form.setValue('barcode', stock.barkod);
      form.setValue('stockCode', stock.stokKodu);
      form.setValue('yapKod', stock.yapKod || '');
      form.setValue('quantity', stock.cevrim || 1);
      setEnableSearch(false);
    } else if (barcodeData && !barcodeData.success) {
      toast.error(t('package.wizard.step3.stockNotFound', 'Stok bulunamadı'));
      setEnableSearch(false);
    }
  }, [barcodeData, form, t]);

  const handleBarcodeSearch = useCallback(() => {
    if (!barcodeInput.trim()) {
      toast.error(t('package.wizard.step3.enterBarcode', 'Lütfen barkod giriniz'));
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

  const handleOpenDialog = (): void => {
    if (packages.length === 0) {
      toast.error(t('package.wizard.step3.noPackages', 'Önce paket eklemelisiniz'));
      return;
    }
    if (!selectedPackageId && packages.length > 0) {
      setSelectedPackageId(packages[0].id);
      form.setValue('packageId', packages[0].id);
    }
    setBarcodeInput('');
    setSelectedStock(null);
    setLineDialogOpen(true);
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
        if (scannerContainerRef.current && document.getElementById('barcode-scanner-line')) {
          resolve();
        } else {
          const checkElement = setInterval(() => {
            if (scannerContainerRef.current && document.getElementById('barcode-scanner-line')) {
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

      if (!scannerContainerRef.current || !document.getElementById('barcode-scanner-line')) {
        toast.error(t('package.wizard.step3.cameraError', 'Kamera açılamadı'));
        setIsCameraOpen(false);
        return;
      }

      const scannerId = 'barcode-scanner-line';
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
            toast.success(t('package.wizard.step3.barcodeScanned', 'Barkod okundu'));
            setTimeout(() => {
              handleBarcodeSearch();
            }, 100);
          },
          () => {
          }
        );
      } catch (err) {
        toast.error(t('package.wizard.step3.cameraError', 'Kamera açılamadı'));
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

  const handleSubmit = async (data: PLineFormData): Promise<void> => {
    try {
      await createMutation.mutateAsync({
        packingHeaderId: data.packingHeaderId,
        packageId: data.packageId,
        barcode: data.barcode || undefined,
        stockCode: data.stockCode,
        yapKod: data.yapKod || undefined,
        quantity: data.quantity,
        serialNo: data.serialNo || undefined,
        serialNo2: data.serialNo2 || undefined,
        serialNo3: data.serialNo3 || undefined,
        serialNo4: data.serialNo4 || undefined,
        sourceRouteId: data.sourceRouteId,
      });
      toast.success(t('package.wizard.lineAdded', 'Satır eklendi'));
      setLineDialogOpen(false);
      setBarcodeInput('');
      setSelectedStock(null);
      form.reset({
        packingHeaderId,
        packageId: selectedPackageId || packages[0]?.id || 0,
        barcode: '',
        stockCode: '',
        yapKod: '',
        quantity: 0,
        serialNo: '',
        serialNo2: '',
        serialNo3: '',
        serialNo4: '',
        sourceRouteId: undefined,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.wizard.lineError', 'Satır eklenirken bir hata oluştu')
      );
    }
  };

  const handleDelete = async (lineId: number): Promise<void> => {
    try {
      await deleteMutation.mutateAsync(lineId);
      toast.success(t('package.wizard.lineDeleted', 'Satır silindi'));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.wizard.lineDeleteError', 'Satır silinirken bir hata oluştu')
      );
    }
  };

  const getPackageBarcode = (packageId: number): string => {
    const pkg = packages.find((p) => p.id === packageId);
    return pkg?.barcode || '-';
  };

  return (
    <div className="space-y-6 crm-page">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('package.wizard.step3.title', '3. Paket Satırları')}</CardTitle>
              <CardDescription>
                {t('package.wizard.step3.description', 'Paketlere satırlar ekleyiniz (Opsiyonel)')}
              </CardDescription>
            </div>
            <Button onClick={handleOpenDialog} disabled={packages.length === 0}>
              <Plus className="size-4 mr-2" />
              {t('package.wizard.step3.addLine', 'Yeni Satır Ekle')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {t('package.wizard.step3.noPackagesMessage', 'Önce paket eklemelisiniz')}
              </p>
            </div>
          ) : isLoadingLines ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('common.loading', 'Yükleniyor...')}</p>
            </div>
          ) : lines.length > 0 ? (
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
                  <TableHead>{t('package.detail.actions', 'İşlemler')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{getPackageBarcode(line.packageId)}</TableCell>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(line.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {t('package.wizard.step3.noLines', 'Henüz satır eklenmedi')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={lineDialogOpen} onOpenChange={setLineDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('package.wizard.step3.addLine', 'Yeni Satır Ekle')}</DialogTitle>
            <DialogDescription>
              {t('package.wizard.step3.addLineDescription', 'Yeni bir satır ekleyin')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-4">
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
                      placeholder={t('package.wizard.step3.barcodePlaceholder', 'Barkod okutun veya yazın')}
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10 md:pl-9 h-10"
                    />
                  </div>
                  <Button type="button" onClick={handleBarcodeSearch} disabled={isSearching} size="default">
                    {isSearching ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      t('common.search', 'Ara')
                    )}
                  </Button>
                </div>

                {selectedStock && (
                  <div className="border rounded-lg p-3 space-y-2 bg-muted/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="mb-1 text-xs">
                          {selectedStock.stokKodu}
                        </Badge>
                        <p className="text-sm font-medium line-clamp-1">{selectedStock.stokAdi}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        <Package className="size-3 mr-1" />
                        {selectedStock.olcuAdi}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="packageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('package.form.package', 'Paket')} <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          value={field.value?.toString() || ''}
                          onValueChange={(value) => {
                            const packageId = parseInt(value, 10);
                            field.onChange(packageId);
                            setSelectedPackageId(packageId);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('package.form.selectPackage', 'Paket Seçin')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {packages.map((pkg) => (
                              <SelectItem key={pkg.id} value={pkg.id.toString()}>
                                {pkg.barcode || pkg.packageNo} ({pkg.packageType})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('package.form.barcode', 'Barkod')}</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name="stockCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('package.form.stockCode', 'Stok Kodu')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yapKod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.yapKod', 'Yap Kodu')}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('package.form.quantity', 'Miktar')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceRouteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.sourceRouteId', 'Kaynak Rota ID')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.serialNo', 'Seri No')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNo2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.serialNo2', 'Seri No 2')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNo3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.serialNo3', 'Seri No 3')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNo4"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.serialNo4', 'Seri No 4')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLineDialogOpen(false);
                    form.reset();
                    setBarcodeInput('');
                    setSelectedStock(null);
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? t('common.saving') : t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('package.wizard.step3.scanBarcode', 'Barkod Okut')}</DialogTitle>
            <DialogDescription>
              {t('package.wizard.step3.scanBarcodeDescription', 'Barkodu kameraya hizalayın')}
            </DialogDescription>
          </DialogHeader>
          <div ref={scannerContainerRef} className="w-full">
            <div id="barcode-scanner-line" className="w-full"></div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPrevious}>
          {t('package.wizard.previousStep', 'Önceki Adım')}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSaveAndExit}>
            {t('package.wizard.saveAndExit', 'Kaydet ve Çık')}
          </Button>
          <Button onClick={onNext}>
            {t('package.wizard.nextStep', 'Sonraki Adım')}
          </Button>
        </div>
      </div>
    </div>
  );
}

