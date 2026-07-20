import { Suspense, lazy, type ReactElement, type ReactNode, useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { useYapKodlar } from '../hooks/useYapKodlar';
import { useStokBarcode } from '../hooks/useStokBarcode';
import { DeleteConfirmDialog, OpsActionButton, OpsFieldShell, OpsFormPageShell, OpsInput, PageActionBar, PageState } from '@/components/shared';
import { cn } from '@/lib/utils';
import { pLineFormSchema, type PLineFormData, type StokBarcodeDto } from '../types/package';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Plus, ArrowLeft, Camera, Loader2, Package, Printer } from 'lucide-react';
import { toast } from 'sonner';
import {
  createDefaultScannerConfig,
  getPreferredCameraId,
  loadHtml5Qrcode,
  stopAndClearScanner,
  type Html5QrcodeInstance,
} from '@/lib/html5-qrcode';
import type { PLineDto } from '../types/package';
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

export function PackagePackageDetailPage(): ReactElement {
  const { t } = useTranslation(['package', 'common']);
  const { reportScreenReady } = useRouteScreenReady();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.package');
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
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const screenReadyReportedRef = useRef(false);
  const qrCodeScannerRef = useRef<Html5QrcodeInstance | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const { data: packageData, isLoading: isLoadingPackage } = usePPackage(packageId);
  const { data: lines, isLoading: isLoadingLines } = usePLinesByPackage(packageId);
  const deleteMutation = useDeletePPackage();
  const createLineMutation = useCreatePLine();
  const deleteLineMutation = useDeletePLine();
  const { data: yapKodlar = [] } = useYapKodlar();
  const { data: barcodeData, isLoading: isSearching } = useStokBarcode(searchBarcode, enableSearch);

  useEffect(() => {
    if (screenReadyReportedRef.current || isLoadingPackage || isLoadingLines) {
      return;
    }

    screenReadyReportedRef.current = true;
    reportScreenReady('initial-screen');
  }, [isLoadingLines, isLoadingPackage, reportScreenReady]);

  const lineSchema = useMemo(() => pLineFormSchema(t), [t]);

  const lineForm = useForm<PLineFormData>({
    resolver: zodResolver(lineSchema),
    defaultValues: {
      packingHeaderId: packageData?.packingHeaderId || 0,
      packageId: packageId || 0,
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

  const yapKodByCode = useMemo(
    () => new Map(yapKodlar.map((item) => [item.yapKod.toLowerCase(), item])),
    [yapKodlar],
  );

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
    void stopAndClearScanner(qrCodeScannerRef.current);
    qrCodeScannerRef.current = null;
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
      void stopAndClearScanner(qrCodeScannerRef.current);
      qrCodeScannerRef.current = null;
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
      const matchedYapKod = selectedStock.yapKod ? yapKodByCode.get(selectedStock.yapKod.toLowerCase()) : undefined;
      await createLineMutation.mutateAsync({
        packingHeaderId: packageData.packingHeaderId,
        packageId: packageData.id,
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

  return (
    <>
      <OpsFormPageShell
        eyebrow={
          <>
            <span>{t('package.create.breadcrumb.parent')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('package.create.breadcrumb.module')}</span>
            <span className="mx-2 opacity-60">/</span>
            <span>{t('package.packageDetail.title')}</span>
          </>
        }
        title={
          <span className="wms-ops-detail-dialog__title text-xl">
            {t('package.packageDetail.title')}
            {!isLoadingPackage && packageData ? (
              <span className="wms-ops-detail-dialog__id"> {packageData.packageNo}</span>
            ) : null}
          </span>
        }
        actions={
          packageData ? (
            <div className="flex flex-wrap items-center gap-2">
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => navigate(`/package/detail/${packageData.packingHeaderId}`)}
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                {t('package.packageDetail.backToHeader')}
              </OpsActionButton>
              <OpsActionButton
                type="button"
                variant="secondary"
                onClick={() => setPrintDialogOpen(true)}
                disabled={!permission.canCreate && !permission.canUpdate}
              >
                <Printer className="size-3.5" aria-hidden />
                {t('package:print.printLabel')}
              </OpsActionButton>
              <Button
                variant="destructive"
                className="wms-ops-surface-danger-btn"
                onClick={() => permission.canDelete && setDeleteDialogOpen(true)}
                disabled={!permission.canDelete}
              >
                <Trash2 className="size-3.5" aria-hidden />
                {t('common.delete')}
              </Button>
            </div>
          ) : undefined
        }
      >
        {isLoadingPackage ? (
          <PageState tone="loading" title={t('common.loading')} compact />
        ) : null}

        {!isLoadingPackage && !packageData ? (
          <PageState tone="empty" title={t('package.packageDetail.notFound')} compact />
        ) : null}

        {packageData ? (
          <div className="wms-ops-detail-dialog wms-ops-package-detail-page -mx-4 flex flex-col gap-5 px-4 py-5 sm:-mx-6 sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={cn('wms-ops-status-badge', getOpsStatusBadgeClass(packageData.status))}>
                {t(`package.packageStatus.${packageData.status.toLowerCase()}`, packageData.status)}
              </Badge>
              <span className="wms-ops-code-badge">{packageData.packageType}</span>
            </div>

            <div className="grid shrink-0 grid-cols-1 items-stretch gap-3 sm:gap-5 md:grid-cols-3">
              <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
                <h3 className="wms-ops-detail-section-title">{t('package.detail.basicInfo')}</h3>
                <div className="wms-ops-detail-panel--rows flex-1">
                  <OpsDetailRow label={t('package.packageDetail.status')}>
                    <Badge variant="outline" className={cn('wms-ops-status-badge', getOpsStatusBadgeClass(packageData.status))}>
                      {t(`package.packageStatus.${packageData.status.toLowerCase()}`, packageData.status)}
                    </Badge>
                  </OpsDetailRow>
                  <OpsDetailRow label={t('package.packageDetail.packageType')}>
                    <span className="wms-ops-code-badge">{packageData.packageType}</span>
                  </OpsDetailRow>
                  <OpsDetailRow label={t('package.packageDetail.barcode')}>{packageData.barcode || '-'}</OpsDetailRow>
                  <OpsDetailRow label={t('package.packageDetail.isMixed')}>
                    {packageData.isMixed ? t('common.yes') : t('common.no')}
                  </OpsDetailRow>
                </div>
              </div>

              <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
                <h3 className="wms-ops-detail-section-title">{t('package.packageDetail.dimensions')}</h3>
                <div className="wms-ops-detail-panel--rows flex-1">
                  <OpsDetailRow label={t('package.packageDetail.length')}>{packageData.length || '-'}</OpsDetailRow>
                  <OpsDetailRow label={t('package.packageDetail.width')}>{packageData.width || '-'}</OpsDetailRow>
                  <OpsDetailRow label={t('package.packageDetail.height')}>{packageData.height || '-'}</OpsDetailRow>
                </div>
              </div>

              <div className="wms-ops-detail-panel flex h-full min-w-0 flex-col overflow-hidden">
                <h3 className="wms-ops-detail-section-title">{t('package.detail.summary')}</h3>
                <div className="wms-ops-detail-panel--rows flex-1">
                  <OpsDetailRow label={t('package.packageDetail.volume')}>{packageData.volume || '-'}</OpsDetailRow>
                  <OpsDetailRow label={t('package.packageDetail.netWeight')}>{packageData.netWeight || '-'}</OpsDetailRow>
                  <OpsDetailRow label={t('package.packageDetail.grossWeight')}>{packageData.grossWeight || '-'}</OpsDetailRow>
                </div>
              </div>
            </div>

            <div className="wms-ops-detail-panel wms-ops-detail-lines-panel flex min-h-0 flex-col overflow-hidden">
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
                    {t('package.packageDetail.addLine')}
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
                            <th>{t('package.packageDetail.barcode')}</th>
                            <th>{t('package.packageDetail.stockCode')}</th>
                            <th>{t('package.packageDetail.stockName')}</th>
                            <th>{t('package.packageDetail.yapKod')}</th>
                            <th>{t('package.packageDetail.yapAcik')}</th>
                            <th>{t('package.packageDetail.quantity')}</th>
                            <th>{t('package.packageDetail.serialNo')}</th>
                            <th className="wms-ops-table-actions-col">{t('package.packageDetail.actions')}</th>
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
                              <td className="wms-ops-table-actions-col">
                                <div className="flex items-center justify-end gap-2">
                                  <OpsActionButton
                                    type="button"
                                    variant="secondary"
                                    className="h-8 px-2 text-destructive"
                                    onClick={() => handleDeleteLine(line.id)}
                                    disabled={deleteLineMutation.isPending}
                                  >
                                    <Trash2 className="size-3.5" aria-hidden />
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
                    {lines.map((line: PLineDto) => (
                      <div key={line.id} className="wms-ops-detail-panel">
                        <div className="wms-ops-detail-panel--rows p-4">
                          <OpsDetailRow label={t('package.packageDetail.stockCode')}>
                            <span className="wms-ops-transfer-detail__stock-code">{line.stockCode}</span>
                          </OpsDetailRow>
                          <OpsDetailRow label={t('package.packageDetail.stockName')}>{line.stockName || '-'}</OpsDetailRow>
                          <OpsDetailRow label={t('package.packageDetail.barcode')}>{line.barcode || '-'}</OpsDetailRow>
                          <OpsDetailRow label={t('package.packageDetail.yapKod')}>{line.yapKod}</OpsDetailRow>
                          {line.yapAcik ? (
                            <OpsDetailRow label={t('package.packageDetail.yapAcik')}>{line.yapAcik}</OpsDetailRow>
                          ) : null}
                          <OpsDetailRow label={t('package.packageDetail.quantity')}>{line.quantity}</OpsDetailRow>
                          {(line.serialNo || line.serialNo2 || line.serialNo3 || line.serialNo4) ? (
                            <OpsDetailRow label={t('package.packageDetail.serialNo')}>
                              {line.serialNo || line.serialNo2 || line.serialNo3 || line.serialNo4}
                            </OpsDetailRow>
                          ) : null}
                          <div className="pt-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="wms-ops-surface-danger-btn w-full"
                              onClick={() => handleDeleteLine(line.id)}
                              disabled={!permission.canDelete || deleteLineMutation.isPending}
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                              {t('common.delete')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <PageState tone="empty" title={t('package.packageDetail.noLines')} compact className="wms-ops-detail-empty" />
              )}
            </div>
          </div>
        ) : null}
      </OpsFormPageShell>

      {packageData ? (
        <Suspense fallback={null}>
          <PackageLabelPrintDialog
            open={printDialogOpen}
            onOpenChange={setPrintDialogOpen}
            packingHeaderId={packageData.packingHeaderId}
            initialPackageIds={[packageData.id]}
            title={`${packageData.packageNo} etiketi`}
            description={t('package:print.singlePackageDescription')}
          />
        </Suspense>
      ) : null}

      <DeleteConfirmDialog
        open={permission.canDelete && deleteDialogOpen}
        title={t('package.packageDetail.deleteConfirm')}
        description={t('package.packageDetail.deleteConfirmMessage')}
        isPending={deleteMutation.isPending}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => void handleDelete()}
      />

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
            'max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto sm:w-full',
            'wms-ops-form wms-ops-detail-dialog gap-0 overflow-hidden border-0 p-0 shadow-none sm:max-w-2xl',
          )}
        >
          <DialogHeader className="wms-ops-detail-dialog__header border-b px-6 py-4">
            <DialogTitle className="wms-ops-detail-dialog__title">{t('package.packageDetail.addLine')}</DialogTitle>
            <DialogDescription className="wms-ops-detail-dialog__description">
              {t('package.packageDetail.addLineDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="wms-ops-detail-panel">
              <div className="wms-ops-station__scan p-4">
                <div className="wms-ops-station__scan-grid">
                  <label className="wms-ops-station__scan-label wms-ops-station__scan-label--barcode md:col-span-2">
                    {t('package.packageDetail.barcode')}
                  </label>
                  <OpsFieldShell className="md:col-span-2">
                    <div className="flex gap-2">
                      <OpsInput
                        placeholder={t('package.packageDetail.barcodePlaceholder')}
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={!permission.canUpdate}
                        className="flex-1"
                      />
                      <OpsActionButton
                        type="button"
                        variant="secondary"
                        className="shrink-0 px-3"
                        onClick={handleOpenCamera}
                        disabled={!permission.canUpdate}
                      >
                        <Camera className="size-4" aria-hidden />
                      </OpsActionButton>
                      <OpsActionButton
                        type="button"
                        variant="primary"
                        className="shrink-0"
                        onClick={handleBarcodeSearch}
                        disabled={!permission.canUpdate || isSearching}
                      >
                        {isSearching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : t('common.search')}
                      </OpsActionButton>
                    </div>
                  </OpsFieldShell>
                </div>

                {selectedStock && (
                  <div className="mt-4 space-y-3 border-t border-[color-mix(in_oklab,var(--wms-ops-accent)_16%,var(--wms-ops-card-border))] pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="wms-ops-code-badge">{selectedStock.stokKodu}</span>
                        <p className="mt-2 text-sm font-medium">{selectedStock.stokAdi}</p>
                        {selectedStock.yapKod && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('package.form.yapKod')}: {selectedStock.yapKod}
                            {selectedStock.yapAcik ? ` · ${selectedStock.yapAcik}` : ''}
                          </p>
                        )}
                      </div>
                      <span className="wms-ops-flag-badge wms-ops-flag-badge--on shrink-0">
                        <Package className="mr-1 inline size-3" aria-hidden />
                        {selectedStock.olcuAdi}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="wms-ops-form-item">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t('package.packageDetail.quantity')} <span className="wms-ops-required">*</span>
                        </label>
                        <OpsInput
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          placeholder={t('package.packageDetail.quantity')}
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
                          placeholder={t('package.form.serialNo')}
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
                      {createLineMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : null}
                      {t('package.packageDetail.add')}
                    </OpsActionButton>
                  </div>
                )}
              </div>
            </div>

            {isCameraOpen && (
              <Dialog open={isCameraOpen} onOpenChange={handleCloseCamera}>
                <DialogContent className="wms-ops-form wms-ops-detail-dialog max-w-[95vw] gap-0 overflow-hidden border-0 p-0 shadow-none sm:max-w-md">
                  <DialogHeader className="wms-ops-detail-dialog__header border-b px-6 py-4">
                    <DialogTitle className="wms-ops-detail-dialog__title">{t('package.packageDetail.scanBarcode')}</DialogTitle>
                    <DialogDescription className="wms-ops-detail-dialog__description">
                      {t('package.packageDetail.scanBarcodeDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div ref={scannerContainerRef} className="w-full p-4">
                    <div id="barcode-scanner-package" className="w-full" />
                  </div>
                  <DialogFooter className="wms-ops-actions border-t px-6 py-4">
                    <OpsActionButton type="button" variant="secondary" onClick={handleCloseCamera}>
                      {t('common.cancel')}
                    </OpsActionButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
