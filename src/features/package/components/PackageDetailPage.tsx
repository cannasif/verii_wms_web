import { Suspense, lazy, type ReactElement, type ReactNode, useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { OpsActionButton, OpsFieldShell, OpsFormMessage, OpsFormPageShell, OpsInput, PageActionBar, PageState } from '@/components/shared';
import { OPS_FIELD_CLASS, OPS_SELECT_CONTENT_CLASS } from '@/components/shared/ops-field-styles';
import { cn } from '@/lib/utils';
import { pPackageFormSchema, pLineFormSchema, type PPackageFormData, type PLineFormData, type StokBarcodeDto } from '../types/package';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, ArrowLeft, Edit, Camera, Loader2, Package, Printer } from 'lucide-react';
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

function getOpsStatusBadgeClass(status: string | undefined): string {
  const key = status?.toLowerCase() ?? '';
  if (key === 'packed' || key === 'shipped' || key === 'closed' || key === 'sealed' || key === 'loaded') {
    return 'wms-ops-status-badge--done';
  }
  if (key === 'packing' || key === 'open') {
    return 'wms-ops-status-badge--active';
  }
  if (key === 'cancelled') {
    return 'wms-ops-status-badge--danger';
  }
  return 'wms-ops-status-badge--pending';
}

interface OpsDetailRowProps {
  label: string;
  children: ReactNode;
}

function OpsDetailRow({ label, children }: OpsDetailRowProps): ReactElement {
  return (
    <div className="wms-ops-detail-row">
      <span className="wms-ops-detail-row__label">{label}</span>
      <span className="wms-ops-detail-row__value">{children}</span>
    </div>
  );
}

const preventNumberInputWheel = (event: React.WheelEvent<HTMLInputElement>): void => {
  event.currentTarget.blur();
};

