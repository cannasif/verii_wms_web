import { type ReactElement, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useSrtStokBarcode } from '../hooks/useSrtStokBarcode';
import { useAddSrtBarcode } from '../hooks/useAddSrtBarcode';
import { useSrtCollectedBarcodes } from '../hooks/useSrtCollectedBarcodes';
import { useAssignedSrtOrderLines } from '../hooks/useAssignedSrtOrderLines';
import { useCompleteSrt } from '../hooks/useCompleteSrt';
import { Barcode, Package, ArrowLeft, Loader2, CheckCircle2, List, Camera, Check } from 'lucide-react';
import { toast } from 'sonner';

import { barcodeApi } from '@/services/barcode-api';
import type { BarcodeMatchCandidate } from '@/services/barcode-types';
import { BarcodeCandidatePicker } from '@/features/shared/collection/BarcodeCandidatePicker';
import { extractBarcodeFeedback } from '@/features/shared/collection/barcode-feedback';
import { ShelfLookupCombobox } from '@/features/shelf-management';
import {
  createDefaultScannerConfig,
  getPreferredCameraId,
  loadHtml5Qrcode,
  stopAndClearScanner,
  type Html5QrcodeInstance,
} from '@/lib/html5-qrcode';

import type { StokBarcodeDto } from '../types/subcontracting';

