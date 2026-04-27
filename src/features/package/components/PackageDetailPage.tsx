import { Suspense, lazy, type ReactElement, useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { useYapKodlar } from '../hooks/useYapKodlar';
import { useStokBarcode } from '../hooks/useStokBarcode';
import { DetailPageShell, PageState } from '@/components/shared';
import { pPackageFormSchema, pLineFormSchema, type PPackageFormData, type PLineFormData, type StokBarcodeDto } from '../types/package';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Eye, ArrowLeft, Edit, Barcode, Camera, Loader2, Package, Printer } from 'lucide-react';
import { toast } from 'sonner';
import {
  createDefaultScannerConfig,
  getPreferredCameraId,
  loadHtml5Qrcode,
  stopAndClearScanner,
  type Html5QrcodeInstance,
} from '@/lib/html5-qrcode';
import type { PPackageDto, PLineDto } from '../types/package';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { useRouteScreenReady } from '@/routes/RouteRuntimeBoundary';
const PackageLabelPrintDialog = lazy(async () => {
  const module = await import('./PackageLabelPrintDialog');
  return { default: module.PackageLabelPrintDialog };
});

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'Draft':
      return 'bg-slate-100 text-slate-800';
    case 'Packing':
      return 'bg-blue-100 text-blue-800';
    case 'Open':
      return 'bg-yellow-100 text-yellow-800';
    case 'Packed':
      return 'bg-emerald-100 text-emerald-800';
    case 'Sealed':
      return 'bg-cyan-100 text-cyan-800';
    case 'Loaded':
      return 'bg-blue-100 text-blue-800';
    case 'Transferred':
      return 'bg-amber-100 text-amber-800';
    case 'Shipped':
      return 'bg-violet-100 text-violet-800';
    case 'Cancelled':
      return 'bg-rose-100 text-rose-800';
    case 'Closed':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function PackageDetailPage(): ReactElement {
  const { t } = useTranslation();
  const { reportScreenReady } = useRouteScreenReady();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.package');
  
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
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [initialPrintPackageIds, setInitialPrintPackageIds] = useState<number[]>([]);
  const screenReadyReportedRef = useRef(false);
  const qrCodeScannerRef = useRef<Html5QrcodeInstance | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const { data: header, isLoading: isLoadingHeader } = usePHeader(headerId);
  const { data: packages, isLoading: isLoadingPackages } = usePPackagesByHeader(headerId);
  const { data: lines, isLoading: isLoadingLines } = usePLinesByHeader(headerId);
  const createPackageMutation = useCreatePPackage();
  const createLineMutation = useCreatePLine();
  const matchPlinesMutation = useMatchPlines();
  const { data: yapKodlar = [] } = useYapKodlar();
  const { data: barcodeData, isLoading: isSearching } = useStokBarcode(searchBarcode, enableSearch);

  useEffect(() => {
    if (screenReadyReportedRef.current || isLoadingHeader || isLoadingPackages || isLoadingLines) {
      return;
    }

    screenReadyReportedRef.current = true;
    reportScreenReady('initial-screen');
  }, [isLoadingHeader, isLoadingLines, isLoadingPackages, reportScreenReady]);

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

  useEffect(() => {
    if (headerId) {
      packageForm.setValue('packingHeaderId', headerId);
      lineForm.setValue('packingHeaderId', headerId);
    }
  }, [headerId, packageForm, lineForm]);

  useEffect(() => {
    if (header) {
      setPageTitle(t('package.detail.title') + ' - ' + header.packingNo);
    } else {
      setPageTitle(t('package.detail.title'));
    }
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle, header]);

  const yapKodByCode = useMemo(
    () => new Map(yapKodlar.map((item) => [item.yapKod.toLowerCase(), item])),
    [yapKodlar],
  );

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
      toast.success(t('package.detail.packageAddSuccess'));
      setPackageDialogOpen(false);
      packageForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('package.detail.packageAddError')
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
      toast.error(t('package.detail.stockNotFound'));
      setEnableSearch(false);
    }
  }, [barcodeData, t]);

  const handleBarcodeSearch = useCallback(() => {
    if (!barcodeInput.trim()) {
      toast.error(t('package.detail.enterBarcode'));
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
    void stopAndClearScanner(qrCodeScannerRef.current);
    qrCodeScannerRef.current = null;
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
        toast.error(t('package.detail.cameraError'));
        setIsCameraOpen(false);
        return;
      }

      const scannerId = 'barcode-scanner';
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
            toast.success(t('package.detail.barcodeScanned'));
            setTimeout(() => {
              handleBarcodeSearch();
            }, 100);
          },
          () => {
          }
        );
      } catch (err) {
        toast.error(t('package.detail.cameraError'));
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

  const handleLineSubmit = async (): Promise<void> => {
    if (!selectedStock) {
      toast.error(t('package.detail.noStockSelected'));
      return;
    }

    if (quantity <= 0) {
      toast.error(t('package.detail.invalidQuantity'));
      return;
    }

    try {
      const matchedYapKod = selectedStock.yapKod ? yapKodByCode.get(selectedStock.yapKod.toLowerCase()) : undefined;
      await createLineMutation.mutateAsync({
        packingHeaderId: headerId || 0,
        packageId: lineForm.getValues('packageId'),
        barcode: selectedStock.barkod,
        stockCode: selectedStock.stokKodu,
        yapKodId: matchedYapKod?.id,
        quantity: quantity,
        serialNo: serialNo || undefined,
        serialNo2: '',
        serialNo3: '',
        serialNo4: '',
        sourceRouteId: undefined,
      });
      toast.success(t('package.detail.lineAddSuccess'));
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
          : t('package.detail.lineAddError')
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

  return (
    <div className="space-y-6 crm-page">
      <DetailPageShell
        title={t('package.detail.title')}
        description={!isLoadingHeader && header ? header.packingNo : undefined}
        isLoading={isLoadingHeader}
        isEmpty={!isLoadingHeader && !header}
        loadingTitle={t('common.loading')}
        emptyTitle={t('package.detail.notFound')}
        actions={
          header ? (
            <>
              <Button variant="outline" onClick={() => navigate('/package/list')}>
                <ArrowLeft className="size-4 mr-2" />
                {t('common.back')}
              </Button>
              {header.sourceType && header.sourceHeaderId ? (
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
                          ? t('package.detail.unmatchSuccess')
                          : t('package.detail.matchSuccess')
                      );
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : t('package.detail.matchError')
                      );
                    }
                  }}
                  disabled={!permission.canUpdate || matchPlinesMutation.isPending}
                >
                  {matchPlinesMutation.isPending
                    ? t('common.saving')
                    : header.isMatched
                      ? t('package.detail.unmatch')
                      : t('package.detail.match')}
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={() => {
                  setInitialPrintPackageIds([]);
                  setPrintDialogOpen(true);
                }}
                disabled={!permission.canCreate && !permission.canUpdate}
              >
                <Printer className="size-4 mr-2" />
                Paket Ağacından Yazdır
              </Button>
              <Button variant="outline" onClick={() => navigate(`/package/edit/${headerId}`)} disabled={!permission.canUpdate}>
                <Edit className="size-4 mr-2" />
                {t('common.edit')}
              </Button>
            </>
          ) : undefined
        }
      >
        {header ? (
          <>
          <div className="space-y-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.status')}
                </p>
                <Badge className={getStatusBadgeColor(header.status)}>
                  {t(`package.status.${header.status.toLowerCase()}`, header.status)}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.packingDate')}
                </p>
                <p className="text-sm font-medium">{formatDate(header.packingDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.warehouseCode')}
                </p>
                <p className="text-sm font-medium">{header.warehouseCode || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.customerCode')}
                </p>
                <p className="text-sm font-medium">{header.customerCode || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.trackingNo')}
                </p>
                <p className="text-sm font-medium">{header.trackingNo || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.customerName')}
                </p>
                <p className="text-sm font-medium">{header.customerName || '-'}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t('package.list.sourceType')}
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
                    {t('package.list.matchedSource')}
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
                  {t('package.detail.totalPackageCount')}
                </p>
                <p className="text-lg font-semibold">{header.totalPackageCount || 0}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.totalQuantity')}
                </p>
                <p className="text-lg font-semibold">{header.totalQuantity || 0}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('package.detail.totalGrossWeight')}
                </p>
                <p className="text-lg font-semibold">{header.totalGrossWeight || 0}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="packages" className="w-full">
            <TabsList>
              <TabsTrigger value="packages">
                {t('package.detail.packages')} ({packages?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="lines">
                {t('package.detail.lines')} ({lines?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="packages" className="mt-4">
              <div className="flex justify-end mb-4">
                <Button onClick={() => permission.canUpdate && setPackageDialogOpen(true)} disabled={!permission.canUpdate}>
                  <Plus className="size-4 mr-2" />
                  {t('package.detail.addPackage')}
                </Button>
              </div>
              {isLoadingPackages ? (
                <PageState tone="loading" title={t('common.loading')} compact />
              ) : packages && packages.length > 0 ? (
                <>
                  <div className="hidden md:block rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('package.detail.packageNo')}</TableHead>
                          <TableHead>{t('package.detail.packageType')}</TableHead>
                          <TableHead>{t('package.detail.status')}</TableHead>
                          <TableHead>{t('package.detail.netWeight')}</TableHead>
                          <TableHead>{t('package.detail.grossWeight')}</TableHead>
                          <TableHead>{t('package.detail.volume')}</TableHead>
                          <TableHead>{t('package.detail.isMixed')}</TableHead>
                          <TableHead>{t('package.detail.actions')}</TableHead>
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
                                  <span className="ml-2">{t('package.detail.viewDetails')}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setInitialPrintPackageIds([pkg.id]);
                                    setPrintDialogOpen(true);
                                  }}
                                  disabled={!permission.canCreate && !permission.canUpdate}
                                >
                                  <Printer className="size-4" />
                                  <span className="ml-2">Etiket</span>
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
                                  {t('package.detail.packageNo')}
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
                                  {t('package.detail.packageType')}
                                </p>
                                <p className="text-sm font-medium">{pkg.packageType}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.isMixed')}
                                </p>
                                <p className="text-sm font-medium">{pkg.isMixed ? t('common.yes') : t('common.no')}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.netWeight')}
                                </p>
                                <p className="text-sm font-medium">{pkg.netWeight || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.grossWeight')}
                                </p>
                                <p className="text-sm font-medium">{pkg.grossWeight || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.volume')}
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
                                {t('package.detail.viewDetails')}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <PageState tone="empty" title={t('package.detail.noPackages')} compact />
              )}
            </TabsContent>

            <TabsContent value="lines" className="mt-4">
              <div className="flex justify-end mb-4">
                <Button onClick={() => permission.canUpdate && setLineDialogOpen(true)} disabled={!permission.canUpdate}>
                  <Plus className="size-4 mr-2" />
                  {t('package.detail.addLine')}
                </Button>
              </div>
              {isLoadingLines ? (
                <PageState tone="loading" title={t('common.loading')} compact />
              ) : lines && lines.length > 0 ? (
                <>
                  <div className="hidden md:block rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-white/10 dark:bg-white/3">
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
                                  {t('package.detail.barcode')}
                                </p>
                                <p className="text-sm font-medium">{line.barcode || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.stockCode')}
                                </p>
                                <p className="text-sm font-medium">{line.stockCode}</p>
                              </div>
                            </div>
                            <div className="pt-3 border-t">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                {t('package.detail.stockName')}
                              </p>
                              <p className="text-sm font-medium">{line.stockName || '-'}</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 pt-3 border-t sm:grid-cols-2">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.yapKod')}
                                </p>
                                <p className="text-sm font-medium">{line.yapKod}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.quantity')}
                                </p>
                                <p className="text-sm font-medium">{line.quantity}</p>
                              </div>
                            </div>
                            {line.yapAcik && (
                              <div className="pt-3 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.yapAcik')}
                                </p>
                                <p className="text-sm font-medium">{line.yapAcik}</p>
                              </div>
                            )}
                            {(line.serialNo || line.serialNo2 || line.serialNo3 || line.serialNo4) && (
                              <div className="pt-3 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {t('package.detail.serialNo')}
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
                <PageState tone="empty" title={t('package.detail.noLines')} compact />
              )}
            </TabsContent>
          </Tabs>
          </>
        ) : null}
      </DetailPageShell>

      {headerId ? (
        <Suspense fallback={null}>
          <PackageLabelPrintDialog
            open={printDialogOpen}
            onOpenChange={setPrintDialogOpen}
            packingHeaderId={headerId}
            initialPackageIds={initialPrintPackageIds}
          />
        </Suspense>
      ) : null}

      <Dialog open={permission.canUpdate && packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>{t('package.detail.addPackage')}</DialogTitle>
            <DialogDescription>
              {t('package.detail.addPackageDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...packageForm}>
            <form onSubmit={packageForm.handleSubmit(handlePackageSubmit)} className="space-y-6 crm-page">
              <fieldset disabled={!permission.canUpdate} className={!permission.canUpdate ? 'pointer-events-none opacity-75' : undefined}>
              <div className="space-y-4">
                <FormField
                  control={packageForm.control}
                  name="packageNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('package.form.packageNo')} <span className="text-destructive">*</span>
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
                        <FormLabel>{t('package.form.packageType')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Box">{t('package.packageType.box')}</SelectItem>
                            <SelectItem value="Pallet">{t('package.packageType.pallet')}</SelectItem>
                            <SelectItem value="Bag">{t('package.packageType.bag')}</SelectItem>
                            <SelectItem value="Custom">{t('package.packageType.custom')}</SelectItem>
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
                        <FormLabel>{t('package.form.status')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Open">{t('package.packageStatus.open')}</SelectItem>
                            <SelectItem value="Closed">{t('package.packageStatus.closed')}</SelectItem>
                            <SelectItem value="Loaded">{t('package.packageStatus.loaded')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {t('package.form.dimensions')}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={packageForm.control}
                      name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t('package.form.length')}</FormLabel>
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
                          <FormLabel className="text-xs">{t('package.form.width')}</FormLabel>
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
                          <FormLabel className="text-xs">{t('package.form.height')}</FormLabel>
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
                    {t('package.form.weights')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField
                      control={packageForm.control}
                      name="netWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t('package.form.netWeight')}</FormLabel>
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
                          <FormLabel className="text-xs">{t('package.form.tareWeight')}</FormLabel>
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
                          <FormLabel className="text-xs">{t('package.form.grossWeight')}</FormLabel>
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
                        <FormLabel>{t('package.form.volume')}</FormLabel>
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
                <Button type="submit" disabled={!permission.canUpdate || createPackageMutation.isPending} className="w-full sm:w-auto">
                  {createPackageMutation.isPending ? t('common.saving') : t('common.save')}
                </Button>
              </DialogFooter>
              </fieldset>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={permission.canUpdate && lineDialogOpen} onOpenChange={(open) => {
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
            <DialogTitle>{t('package.detail.addLine')}</DialogTitle>
            <DialogDescription>
              {t('package.detail.addLineDescription')}
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
                      {t('package.form.package')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      value={field.value ? field.value.toString() : ''}
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                      disabled={!permission.canUpdate}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('package.form.selectPackage')} />
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
                      disabled={!permission.canUpdate}
                    >
                      <Camera className="size-4 text-muted-foreground" />
                    </Button>
                    <Input
                      placeholder={t('package.detail.barcodePlaceholder')}
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10 md:pl-9 h-10"
                      disabled={!permission.canUpdate}
                    />
                  </div>
                  <Button onClick={handleBarcodeSearch} disabled={!permission.canUpdate || isSearching} size="default">
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
                          {t('package.detail.quantity')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="h-9"
                          placeholder={t('package.detail.quantity')}
                          disabled={!permission.canUpdate}
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
                          disabled={!permission.canUpdate}
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button
                        onClick={handleLineSubmit}
                        disabled={!permission.canUpdate || createLineMutation.isPending}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 w-full"
                      >
                        {createLineMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin mr-1" />
                        ) : null}
                        {t('package.detail.add')}
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
                    <DialogTitle>{t('package.detail.scanBarcode')}</DialogTitle>
                    <DialogDescription>
                      {t('package.detail.scanBarcodeDescription')}
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