export function PackageDetailPage(): ReactElement {
  const { t } = useTranslation(['package', 'common']);
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
  const [activeTab, setActiveTab] = useState('packages');
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
    <>
      <OpsFormPageShell
        eyebrow={
          <>
            <span>{t('package.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('package.create.breadcrumb.module')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('package.detail.title')}</span>
          </>
        }
        title={
          <span className="wms-ops-detail-dialog__title text-xl">
            {t('package.detail.title')}
            {header ? <span className="wms-ops-detail-dialog__id"> {header.packingNo}</span> : null}
          </span>
        }
        description={header ? t('package.list.detailDescription') : t('package.list.detailDescription')}
        actions={
          header ? (
            <div className="flex flex-wrap items-center gap-2">
              <OpsActionButton type="button" variant="secondary" onClick={() => navigate('/package/list')}>
                <ArrowLeft className="size-3.5" aria-hidden />
                {t('common.back')}
              </OpsActionButton>
              {header.sourceType && header.sourceHeaderId ? (
                <OpsActionButton
                  type="button"
                  variant={header.isMatched ? 'secondary' : 'primary'}
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
                </OpsActionButton>
              ) : null}
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setInitialPrintPackageIds([]);
                  setPrintDialogOpen(true);
                }}
                disabled={!permission.canCreate && !permission.canUpdate}
              >
                <Printer className="size-3.5" aria-hidden />
                {t('package:print.printFromTree')}
              </OpsActionButton>
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => navigate(`/package/edit/${headerId}`)}
                disabled={!permission.canUpdate}
              >
                <Edit className="size-3.5" aria-hidden />
                {t('common.edit')}
              </OpsActionButton>
            </div>
          ) : null
        }
      >
        {isLoadingHeader ? (
          <PageState tone="loading" title={t('common.loading')} compact />
        ) : null}

        {!isLoadingHeader && !header ? (
          <PageState tone="empty" title={t('package.detail.notFound')} compact />
        ) : null}

        {header ? (
          <div className="wms-ops-detail-dialog wms-ops-package-detail-page -mx-4 flex flex-col gap-5 px-4 py-5 sm:-mx-6 sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={cn('wms-ops-status-badge', getOpsStatusBadgeClass(header.status))}>
                {t(`package.status.${header.status.toLowerCase()}`, header.status)}
              </Badge>
              {header.sourceType && header.sourceHeaderId ? (
                <span
                  className={cn(
                    'wms-ops-flag-badge',
                    header.isMatched ? 'wms-ops-flag-badge--on' : 'wms-ops-flag-badge--warn',
                  )}
                >
                  {header.isMatched ? t('package.detail.matchedStatus') : t('package.detail.unmatchedStatus')}
                </span>
              ) : null}
              {header.sourceType ? (
                <span className="wms-ops-code-badge">
                  {t(`package.sourceType.${header.sourceType}`, header.sourceType)}
                  {header.sourceHeaderId ? ` #${header.sourceHeaderId}` : ''}
                </span>
              ) : null}
            </div>

            <div className="grid shrink-0 grid-cols-1 items-stretch gap-3 sm:gap-5 md:grid-cols-3">
              <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
                <h3 className="wms-ops-detail-section-title">{t('package.detail.basicInfo')}</h3>
                <div className="wms-ops-detail-panel--rows flex-1">
                  <OpsDetailRow label={t('package.form.packingNo')}>
                    <span className="wms-ops-transfer-detail__stock-code">{header.packingNo}</span>
                  </OpsDetailRow>
                  <OpsDetailRow label={t('package.detail.status')}>
                    <Badge variant="outline" className={cn('wms-ops-status-badge', getOpsStatusBadgeClass(header.status))}>
                      {t(`package.status.${header.status.toLowerCase()}`, header.status)}
                    </Badge>
                  </OpsDetailRow>
                  <OpsDetailRow label={t('package.detail.packingDate')}>{formatDate(header.packingDate)}</OpsDetailRow>
                  <OpsDetailRow label={t('package.detail.warehouseCode')}>{header.warehouseCode || '-'}</OpsDetailRow>
                  <OpsDetailRow label={t('package.detail.customerCode')}>
                    {header.customerCode || '-'}
                    {header.customerName ? ` (${header.customerName})` : ''}
                  </OpsDetailRow>
                </div>
              </div>

              <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
                <h3 className="wms-ops-detail-section-title">{t('package.detail.summary')}</h3>
                <div className="wms-ops-detail-panel--rows flex-1">
                  <OpsDetailRow label={t('package.detail.totalPackageCount')}>{header.totalPackageCount || 0}</OpsDetailRow>
                  <OpsDetailRow label={t('package.detail.totalQuantity')}>{header.totalQuantity || 0}</OpsDetailRow>
                  <OpsDetailRow label={t('package.detail.totalGrossWeight')}>{header.totalGrossWeight || 0}</OpsDetailRow>
                  <OpsDetailRow label={t('package.detail.totalVolume')}>{header.totalVolume || 0}</OpsDetailRow>
                  <OpsDetailRow label={t('package.list.matchedSource')}>
                    {header.sourceHeaderId ? `#${header.sourceHeaderId}` : '-'}
                  </OpsDetailRow>
                </div>
              </div>

              <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
                <h3 className="wms-ops-detail-section-title">{t('package.detail.shippingInfo')}</h3>
                <div className="wms-ops-detail-panel--rows flex-1">
                  <OpsDetailRow label={t('package.detail.trackingNo')}>{header.trackingNo || '-'}</OpsDetailRow>
                  <OpsDetailRow label={t('package.form.carrierServiceType')}>{header.carrierServiceType || '-'}</OpsDetailRow>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
              <TabsList
                className={cn(
                  'wms-ops-tabs wms-ops-step-tabs grid w-full shrink-0 grid-cols-2 sm:w-auto',
                  activeTab === 'packages' ? 'wms-ops-tabs--order' : 'wms-ops-tabs--stock',
                )}
              >
                <span className="wms-ops-tab-indicator" aria-hidden />
                <TabsTrigger value="packages" className="wms-ops-tab">
                  {t('package.detail.packages')} ({packages?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="lines" className="wms-ops-tab">
                  {t('package.detail.lines')} ({lines?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="packages"
                className="wms-ops-detail-panel wms-ops-detail-lines-panel mt-3 flex min-h-0 flex-col overflow-hidden"
              >
                <PageActionBar
                  className="mb-3 shrink-0 px-1"
                  title={<span className="wms-ops-detail-section-title !border-0 !p-0">{t('package.detail.packages')}</span>}
                  actions={
                    <OpsActionButton
                      type="button"
                      variant="primary"
                      onClick={() => permission.canUpdate && setPackageDialogOpen(true)}
                      disabled={!permission.canUpdate}
                    >
                      <Plus className="size-3.5" aria-hidden />
                      {t('package.detail.addPackage')}
                    </OpsActionButton>
                  }
                />
                {isLoadingPackages ? (
                  <PageState tone="loading" title={t('common.loading')} compact className="wms-ops-detail-empty" />
                ) : packages && packages.length > 0 ? (
                  <>
                    <div className="hidden min-h-0 flex-1 md:block">
                      <div className="wms-ops-transfer-detail__table-wrap h-full rounded-none border-0">
                        <table className="wms-ops-transfer-detail__table">
                          <thead>
                            <tr>
                              <th>{t('package.detail.packageNo')}</th>
                              <th>{t('package.detail.packageType')}</th>
                              <th>{t('package.detail.status')}</th>
                              <th>{t('package.detail.netWeight')}</th>
                              <th>{t('package.detail.grossWeight')}</th>
                              <th>{t('package.detail.volume')}</th>
                              <th>{t('package.detail.isMixed')}</th>
                              <th className="wms-ops-table-actions-col">{t('package.detail.actions')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {packages.map((pkg: PPackageDto) => (
                              <tr key={pkg.id}>
                                <td>
                                  <button
                                    type="button"
                                    className="wms-ops-transfer-detail__stock-code cursor-pointer border-0 bg-transparent p-0 text-left underline-offset-2 hover:underline"
                                    onClick={() => navigate(`/package/package-detail/${pkg.id}`)}
                                  >
                                    {pkg.packageNo}
                                  </button>
                                </td>
                                <td><span className="wms-ops-code-badge">{pkg.packageType}</span></td>
                                <td>
                                  <Badge variant="outline" className={cn('wms-ops-status-badge', getOpsStatusBadgeClass(pkg.status))}>
                                    {t(`package.packageStatus.${pkg.status.toLowerCase()}`, pkg.status)}
                                  </Badge>
                                </td>
                                <td>{pkg.netWeight ?? '-'}</td>
                                <td>{pkg.grossWeight ?? '-'}</td>
                                <td>{pkg.volume ?? '-'}</td>
                                <td>{pkg.isMixed ? t('common.yes') : t('common.no')}</td>
                                <td className="wms-ops-table-actions-col">
                                  <div className="flex items-center justify-end gap-2">
                                    <OpsActionButton
                                      type="button"
                                      variant="secondary"
                                      className="h-8 px-2"
                                      onClick={() => navigate(`/package/package-detail/${pkg.id}`)}
                                    >
                                      <Eye className="size-3.5" aria-hidden />
                                    </OpsActionButton>
                                    <OpsActionButton
                                      type="button"
                                      variant="secondary"
                                      className="h-8 px-2"
                                      onClick={() => {
                                        setInitialPrintPackageIds([pkg.id]);
                                        setPrintDialogOpen(true);
                                      }}
                                      disabled={!permission.canCreate && !permission.canUpdate}
                                    >
                                      <Printer className="size-3.5" aria-hidden />
                                    </OpsActionButton>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="space-y-3 pb-1 md:hidden">
                      {packages.map((pkg: PPackageDto) => (
                        <div key={pkg.id} className="wms-ops-detail-panel">
                          <div className="wms-ops-detail-panel--rows p-4">
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                className="wms-ops-transfer-detail__stock-code border-0 bg-transparent p-0 text-left"
                                onClick={() => navigate(`/package/package-detail/${pkg.id}`)}
                              >
                                {pkg.packageNo}
                              </button>
                              <Badge variant="outline" className={cn('wms-ops-status-badge shrink-0', getOpsStatusBadgeClass(pkg.status))}>
                                {t(`package.packageStatus.${pkg.status.toLowerCase()}`, pkg.status)}
                              </Badge>
                            </div>
                            <OpsDetailRow label={t('package.detail.packageType')}>
                              <span className="wms-ops-code-badge">{pkg.packageType}</span>
                            </OpsDetailRow>
                            <OpsDetailRow label={t('package.detail.netWeight')}>{pkg.netWeight ?? '-'}</OpsDetailRow>
                            <OpsDetailRow label={t('package.detail.grossWeight')}>{pkg.grossWeight ?? '-'}</OpsDetailRow>
                            <div className="flex gap-2 pt-2">
                              <OpsActionButton type="button" variant="secondary" className="flex-1" onClick={() => navigate(`/package/package-detail/${pkg.id}`)}>
                                <Eye className="size-3.5" aria-hidden />
                                {t('package.detail.viewDetails')}
                              </OpsActionButton>
                              <OpsActionButton
                                type="button"
                                variant="secondary"
                                className="flex-1"
                                onClick={() => {
                                  setInitialPrintPackageIds([pkg.id]);
                                  setPrintDialogOpen(true);
                                }}
                                disabled={!permission.canCreate && !permission.canUpdate}
                              >
                                <Printer className="size-3.5" aria-hidden />
                                {t('package.detail.printLabel')}
                              </OpsActionButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <PageState tone="empty" title={t('package.detail.noPackages')} compact className="wms-ops-detail-empty" />
                )}
              </TabsContent>

              <TabsContent
                value="lines"
                className="wms-ops-detail-panel wms-ops-detail-lines-panel mt-3 flex min-h-0 flex-col overflow-hidden"
              >
                <PageActionBar
                  className="mb-3 shrink-0 px-1"
                  title={<span className="wms-ops-detail-section-title !border-0 !p-0">{t('package.detail.lines')}</span>}
                  actions={
                    <OpsActionButton
                      type="button"
                      variant="primary"
                      onClick={() => permission.canUpdate && setLineDialogOpen(true)}
                      disabled={!permission.canUpdate}
                    >
                      <Plus className="size-3.5" aria-hidden />
                      {t('package.detail.addLine')}
                    </OpsActionButton>
                  }
                />
                {isLoadingLines ? (
                  <PageState tone="loading" title={t('common.loading')} compact className="wms-ops-detail-empty" />
                ) : lines && lines.length > 0 ? (
                  <>
                    <div className="hidden min-h-0 flex-1 md:block">
                      <div className="wms-ops-transfer-detail__table-wrap h-full rounded-none border-0">
                        <table className="wms-ops-transfer-detail__table">
                          <thead>
                            <tr>
                              <th>{t('package.detail.barcode')}</th>
                              <th>{t('package.detail.stockCode')}</th>
                              <th>{t('package.detail.stockName')}</th>
                              <th>{t('package.detail.yapKod')}</th>
                              <th>{t('package.detail.yapAcik')}</th>
                              <th>{t('package.detail.quantity')}</th>
                              <th>{t('package.detail.serialNo')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lines.map((line: PLineDto) => (
                              <tr key={line.id}>
                                <td>{line.barcode || '-'}</td>
                                <td><span className="wms-ops-transfer-detail__stock-code">{line.stockCode}</span></td>
                                <td><span className="wms-ops-transfer-detail__stock-name">{line.stockName || '-'}</span></td>
                                <td>{line.yapKod}</td>
                                <td>{line.yapAcik || '-'}</td>
                                <td className="wms-ops-transfer-detail__col--qty">{line.quantity}</td>
                                <td>{line.serialNo || line.serialNo2 || line.serialNo3 || line.serialNo4 || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="space-y-3 pb-1 md:hidden">
                      {lines.map((line: PLineDto) => (
                        <div key={line.id} className="wms-ops-detail-panel">
                          <div className="wms-ops-detail-panel--rows p-4">
                            <OpsDetailRow label={t('package.detail.stockCode')}>
                              <span className="wms-ops-transfer-detail__stock-code">{line.stockCode}</span>
                            </OpsDetailRow>
                            <OpsDetailRow label={t('package.detail.stockName')}>{line.stockName || '-'}</OpsDetailRow>
                            <OpsDetailRow label={t('package.detail.barcode')}>{line.barcode || '-'}</OpsDetailRow>
                            <OpsDetailRow label={t('package.detail.quantity')}>{line.quantity}</OpsDetailRow>
                            {(line.serialNo || line.serialNo2 || line.serialNo3 || line.serialNo4) ? (
                              <OpsDetailRow label={t('package.detail.serialNo')}>
                                {line.serialNo || line.serialNo2 || line.serialNo3 || line.serialNo4}
                              </OpsDetailRow>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <PageState tone="empty" title={t('package.detail.noLines')} compact className="wms-ops-detail-empty" />
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </OpsFormPageShell>

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
        <DialogContent
          className={cn(
            'max-h-[90vh] max-w-2xl overflow-y-auto',
            'wms-ops-form wms-ops-detail-dialog gap-0 overflow-hidden border-0 p-0 shadow-none sm:max-w-2xl',
          )}
        >
          <DialogHeader className="wms-ops-detail-dialog__header border-b px-6 py-4">
            <DialogTitle className="wms-ops-detail-dialog__title">{t('package.detail.addPackage')}</DialogTitle>
            <DialogDescription className="wms-ops-detail-dialog__description">
              {t('package.detail.addPackageDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...packageForm}>
            <form onSubmit={packageForm.handleSubmit(handlePackageSubmit)} className="px-6 py-5">
              <fieldset disabled={!permission.canUpdate} className={!permission.canUpdate ? 'pointer-events-none opacity-75' : undefined}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={packageForm.control}
                  name="packageNo"
                  render={({ field }) => (
                    <FormItem className="wms-ops-form-item md:col-span-2">
                      <FormLabel>
                        {t('package.form.packageNo')} <span className="wms-ops-required">*</span>
                      </FormLabel>
                      <FormControl>
                        <OpsInput
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value);
                            packageForm.setValue('barcode', value);
                          }}
                        />
                      </FormControl>
                      <OpsFormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={packageForm.control}
                  name="packageType"
                  render={({ field }) => (
                    <FormItem className="wms-ops-form-item">
                      <FormLabel>{t('package.form.packageType')}</FormLabel>
                      <OpsFieldShell>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                            <SelectItem value="Box">{t('package.packageType.box')}</SelectItem>
                            <SelectItem value="Pallet">{t('package.packageType.pallet')}</SelectItem>
                            <SelectItem value="Bag">{t('package.packageType.bag')}</SelectItem>
                            <SelectItem value="Custom">{t('package.packageType.custom')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </OpsFieldShell>
                      <OpsFormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={packageForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="wms-ops-form-item">
                      <FormLabel>{t('package.form.status')}</FormLabel>
                      <OpsFieldShell>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                            <SelectItem value="Draft">{t('package.packageStatus.draft')}</SelectItem>
                            <SelectItem value="Open">{t('package.packageStatus.open')}</SelectItem>
                            <SelectItem value="Packing">{t('package.packageStatus.packing')}</SelectItem>
                            <SelectItem value="Packed">{t('package.packageStatus.packed')}</SelectItem>
                            <SelectItem value="Closed">{t('package.packageStatus.closed')}</SelectItem>
                            <SelectItem value="Released">{t('package.packageStatus.released')}</SelectItem>
                            <SelectItem value="Staged">{t('package.packageStatus.staged')}</SelectItem>
                            <SelectItem value="Transferred">{t('package.packageStatus.transferred')}</SelectItem>
                            <SelectItem value="Shipped">{t('package.packageStatus.shipped')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </OpsFieldShell>
                      <OpsFormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={packageForm.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem className="wms-ops-form-item">
                      <FormLabel>{t('package.form.length')}</FormLabel>
                      <FormControl>
                        <OpsInput
                          type="number"
                          step="0.01"
                          min={0}
                          onWheel={preventNumberInputWheel}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <OpsFormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={packageForm.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem className="wms-ops-form-item">
                      <FormLabel>{t('package.form.width')}</FormLabel>
                      <FormControl>
                        <OpsInput
                          type="number"
                          step="0.01"
                          min={0}
                          onWheel={preventNumberInputWheel}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <OpsFormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={packageForm.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem className="wms-ops-form-item">
                      <FormLabel>{t('package.form.height')}</FormLabel>
                      <FormControl>
                        <OpsInput
                          type="number"
                          step="0.01"
                          min={0}
                          onWheel={preventNumberInputWheel}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <OpsFormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={packageForm.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem className="wms-ops-form-item">
                      <FormLabel>{t('package.form.volume')}</FormLabel>
                      <FormControl>
                        <OpsInput
                          type="number"
                          step="0.01"
                          min={0}
                          onWheel={preventNumberInputWheel}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <OpsFormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={packageForm.control}
                  name="netWeight"
                  render={({ field }) => (
                    <FormItem className="wms-ops-form-item">
                      <FormLabel>{t('package.form.netWeight')}</FormLabel>
                      <FormControl>
                        <OpsInput
                          type="number"
                          step="0.01"
                          min={0}
                          onWheel={preventNumberInputWheel}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <OpsFormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={packageForm.control}
                  name="tareWeight"
                  render={({ field }) => (
                    <FormItem className="wms-ops-form-item">
                      <FormLabel>{t('package.form.tareWeight')}</FormLabel>
                      <FormControl>
                        <OpsInput
                          type="number"
                          step="0.01"
                          min={0}
                          onWheel={preventNumberInputWheel}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <OpsFormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={packageForm.control}
                  name="grossWeight"
                  render={({ field }) => (
                    <FormItem className="wms-ops-form-item">
                      <FormLabel>{t('package.form.grossWeight')}</FormLabel>
                      <FormControl>
                        <OpsInput
                          type="number"
                          step="0.01"
                          min={0}
                          onWheel={preventNumberInputWheel}
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <OpsFormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="wms-ops-actions mt-6 border-t px-0 py-4">
                <OpsActionButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setPackageDialogOpen(false);
                    packageForm.reset();
                  }}
                >
                  {t('common.cancel')}
                </OpsActionButton>
                <OpsActionButton type="submit" variant="primary" disabled={!permission.canUpdate || createPackageMutation.isPending}>
                  {createPackageMutation.isPending ? t('common.saving') : t('common.save')}
                </OpsActionButton>
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
        <DialogContent
          className={cn(
            'max-h-[90vh] max-w-2xl overflow-y-auto',
            'wms-ops-form wms-ops-detail-dialog gap-0 overflow-hidden border-0 p-0 shadow-none sm:max-w-2xl',
          )}
        >
          <DialogHeader className="wms-ops-detail-dialog__header border-b px-6 py-4">
            <DialogTitle className="wms-ops-detail-dialog__title">{t('package.detail.addLine')}</DialogTitle>
            <DialogDescription className="wms-ops-detail-dialog__description">
              {t('package.detail.addLineDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...lineForm}>
            <div className="space-y-4 px-6 py-5">
              <FormField
                control={lineForm.control}
                name="packageId"
                render={({ field }) => (
                  <FormItem className="wms-ops-form-item">
                    <FormLabel>
                      {t('package.form.package')} <span className="wms-ops-required">*</span>
                    </FormLabel>
                    <OpsFieldShell>
                      <Select
                        value={field.value ? field.value.toString() : ''}
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        disabled={!permission.canUpdate}
                      >
                        <FormControl>
                          <SelectTrigger className={cn('w-full', OPS_FIELD_CLASS)}>
                            <SelectValue placeholder={t('package.form.selectPackage')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className={OPS_SELECT_CONTENT_CLASS}>
                          {packages?.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id.toString()}>
                              {pkg.barcode || pkg.packageNo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </OpsFieldShell>
                    <OpsFormMessage />
                  </FormItem>
                )}
              />

              <div className="wms-ops-detail-panel">
                <div className="wms-ops-station__scan p-4">
                  <div className="wms-ops-station__scan-grid">
                    <label className="wms-ops-station__scan-label wms-ops-station__scan-label--barcode md:col-span-2">
                      {t('package.detail.barcode')}
                    </label>
                    <OpsFieldShell className="md:col-span-2">
                      <div className="flex gap-2">
                        <OpsInput
                          placeholder={t('package.detail.barcodePlaceholder')}
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleBarcodeSearch();
                            }
                          }}
                          disabled={!permission.canUpdate}
                          className="flex-1"
                        />
                        <OpsActionButton type="button" variant="secondary" className="shrink-0 px-3" onClick={handleOpenCamera} disabled={!permission.canUpdate}>
                          <Camera className="size-4" aria-hidden />
                        </OpsActionButton>
                        <OpsActionButton type="button" variant="primary" className="shrink-0" onClick={handleBarcodeSearch} disabled={!permission.canUpdate || isSearching}>
                          {isSearching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : t('common.search')}
                        </OpsActionButton>
                      </div>
                    </OpsFieldShell>
                  </div>

                  {selectedStock ? (
                    <div className="mt-4 space-y-3 border-t border-[color-mix(in_oklab,var(--wms-ops-accent)_16%,var(--wms-ops-card-border))] pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="wms-ops-code-badge">{selectedStock.stokKodu}</span>
                          <p className="mt-2 text-sm font-medium">{selectedStock.stokAdi}</p>
                          {selectedStock.yapKod ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t('package.form.yapKod')}: {selectedStock.yapKod}
                              {selectedStock.yapAcik ? ` · ${selectedStock.yapAcik}` : ''}
                            </p>
                          ) : null}
                        </div>
                        <span className="wms-ops-flag-badge wms-ops-flag-badge--on shrink-0">
                          <Package className="mr-1 inline size-3" aria-hidden />
                          {selectedStock.olcuAdi}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="wms-ops-form-item">
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t('package.detail.quantity')} <span className="wms-ops-required">*</span>
                          </label>
                          <OpsInput
                            type="number"
                            min={1}
                            onWheel={preventNumberInputWheel}
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                            disabled={!permission.canUpdate}
                          />
                        </div>
                        <div className="wms-ops-form-item">
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t('package.form.serialNo')}
                          </label>
                          <OpsInput
                            value={serialNo}
                            onChange={(e) => setSerialNo(e.target.value)}
                            disabled={!permission.canUpdate}
                          />
                        </div>
                      </div>
                      <OpsActionButton
                        type="button"
                        variant="primary"
                        className="w-full"
                        onClick={handleLineSubmit}
                        disabled={!permission.canUpdate || createLineMutation.isPending}
                      >
                        {createLineMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                        {t('package.detail.add')}
                      </OpsActionButton>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCameraOpen} onOpenChange={(open) => { if (!open) handleCloseCamera(); }}>
        <DialogContent className="wms-ops-form wms-ops-detail-dialog max-w-[95vw] gap-0 overflow-hidden border-0 p-0 shadow-none sm:max-w-lg">
          <DialogHeader className="wms-ops-detail-dialog__header border-b px-6 py-4">
            <DialogTitle className="wms-ops-detail-dialog__title">{t('package.detail.scanBarcode')}</DialogTitle>
            <DialogDescription className="wms-ops-detail-dialog__description">
              {t('package.detail.scanBarcodeDescription')}
            </DialogDescription>
          </DialogHeader>
          <div ref={scannerContainerRef} className="w-full p-4" style={{ minHeight: '300px' }}>
            <div id="barcode-scanner" className="w-full" style={{ minHeight: '280px' }} />
          </div>
          <DialogFooter className="wms-ops-actions border-t px-6 py-4">
            <OpsActionButton type="button" variant="secondary" onClick={handleCloseCamera}>
              {t('common.cancel')}
            </OpsActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
