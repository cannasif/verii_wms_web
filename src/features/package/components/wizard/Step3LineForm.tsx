import { type ReactElement, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePPackagesByHeader } from '../../hooks/usePPackagesByHeader';
import { usePLinesByHeader } from '../../hooks/usePLinesByHeader';
import { useCreatePLine } from '../../hooks/useCreatePLine';
import { useDeletePLine } from '../../hooks/useDeletePLine';
import { useYapKodlar } from '../../hooks/useYapKodlar';
import { useStokBarcode } from '../../hooks/useStokBarcode';
import { pLineFormSchema, type PLineFormData, type StokBarcodeDto } from '../../types/package';
import { PageActionBar, PageState } from '@/components/shared';
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
import {
  createDefaultScannerConfig,
  getPreferredCameraId,
  loadHtml5Qrcode,
  stopAndClearScanner,
  type Html5QrcodeInstance,
} from '@/lib/html5-qrcode';

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
  const qrCodeScannerRef = useRef<Html5QrcodeInstance | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const { data: packagesData } = usePPackagesByHeader(packingHeaderId);
  const { data: linesData, isLoading: isLoadingLines } = usePLinesByHeader(packingHeaderId);
  const { data: yapKodlar = [] } = useYapKodlar();
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
      stockId: undefined,
      yapKodId: undefined,
      yapAcik: '',
      quantity: 0,
      serialNo: '',
      serialNo2: '',
      serialNo3: '',
      serialNo4: '',
      sourceRouteId: undefined,
    },
  });

  const yapKodByCode = useMemo(
    () => new Map(yapKodlar.map((item) => [item.yapKod.toLowerCase(), item])),
    [yapKodlar],
  );

  const selectedYapKodId = form.watch('yapKodId');
  const selectedYapKod = useMemo(
    () => yapKodlar.find((item) => item.id === selectedYapKodId),
    [selectedYapKodId, yapKodlar],
  );

  useEffect(() => {
    if (barcodeData?.success && barcodeData.data && barcodeData.data.length > 0) {
      const stock = barcodeData.data[0];
      const matchedYapKod = stock.yapKod ? yapKodByCode.get(stock.yapKod.toLowerCase()) : undefined;
      setSelectedStock(stock);
      form.setValue('barcode', stock.barkod);
      form.setValue('stockCode', stock.stokKodu);
      form.setValue('yapKodId', matchedYapKod?.id);
      form.setValue('yapAcik', matchedYapKod?.yapAcik || stock.yapAcik || '');
      form.setValue('quantity', stock.cevrim || 1);
      setEnableSearch(false);
    } else if (barcodeData && !barcodeData.success) {
      toast.error(t('package.wizard.step3.stockNotFound'));
      setEnableSearch(false);
    }
  }, [barcodeData, form, t, yapKodByCode]);

  const handleBarcodeSearch = useCallback(() => {
    if (!barcodeInput.trim()) {
      toast.error(t('package.wizard.step3.enterBarcode'));
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
      toast.error(t('package.wizard.step3.noPackages'));
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
    void stopAndClearScanner(qrCodeScannerRef.current);
    qrCodeScannerRef.current = null;
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
        toast.error(t('package.wizard.step3.cameraError'));
        setIsCameraOpen(false);
        return;
      }

      const scannerId = 'barcode-scanner-line';
      const html5QrcodeModule = await loadHtml5Qrcode();
      const { Html5Qrcode } = html5QrcodeModule;
      const config = createDefaultScannerConfig(html5QrcodeModule);

      const html5QrCode = new Html5Qrcode(scannerId);
      qrCodeScannerRef.current = html5QrCode;

      try {
        const cameraId = await getPreferredCameraId(Html5Qrcode);

        await html5QrCode.start(
          cameraId,
          config,
          (decodedText) => {
            setBarcodeInput(decodedText);
            handleCloseCamera();
            toast.success(t('package.wizard.step3.barcodeScanned'));
            setTimeout(() => {
              handleBarcodeSearch();
            }, 100);
          },
          () => {
          }
        );
      } catch (err) {
        toast.error(t('package.wizard.step3.cameraError'));
        console.error('Camera error:', err);
        handleCloseCamera();
      }
    };

    const timeoutId = setTimeout(() => {
      initCamera();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      void stopAndClearScanner(qrCodeScannerRef.current);
      qrCodeScannerRef.current = null;
    };
  }, [isCameraOpen, t, handleBarcodeSearch]);

  const handleSubmit = async (data: PLineFormData): Promise<void> => {
    try {
      await createMutation.mutateAsync({
        packingHeaderId: data.packingHeaderId,
        packageId: data.packageId,
        barcode: data.barcode || undefined,
        stockCode: data.stockCode,
        stockId: data.stockId,
        yapKodId: data.yapKodId,
        quantity: data.quantity,
        serialNo: data.serialNo || undefined,
        serialNo2: data.serialNo2 || undefined,
        serialNo3: data.serialNo3 || undefined,
        serialNo4: data.serialNo4 || undefined,
        sourceRouteId: data.sourceRouteId,
      });
      toast.success(t('package.wizard.lineAdded'));
      setLineDialogOpen(false);
      setBarcodeInput('');
      setSelectedStock(null);
      form.reset({
        packingHeaderId,
        packageId: selectedPackageId || packages[0]?.id || 0,
        barcode: '',
        stockCode: '',
        stockId: undefined,
        yapKodId: undefined,
        yapAcik: '',
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
          : t('package.wizard.lineError')
      );
    }
  };

  const handleDelete = async (lineId: number): Promise<void> => {
    try {
      await deleteMutation.mutateAsync(lineId);
      toast.success(t('package.wizard.lineDeleted'));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.wizard.lineDeleteError')
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
          <PageActionBar
            title={<CardTitle>{t('package.wizard.step3.title')}</CardTitle>}
            description={<CardDescription>{t('package.wizard.step3.description')}</CardDescription>}
            actions={
              <Button onClick={handleOpenDialog} disabled={packages.length === 0}>
                <Plus className="size-4 mr-2" />
                {t('package.wizard.step3.addLine')}
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <PageState tone="empty" title={t('package.wizard.step3.noPackagesMessage')} compact />
          ) : isLoadingLines ? (
            <PageState tone="loading" title={t('common.loading')} compact />
          ) : lines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('package.detail.barcode')}</TableHead>
                  <TableHead>{t('package.detail.stockCode')}</TableHead>
                  <TableHead>{t('package.detail.stockName')}</TableHead>
                  <TableHead>{t('package.detail.yapKod')}</TableHead>
                  <TableHead>{t('package.detail.yapAcik')}</TableHead>
                  <TableHead>{t('package.detail.quantity')}</TableHead>
                  <TableHead>{t('package.detail.serialNo')}</TableHead>
                  <TableHead>{t('package.detail.actions')}</TableHead>
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
            <PageState tone="empty" title={t('package.wizard.step3.noLines')} compact />
          )}
        </CardContent>
      </Card>

      <Dialog open={lineDialogOpen} onOpenChange={setLineDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('package.wizard.step3.addLine')}</DialogTitle>
            <DialogDescription>
              {t('package.wizard.step3.addLineDescription')}
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
                      placeholder={t('package.wizard.step3.barcodePlaceholder')}
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
                      t('common.search')
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
                          {t('package.form.package')} <span className="text-destructive">*</span>
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
                              <SelectValue placeholder={t('package.form.selectPackage')} />
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
                        <FormLabel>{t('package.form.barcode')}</FormLabel>
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
                        {t('package.form.stockCode')} <span className="text-destructive">*</span>
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
                  name="yapKodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.yapKod')}</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(value) => {
                          const selected = yapKodlar.find((item) => item.id === Number(value));
                          field.onChange(value ? Number(value) : undefined);
                          form.setValue('yapAcik', selected?.yapAcik || '');
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('package.form.yapKod')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {yapKodlar.map((item) => (
                            <SelectItem key={item.id} value={String(item.id)}>
                              {item.yapKod} - {item.yapAcik}
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
                  name="yapAcik"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('package.form.yapAcik')}</FormLabel>
                      <FormControl>
                        <Input {...field} value={selectedYapKod?.yapAcik || field.value || ''} readOnly />
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
                        {t('package.form.quantity')} <span className="text-destructive">*</span>
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
                      <FormLabel>{t('package.form.sourceRouteId')}</FormLabel>
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
                      <FormLabel>{t('package.form.serialNo')}</FormLabel>
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
                      <FormLabel>{t('package.form.serialNo2')}</FormLabel>
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
                      <FormLabel>{t('package.form.serialNo3')}</FormLabel>
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
                      <FormLabel>{t('package.form.serialNo4')}</FormLabel>
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
            <DialogTitle>{t('package.wizard.step3.scanBarcode')}</DialogTitle>
            <DialogDescription>
              {t('package.wizard.step3.scanBarcodeDescription')}
            </DialogDescription>
          </DialogHeader>
          <div ref={scannerContainerRef} className="w-full">
            <div id="barcode-scanner-line" className="w-full"></div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPrevious}>
          {t('package.wizard.previousStep')}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSaveAndExit}>
            {t('package.wizard.saveAndExit')}
          </Button>
          <Button onClick={onNext}>
            {t('package.wizard.nextStep')}
          </Button>
        </div>
      </div>
    </div>
  );
}