export function SrtCollectionPage(): ReactElement {
  const { headerId } = useParams<{ headerId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [enableSearch, setEnableSearch] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StokBarcodeDto | null>(null);
  const [ambiguousCandidates, setAmbiguousCandidates] = useState<BarcodeMatchCandidate[]>([]);
  const [barcodeErrorMessage, setBarcodeErrorMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [targetCellCode, setTargetCellCode] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const qrCodeScannerRef = useRef<Html5QrcodeInstance | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const headerIdNum = headerId ? parseInt(headerId, 10) : 0;

  const { data: orderLinesData, isLoading: isLoadingOrderLines } = useAssignedSrtOrderLines(headerIdNum);
  const { data: collectedData } = useSrtCollectedBarcodes(headerIdNum);
  const { data: barcodeData, isLoading: isSearching, error: barcodeError, isError: isBarcodeError } = useSrtStokBarcode(searchBarcode, enableSearch);
  const barcodeDefinitionQuery = useQuery({
    queryKey: ['barcode-definition', 'subcontracting-receipt-assigned'],
    queryFn: ({ signal }) => barcodeApi.getDefinition('subcontracting-receipt-assigned', { signal }),
  });

  const addBarcodeMutation = useAddSrtBarcode();
  const completeSrtMutation = useCompleteSrt();

  useEffect(() => {
    setPageTitle(t('subcontracting.srt.collection.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  useEffect(() => {
    if (!isBarcodeError) {
      return;
    }

    const feedback = extractBarcodeFeedback(barcodeError, t('subcontracting.srt.collection.stockNotFound'));
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
      setTargetCellCode(barcodeData.data[0]?.rafKodu ?? '');
      setAmbiguousCandidates([]);
      setBarcodeErrorMessage(null);
      setEnableSearch(false);
    } else if (barcodeData && !barcodeData.success) {
      toast.error(t('subcontracting.srt.collection.stockNotFound'));
      setEnableSearch(false);
    }
  }, [barcodeData, t]);

  const handleBarcodeSearch = useCallback(() => {
    if (!barcodeInput.trim()) {
      toast.error(t('subcontracting.srt.collection.enterBarcode'));
      return;
    }
    setSearchBarcode(barcodeInput);
    setSelectedStock(null);
    setAmbiguousCandidates([]);
    setBarcodeErrorMessage(null);
    setEnableSearch(true);
  }, [barcodeInput, t]);

  const handleCollect = (): void => {
    if (!selectedStock) {
      toast.error(t('subcontracting.srt.collection.noStockSelected'));
      return;
    }

    if (quantity <= 0) {
      toast.error(t('subcontracting.srt.collection.invalidQuantity'));
      return;
    }

    const stockExistsInOrder = orderLinesData?.data?.lines.some(
      (line) =>
        line.stockCode === selectedStock.stokKodu &&
        ((line.yapKod ?? '') === (selectedStock.yapKod ?? ''))
    );

    if (!stockExistsInOrder) {
      toast.error(t('subcontracting.srt.collection.stockNotInOrder'));
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
        sourceCellCode: '',
        targetCellCode,
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            toast.success(t('subcontracting.srt.collection.collected'));
            setBarcodeInput('');
            setSelectedStock(null);
            setTargetCellCode('');
            setQuantity(1);
          } else {
            toast.error(response.message || t('subcontracting.srt.collection.collectError'));
          }
        },
        onError: (error: Error) => {
          const feedback = extractBarcodeFeedback(error, t('subcontracting.srt.collection.collectError'));
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
    if (!headerIdNum) {
      toast.error(t('subcontracting.srt.collection.invalidHeaderId'));
      return;
    }

    completeSrtMutation.mutate(headerIdNum, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(t('subcontracting.srt.collection.completed'));
          navigate('/subcontracting/receipt/assigned');
        } else {
          toast.error(response.message || t('subcontracting.srt.collection.completeError'));
        }
      },
      onError: (error: Error) => {
        toast.error(error.message || t('subcontracting.srt.collection.completeError'));
      },
    });
  };

  const handleOpenCamera = (): void => {
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
        if (scannerContainerRef.current && document.getElementById('barcode-scanner-srt')) {
          resolve();
        } else {
          const checkElement = setInterval(() => {
            if (scannerContainerRef.current && document.getElementById('barcode-scanner-srt')) {
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

      if (!scannerContainerRef.current || !document.getElementById('barcode-scanner-srt')) {
        toast.error(t('subcontracting.srt.collection.cameraError'));
        setIsCameraOpen(false);
        return;
      }

      const scannerId = 'barcode-scanner-srt';
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
            toast.success(t('subcontracting.srt.collection.barcodeScanned'));
            setTimeout(() => {
              handleBarcodeSearch();
            }, 100);
          },
          () => {
            // Error callback - ignore
          }
        );
      } catch (err) {
        toast.error(t('subcontracting.srt.collection.cameraError'));
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
    <div className="crm-page flex w-full flex-col h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="shrink-0 border-b border-slate-200/80 bg-white/80 p-4 space-y-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/subcontracting/receipt/assigned')}>
            <ArrowLeft className="size-4 mr-2" />
            {t('common.back')}
          </Button>
          <Button variant="outline" size="sm">
            <List className="size-4 mr-2" />
            {t('subcontracting.srt.collection.viewCollected')} ({totalCollectedCount})
          </Button>
        </div>

        <Card className='py-0'>
          <CardContent className="p-3 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
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
                  placeholder={t('subcontracting.srt.collection.barcodePlaceholder')}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 md:pl-9 h-10"
                />
                {barcodeDefinitionQuery.data?.data?.hintText ? (
                  <p className='mt-2 text-xs text-slate-500 dark:text-slate-400'>
                    {t('common.barcodeFormat', { format: barcodeDefinitionQuery.data.data.hintText })}
                  </p>
                ) : null}
              </div>
              <Button onClick={handleBarcodeSearch} disabled={isSearching} size="default" className="w-full sm:w-auto">
                {isSearching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  t('common.search')
                )}
              </Button>
            </div>

            {ambiguousCandidates.length > 0 ? (
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
                  setTargetCellCode('');
                  setAmbiguousCandidates([]);
                  setBarcodeErrorMessage(null);
                }}
              />
            ) : null}

            {selectedStock && (
              <div className="border rounded-lg p-3 space-y-2 bg-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="mb-1 text-xs">
                      {selectedStock.stokKodu}
                    </Badge>
                    <p className="text-sm font-medium line-clamp-1">{selectedStock.stokAdi}</p>
                    {(selectedStock.yapKod || selectedStock.yapAcik) ? (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {selectedStock.yapKod || '-'}{selectedStock.yapAcik ? ` - ${selectedStock.yapAcik}` : ''}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    <Package className="size-3 mr-1" />
                    {selectedStock.olcuAdi}
                  </Badge>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-2">
                    <Label>{t('warehouse.details.targetCellCode', { defaultValue: 'Missing translation' })}</Label>
                    <ShelfLookupCombobox
                      warehouseCode={selectedStock.depoKodu}
                      value={targetCellCode}
                      onValueChange={setTargetCellCode}
                      placeholder={t('warehouse.details.targetCellCodePlaceholder', { defaultValue: 'Missing translation' })}
                      searchPlaceholder={t('productionTransfer.create.cellSearch', { defaultValue: 'Missing translation' })}
                      emptyText={t('productionTransfer.create.targetCellEmpty', { defaultValue: 'Missing translation' })}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="h-9"
                      placeholder={t('subcontracting.srt.collection.quantity')}
                    />
                  </div>
                  <Button
                    onClick={handleCollect}
                    disabled={addBarcodeMutation.isPending}
                    className="h-9 w-full bg-emerald-500 text-white hover:bg-emerald-600 sm:w-auto"
                  >
                    {addBarcodeMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin mr-1" />
                    ) : null}
                    {t('subcontracting.srt.collection.collect')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto rounded-xl border border-slate-200/80 bg-white/70 p-4 space-y-2 dark:border-white/10 dark:bg-white/[0.02]">
        {isLoadingOrderLines ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : orderLinesWithCollected.length > 0 ? (
          orderLinesWithCollected.map((line) => (
            <Card key={line.id} className="border py-2">
              <CardContent className="px-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {line.stockCode}
                    </Badge>
                    <p className="text-xs font-medium line-clamp-2 mt-1">{line.stockName}</p>
                    {line.yapKod && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {t('subcontracting.srt.collection.yapKod')}: {line.yapKod}{line.yapAcik ? ` - ${line.yapAcik}` : ''}
                      </p>
                    )}
                  </div>
                  {line.remainingQuantity === 0 && (
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  )}
                </div>

                <div className="grid grid-cols-1 gap-1.5 mb-1.5 sm:grid-cols-3">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      {t('subcontracting.srt.collection.total')}
                    </p>
                    <p className="text-sm font-bold leading-none">
                      {line.quantity}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      {t('subcontracting.srt.collection.collected')}
                    </p>
                    <p className="text-sm font-bold text-emerald-600 leading-none">
                      {line.collectedQuantity}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      {t('subcontracting.srt.collection.remaining')}
                    </p>
                    <p className={`text-sm font-bold leading-none ${line.remainingQuantity === 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {line.remainingQuantity}
                    </p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${(line.collectedQuantity / line.quantity) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {t('subcontracting.srt.collection.noOrderLines')}
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 p-4 border-t bg-background">
        <Button
          onClick={handleComplete}
          disabled={completeSrtMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {completeSrtMutation.isPending ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Check className="size-4 mr-2" />
          )}
          {t('subcontracting.srt.collection.complete')}
        </Button>
      </div>

      <Dialog open={isCameraOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseCamera();
        }
      }}>
        <DialogContent className="max-w-[95vw] w-full p-0 gap-0" showCloseButton={true}>
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>{t('subcontracting.srt.collection.scanBarcode')}</DialogTitle>
            <DialogDescription>
              {t('subcontracting.srt.collection.scanBarcodeDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full" style={{ minHeight: '300px' }}>
            <div
              id="barcode-scanner-srt"
              ref={scannerContainerRef}
              className="w-full"
              style={{ minHeight: '300px' }}
            />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="border-2 border-white rounded-lg" style={{ width: '250px', height: '250px' }}>
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
