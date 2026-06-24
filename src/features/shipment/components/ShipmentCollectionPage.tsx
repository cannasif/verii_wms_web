import { type ReactElement, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { OpsActionButton, OpsFieldShell } from '@/components/shared';
import { OPS_FIELD_CLASS } from '@/components/shared/ops-field-styles';
import { useStokBarcode } from '../hooks/useStokBarcode';
import { useAddBarcode } from '../hooks/useAddBarcode';
import { useCollectedBarcodes } from '../hooks/useCollectedBarcodes';
import { useAssignedShipmentOrderLines } from '../hooks/useAssignedShipmentOrderLines';
import { useCompleteShipment } from '../hooks/useCompleteShipment';
import { Barcode, Package, ArrowLeft, Loader2, CheckCircle2, List, Camera, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { barcodeApi } from '@/features/shared/api/barcode-api';
import type { BarcodeMatchCandidate } from '@/features/shared/api/barcode-types';
import { BarcodeCandidatePicker } from '@/features/shared/collection/BarcodeCandidatePicker';
import { extractBarcodeFeedback } from '@/features/shared/collection/barcode-feedback';
import { useCrudPermission } from '@/features/access-control/hooks/useCrudPermission';
import { isTransferChainBlocked, TransferChainReadinessCard } from '@/features/transfer-chain';
import { useTransferChainReadinessQuery } from '@/features/transfer-chain/hooks/useTransferChainQueries';
import { ShelfLookupCombobox } from '@/features/shelf-management';
import {
  createDefaultScannerConfig,
  getPreferredCameraId,
  loadHtml5Qrcode,
  stopAndClearScanner,
  type Html5QrcodeInstance,
} from '@/lib/html5-qrcode';

import type { StokBarcodeDto } from '../types/shipment';

export function ShipmentCollectionPage(): ReactElement {
  const { headerId } = useParams<{ headerId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['shipment', 'common', 'transfer-chain']);
  const { setPageTitle } = useUIStore();
  const permission = useCrudPermission('wms.shipment');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [enableSearch, setEnableSearch] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StokBarcodeDto | null>(null);
  const [ambiguousCandidates, setAmbiguousCandidates] = useState<BarcodeMatchCandidate[]>([]);
  const [barcodeErrorMessage, setBarcodeErrorMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [sourceCellCode, setSourceCellCode] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const qrCodeScannerRef = useRef<Html5QrcodeInstance | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const collectedSectionRef = useRef<HTMLDivElement>(null);

  const headerIdNum = headerId ? parseInt(headerId, 10) : 0;

  const { data: orderLinesData, isLoading: isLoadingOrderLines } = useAssignedShipmentOrderLines(headerIdNum);
  const readinessQuery = useTransferChainReadinessQuery('SH', headerIdNum);
  const { data: collectedData } = useCollectedBarcodes(headerIdNum);
  const { data: barcodeData, isLoading: isSearching, error: barcodeError, isError: isBarcodeError } = useStokBarcode(searchBarcode, enableSearch);
  const barcodeDefinitionQuery = useQuery({
    queryKey: ['barcode-definition', 'shipping-assigned'],
    queryFn: ({ signal }) => barcodeApi.getDefinition('shipping-assigned', { signal }),
  });

  const addBarcodeMutation = useAddBarcode();
  const completeShipmentMutation = useCompleteShipment();
  const isChainBlocked = isTransferChainBlocked(readinessQuery.data);

  useEffect(() => {
    setPageTitle(t('shipment.collection.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  useEffect(() => {
    if (!isBarcodeError) {
      return;
    }

    const feedback = extractBarcodeFeedback(barcodeError, t('shipment.collection.stockNotFound'));
    setBarcodeErrorMessage(feedback.message);
    if (feedback.candidates.length > 0) {
      setAmbiguousCandidates(feedback.candidates);
    } else {
      toast.error(feedback.message);
    }
    setEnableSearch(false);
  }, [barcodeError, isBarcodeError, t]);

  useEffect(() => {
    if (barcodeData?.success && barcodeData.data && barcodeData.data.length > 0) {
      setSelectedStock(barcodeData.data[0]);
      setSourceCellCode(barcodeData.data[0]?.rafKodu ?? '');
      setAmbiguousCandidates([]);
      setBarcodeErrorMessage(null);
      setEnableSearch(false);
    } else if (barcodeData && !barcodeData.success) {
      toast.error(t('shipment.collection.stockNotFound'));
      setEnableSearch(false);
    }
  }, [barcodeData, t]);

  const handleBarcodeSearch = useCallback(() => {
    if (!permission.canUpdate) {
      toast.error(t('common.noPermission'));
      return;
    }

    if (isChainBlocked) {
      toast.error(readinessQuery.data?.blockedReason || t('transfer-chain:readiness.defaultBlockedReason'));
      return;
    }

    if (!barcodeInput.trim()) {
      toast.error(t('shipment.collection.enterBarcode'));
      return;
    }
    setSearchBarcode(barcodeInput);
    setSelectedStock(null);
    setAmbiguousCandidates([]);
    setBarcodeErrorMessage(null);
    setEnableSearch(true);
  }, [barcodeInput, isChainBlocked, permission.canUpdate, readinessQuery.data?.blockedReason, t]);

  const handleCollect = (): void => {
    if (!permission.canUpdate) {
      toast.error(t('common.noPermission'));
      return;
    }

    if (isChainBlocked) {
      toast.error(readinessQuery.data?.blockedReason || t('transfer-chain:readiness.defaultBlockedReason'));
      return;
    }

    if (!selectedStock) {
      toast.error(t('shipment.collection.noStockSelected'));
      return;
    }

    if (quantity <= 0) {
      toast.error(t('shipment.collection.invalidQuantity'));
      return;
    }

    const stockExistsInOrder = orderLinesData?.data?.lines.some(
      (line) =>
        line.stockCode === selectedStock.stokKodu &&
        (line.yapKod || '') === (selectedStock.yapKod || '')
    );

    if (!stockExistsInOrder) {
      toast.error(t('shipment.collection.stockNotInOrder'));
      return;
    }

    addBarcodeMutation.mutate(
      {
        headerId: headerIdNum,
        barcode: selectedStock.barkod,
        stockCode: selectedStock.stokKodu,
        stockName: selectedStock.stokAdi,
        yapKod: selectedStock.yapKod ?? undefined,
        yapAcik: selectedStock.yapAcik ?? undefined,
        quantity: quantity,
        serialNo: '',
        serialNo2: '',
        serialNo3: '',
        serialNo4: '',
        sourceCellCode,
        targetCellCode: '',
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            toast.success(t('shipment.collection.collected'));
            setBarcodeInput('');
            setSelectedStock(null);
            setSourceCellCode('');
            setQuantity(1);
          } else {
            toast.error(response.message || t('shipment.collection.collectError'));
          }
        },
        onError: (error: Error) => {
          const feedback = extractBarcodeFeedback(error, t('shipment.collection.collectError'));
          toast.error(feedback.message);
        },
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleBarcodeSearch();
    }
  };

  const handleComplete = (): void => {
    if (!permission.canUpdate) {
      toast.error(t('common.noPermission'));
      return;
    }

    if (!headerIdNum) {
      toast.error(t('shipment.collection.invalidHeaderId'));
      return;
    }

    completeShipmentMutation.mutate(headerIdNum, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(t('shipment.collection.completed'));
          navigate('/shipment/assigned');
        } else {
          toast.error(response.message || t('shipment.collection.completeError'));
        }
      },
      onError: (error: Error) => {
        toast.error(error.message || t('shipment.collection.completeError'));
      },
    });
  };

  const handleOpenCamera = (): void => {
    if (!permission.canUpdate) {
      return;
    }
    setIsCameraOpen(true);
  };

  const handleCloseCamera = (): void => {
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
        toast.error(t('shipment.collection.cameraError'));
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
            toast.success(t('shipment.collection.barcodeScanned'));
            setTimeout(() => {
              handleBarcodeSearch();
            }, 100);
          },
          () => {
            // Error callback - ignore
          }
        );
      } catch (err) {
        toast.error(t('shipment.collection.cameraError'));
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

  const totalCollectedCount = useMemo(() => {
    if (!collectedData?.data) return 0;
    return collectedData.data.reduce((total, item) => total + item.routes.length, 0);
  }, [collectedData?.data]);

  const totalCollectedQuantity = useMemo(() => {
    if (!collectedData?.data) return 0;
    return collectedData.data.reduce(
      (total, item) => total + item.routes.reduce((routeTotal, route) => routeTotal + route.quantity, 0),
      0
    );
  }, [collectedData?.data]);

  const orderLinesWithCollected = useMemo(() => {
    if (!orderLinesData?.data?.lines) return [];

    const collectedMap: Record<number, number> = {};

    if (collectedData?.data) {
      collectedData.data.forEach((item) => {
        const lineId = item.importLine.lineId;
        const totalCollected = item.routes.reduce((sum, route) => sum + route.quantity, 0);

        if (collectedMap[lineId]) {
          collectedMap[lineId] += totalCollected;
        } else {
          collectedMap[lineId] = totalCollected;
        }
      });
    }

    return orderLinesData.data.lines.map((line) => ({
      ...line,
      collectedQuantity: collectedMap[line.id] || 0,
      remainingQuantity: line.quantity - (collectedMap[line.id] || 0),
    }));
  }, [orderLinesData?.data?.lines, collectedData?.data]);

  return (
    <div className="wms-ops-form wms-ops-collection wms-ops-shipment-collection h-[calc(100vh-10rem)] min-h-[32rem]">
      <div className="wms-ops-collection__toolbar">
        <div className="wms-ops-collection__toolbar-group">
          <OpsActionButton type="button" variant="secondary" onClick={() => navigate('/shipment/assigned')}>
            <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
            {t('common.back')}
          </OpsActionButton>
          <span className="wms-ops-collection__header-id">#{headerIdNum}</span>
        </div>
        <OpsActionButton
          type="button"
          variant="secondary"
          onClick={() => navigate(`/shipment/collected/${headerId}`)}
        >
          <List className="size-3.5 shrink-0" aria-hidden />
          {t('shipment.collection.viewCollected')} ({totalCollectedCount})
        </OpsActionButton>
      </div>

      <div className="wms-ops-collection__scan">
        <div className="wms-ops-collection__scan-row">
          <OpsFieldShell
            className="wms-ops-collection__barcode-field"
            title={!barcodeInput.trim() ? t('shipment.collection.barcodePlaceholder') : undefined}
          >
            <Barcode className="wms-ops-collection__barcode-icon" aria-hidden />
            <button
              type="button"
              className="wms-ops-collection__camera-btn"
              disabled={!permission.canUpdate || isChainBlocked}
              onClick={handleOpenCamera}
              aria-label={t('shipment.collection.scanBarcode')}
            >
              <Camera className="size-3.5" aria-hidden />
            </button>
            <Input
              placeholder={t('shipment.collection.barcodePlaceholder')}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!permission.canUpdate || isChainBlocked}
              className={cn(OPS_FIELD_CLASS, 'wms-ops-collection__barcode-input')}
            />
          </OpsFieldShell>
          <div className="wms-ops-collection__scan-actions">
            <OpsActionButton
              type="button"
              variant="primary"
              onClick={handleBarcodeSearch}
              disabled={!permission.canUpdate || isSearching || isChainBlocked}
            >
              {isSearching ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
              {t('common.search')}
            </OpsActionButton>
          </div>
        </div>

        {barcodeDefinitionQuery.data?.data?.hintText ? (
          <p className="wms-ops-collection__hint">
            {t('common.barcodeFormat', { format: barcodeDefinitionQuery.data.data.hintText })}
          </p>
        ) : null}

        {ambiguousCandidates.length > 0 ? (
          <div className="mt-3">
            <BarcodeCandidatePicker
              candidates={ambiguousCandidates}
              message={barcodeErrorMessage || t('common.warning')}
              onSelect={(candidate) => {
                setSelectedStock({
                  barkod: barcodeInput.trim() || searchBarcode.trim(),
                  stokKodu: candidate.stockCode ?? '',
                  stokAdi: candidate.stockName ?? '',
                  depoKodu: null,
                  depoAdi: null,
                  rafKodu: null,
                  yapilandir: '',
                  olcuBr: 0,
                  olcuAdi: '',
                  yapKod: candidate.yapKod ?? null,
                  yapAcik: candidate.yapAcik ?? null,
                  cevrim: 0,
                  seriBarkodMu: Boolean(candidate.serialNumber),
                  sktVarmi: null,
                  isemriNo: null,
                });
                setSourceCellCode('');
                setAmbiguousCandidates([]);
                setBarcodeErrorMessage(null);
              }}
            />
          </div>
        ) : null}

        {selectedStock ? (
          <div className="wms-ops-collection__panel">
            <div className="wms-ops-collection__stock-head">
              <div className="min-w-0 flex-1">
                <span className="wms-ops-collection__stock-code">{selectedStock.stokKodu}</span>
                <p className="wms-ops-collection__stock-name">{selectedStock.stokAdi}</p>
                {(selectedStock.yapKod || selectedStock.yapAcik) ? (
                  <p className="wms-ops-collection__stock-meta">
                    {selectedStock.yapKod || '-'}
                    {selectedStock.yapAcik ? ` · ${selectedStock.yapAcik}` : ''}
                  </p>
                ) : null}
              </div>
              <span className="wms-ops-collection__unit-badge">
                <Package className="size-3" aria-hidden />
                {selectedStock.olcuAdi}
              </span>
            </div>
            <div className="wms-ops-collection__collect-row">
              <div className="min-w-0">
                <span className="wms-ops-collection__field-label">{t('warehouse.details.sourceCellCode')}</span>
                <ShelfLookupCombobox
                  warehouseCode={selectedStock.depoKodu}
                  value={sourceCellCode}
                  onValueChange={setSourceCellCode}
                  disabled={!permission.canUpdate || isChainBlocked}
                  placeholder={t('warehouse.details.sourceCellCodePlaceholder')}
                  searchPlaceholder={t('productionTransfer.create.cellSearch')}
                  emptyText={t('productionTransfer.create.sourceCellEmpty')}
                />
              </div>
              <div>
                <span className="wms-ops-collection__field-label">{t('shipment.collection.quantity')}</span>
                <OpsFieldShell>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    disabled={!permission.canUpdate || isChainBlocked}
                    className={cn(OPS_FIELD_CLASS, 'h-10')}
                  />
                </OpsFieldShell>
              </div>
              <OpsActionButton
                type="button"
                variant="primary"
                onClick={handleCollect}
                disabled={!permission.canUpdate || addBarcodeMutation.isPending || isChainBlocked}
              >
                {addBarcodeMutation.isPending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
                {t('shipment.collection.collect')}
              </OpsActionButton>
            </div>
          </div>
        ) : null}
      </div>

      <div className="wms-ops-collection__body custom-scrollbar">
        {collectedData?.data && collectedData.data.length > 0 ? (
          <div ref={collectedSectionRef} className="mb-4">
            <div className="wms-ops-collection__collected-banner">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-3.5" aria-hidden />
                {t('shipment.collection.viewCollected')} ({totalCollectedCount})
              </span>
              <span className="wms-ops-collection__collected-total">
                {t('shipment.collection.total')}: {totalCollectedQuantity}
              </span>
            </div>
            {collectedData.data.map((item) => (
              <div key={item.importLine.id} className="wms-ops-collection__collected-card">
                <div className="wms-ops-collection__stock-head">
                  <div className="min-w-0">
                    <span className="wms-ops-collection__stock-code">{item.importLine.stockCode}</span>
                    <p className="wms-ops-collection__stock-name">
                      {item.importLine.stockName || item.importLine.description || item.importLine.stockCode}
                    </p>
                    {item.importLine.yapKod ? (
                      <p className="wms-ops-collection__stock-meta">
                        {t('shipment.collection.yapKod')}: {item.importLine.yapKod}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="outline" className="wms-ops-status-badge shrink-0">
                    {item.routes.reduce((sum, route) => sum + route.quantity, 0)}
                  </Badge>
                </div>
                {item.routes.map((route) => (
                  <div key={route.id} className="wms-ops-collection__route-item">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="wms-ops-collection__route-barcode">{route.scannedBarcode || '-'}</span>
                      <span className="wms-ops-collection__unit-badge">
                        {t('shipment.collection.quantity')}: {route.quantity}
                      </span>
                    </div>
                    {(route.serialNo || route.sourceCellCode) ? (
                      <div className="wms-ops-collection__route-meta">
                        {route.serialNo ? <span>{t('shipment.collection.serialNo')}: {route.serialNo}</span> : null}
                        {route.sourceCellCode ? (
                          <span>{t('warehouse.details.sourceCellCode')}: {route.sourceCellCode}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : null}

        <div className="wms-ops-collection__section-title">
          <span>{t('shipment.collection.title')}</span>
          {orderLinesWithCollected.length > 0 ? (
            <span>{orderLinesWithCollected.length} {t('shipment.collection.itemsCollected')}</span>
          ) : null}
        </div>

        {isLoadingOrderLines ? (
          <div className="wms-ops-collection__loading">
            <Loader2 className="size-7 animate-spin" aria-hidden />
          </div>
        ) : orderLinesWithCollected.length > 0 ? (
          <div className="wms-ops-collection__line-grid">
            {orderLinesWithCollected.map((line) => {
              const progress = line.quantity > 0 ? (line.collectedQuantity / line.quantity) * 100 : 0;
              const isDone = line.remainingQuantity === 0;

              return (
                <div
                  key={line.id}
                  className={cn('wms-ops-collection__line-card', isDone && 'wms-ops-collection__line-card--done')}
                >
                  <div className="wms-ops-collection__line-head">
                    <div className="min-w-0 flex-1">
                      <span className="wms-ops-collection__stock-code">{line.stockCode}</span>
                      <p className="wms-ops-collection__line-name">{line.stockName || line.description}</p>
                      {line.yapKod ? (
                        <p className="wms-ops-collection__stock-meta">
                          {t('shipment.collection.yapKod')}: {line.yapKod}
                          {line.yapAcik ? ` · ${line.yapAcik}` : ''}
                        </p>
                      ) : null}
                    </div>
                    {isDone ? <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-hidden /> : null}
                  </div>

                  <div className="wms-ops-collection__metrics">
                    <div className="wms-ops-collection__metric">
                      <div className="wms-ops-collection__metric-label">{t('shipment.collection.total')}</div>
                      <div className="wms-ops-collection__metric-value">{line.quantity}</div>
                    </div>
                    <div className="wms-ops-collection__metric">
                      <div className="wms-ops-collection__metric-label">{t('shipment.collection.collected')}</div>
                      <div className="wms-ops-collection__metric-value wms-ops-collection__metric-value--ok">
                        {line.collectedQuantity}
                      </div>
                    </div>
                    <div className="wms-ops-collection__metric">
                      <div className="wms-ops-collection__metric-label">{t('shipment.collection.remaining')}</div>
                      <div
                        className={cn(
                          'wms-ops-collection__metric-value',
                          isDone ? 'wms-ops-collection__metric-value--ok' : 'wms-ops-collection__metric-value--warn',
                        )}
                      >
                        {line.remainingQuantity}
                      </div>
                    </div>
                  </div>

                  <div className="wms-ops-collection__progress" aria-hidden>
                    <span style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="wms-ops-collection__empty">{t('shipment.collection.noOrderLines')}</div>
        )}
      </div>

      <div className="wms-ops-shipment-collection__chain">
        <TransferChainReadinessCard sourceType="SH" sourceHeaderId={headerIdNum} compact />
      </div>

      <div className="wms-ops-collection__footer">
        <OpsActionButton
          type="button"
          variant="primary"
          onClick={handleComplete}
          disabled={!permission.canUpdate || isChainBlocked || completeShipmentMutation.isPending}
        >
          {completeShipmentMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Check className="size-3.5" aria-hidden />
          )}
          {t('shipment.collection.complete')}
        </OpsActionButton>
      </div>

      <Dialog
        open={isCameraOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseCamera();
          }
        }}
      >
        <DialogContent className="wms-ops-form wms-ops-detail-dialog max-w-[95vw] gap-0 overflow-hidden border-0 p-0 shadow-none sm:max-w-lg">
          <DialogHeader className="wms-ops-detail-dialog__header border-b px-6 py-4">
            <DialogTitle className="wms-ops-detail-dialog__title">{t('shipment.collection.scanBarcode')}</DialogTitle>
            <DialogDescription className="wms-ops-detail-dialog__description">
              {t('shipment.collection.scanBarcodeDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full" style={{ minHeight: '300px' }}>
            <div
              id="barcode-scanner"
              ref={scannerContainerRef}
              className="w-full"
              style={{ minHeight: '300px' }}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg border-2 border-white" style={{ width: '250px', height: '250px' }}>
                <div className="absolute top-0 left-0 h-6 w-6 rounded-tl-lg border-t-4 border-l-4 border-white" />
                <div className="absolute top-0 right-0 h-6 w-6 rounded-tr-lg border-t-4 border-r-4 border-white" />
                <div className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-white" />
                <div className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-white" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
